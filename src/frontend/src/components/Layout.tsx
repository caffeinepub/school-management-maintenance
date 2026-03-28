import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckSquare,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSaveProfile } from "../hooks/useQueries";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  id: string;
  badge?: number;
}

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onPageChange: (page: string) => void;
  navItems: NavItem[];
  userName: string;
  userRole: string;
  notificationCount?: number;
}

const ALL_ROLES = [
  { id: "teacher", label: "Teacher" },
  { id: "authority", label: "Authority" },
  { id: "admin", label: "Admin Staff" },
];

export function Layout({
  children,
  activePage,
  onPageChange,
  navItems,
  userName,
  userRole,
  notificationCount = 0,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const { clear } = useInternetIdentity();
  const saveProfile = useSaveProfile();
  const queryClient = useQueryClient();

  const handleSwitchRole = async (newRole: string) => {
    if (newRole === userRole) return;
    setSwitchingRole(false);
    try {
      await saveProfile.mutateAsync({ name: userName, role: newRole });
      await queryClient.invalidateQueries();
      toast.success(
        `Switched to ${ALL_ROLES.find((r) => r.id === newRole)?.label ?? newRole} role`,
      );
    } catch {
      toast.error("Failed to switch role. Please try again.");
    }
  };

  const roleLabel: Record<string, string> = {
    teacher: "Teacher",
    authority: "Authority",
    admin: "Admin Staff",
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-sidebar-foreground leading-tight">
            SchoolManage
          </p>
          <p className="text-xs text-sidebar-foreground/60">
            Management System
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            type="button"
            key={item.id}
            data-ocid={`nav.${item.id}.link`}
            onClick={() => {
              onPageChange(item.id);
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
              activePage === item.id
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
            {(item.badge ?? 0) > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-primary text-white text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {userName}
            </p>
            <p className="text-xs text-sidebar-foreground/60">
              {roleLabel[userRole] ?? userRole}
            </p>
          </div>
        </div>

        {/* Switch Role */}
        <div className="mb-1">
          <button
            type="button"
            data-ocid="nav.switch_role.button"
            onClick={() => setSwitchingRole(!switchingRole)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Switch Role</span>
          </button>
          {switchingRole && (
            <div className="mt-1 ml-3 space-y-0.5">
              {ALL_ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleSwitchRole(role.id)}
                  className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${
                    userRole === role.id
                      ? "bg-sidebar-accent text-sidebar-foreground font-semibold"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                  }`}
                >
                  {role.label} {userRole === role.id ? "(current)" : ""}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          data-ocid="nav.logout.button"
          onClick={clear}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-shrink-0 flex-col bg-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/50 md:hidden w-full"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
        />
      )}
      <motion.aside
        initial={{ x: -240 }}
        animate={{ x: sidebarOpen ? 0 : -240 }}
        transition={{ duration: 0.2 }}
        className="fixed left-0 top-0 z-50 w-60 h-full bg-sidebar flex flex-col md:hidden"
      >
        <SidebarContent />
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-3.5 bg-card border-b border-border shadow-xs flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <h1 className="text-lg font-semibold text-foreground capitalize">
              {navItems.find((n) => n.id === activePage)?.label ?? "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {notificationCount > 0 && (
              <div className="relative">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {notificationCount}
                </span>
              </div>
            )}
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">
                {roleLabel[userRole] ?? userRole}
              </p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-5">{children}</main>
      </div>
    </div>
  );
}

export const teacherNavItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    id: "dashboard",
  },
  {
    label: "My Requests",
    icon: <FileText className="h-4 w-4" />,
    id: "requests",
  },
];

export const authorityNavItems = (): NavItem[] => [
  {
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    id: "dashboard",
  },
  {
    label: "Approvals",
    icon: <CheckSquare className="h-4 w-4" />,
    id: "approvals",
  },
  { label: "History", icon: <FileText className="h-4 w-4" />, id: "history" },
];

export const adminNavItems = (approvedCount: number): NavItem[] => [
  {
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    id: "dashboard",
  },
  {
    label: "Approved Requests",
    icon: <CheckSquare className="h-4 w-4" />,
    id: "approved",
    badge: approvedCount,
  },
  {
    label: "Completed",
    icon: <FileText className="h-4 w-4" />,
    id: "completed",
  },
];
