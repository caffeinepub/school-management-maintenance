import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Inbox,
  Plus,
  XCircle,
} from "lucide-react";
import { Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Status } from "../backend.d";
import { Layout, teacherNavItems } from "../components/Layout";
import { RequestForm } from "../components/RequestForm";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge";
import { useMyRequests } from "../hooks/useQueries";
import { SuperAdminPage } from "./SuperAdminPage";

function formatDate(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatExpectedDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(req: { status: Status; expectedDate: string }) {
  if (req.status !== Status.Approved && req.status !== Status.Seen)
    return false;
  if (!req.expectedDate) return false;
  const due = new Date(req.expectedDate);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due <= today;
}

interface TeacherDashboardProps {
  userName: string;
  showManageUsers?: boolean;
}

export function TeacherDashboard({
  userName,
  showManageUsers = false,
}: TeacherDashboardProps) {
  const [activePage, setActivePage] = useState("dashboard");
  const [formOpen, setFormOpen] = useState(false);
  const { data: requests = [], isLoading } = useMyRequests();

  const overdueCount = requests.filter(isOverdue).length;

  const stats = [
    {
      label: "Total Requests",
      value: requests.length,
      icon: <FileText className="h-5 w-5" />,
      color: "text-blue-600 bg-blue-50",
      pulse: false,
    },
    {
      label: "Pending",
      value: requests.filter((r) => r.status === Status.Pending).length,
      icon: <Clock className="h-5 w-5" />,
      color: "text-amber-600 bg-amber-50",
      pulse: false,
    },
    {
      label: "Approved",
      value: requests.filter(
        (r) => r.status === Status.Approved || r.status === Status.Completed,
      ).length,
      icon: <CheckCircle className="h-5 w-5" />,
      color: "text-green-600 bg-green-50",
      pulse: false,
    },
    {
      label: "Rejected",
      value: requests.filter((r) => r.status === Status.Rejected).length,
      icon: <XCircle className="h-5 w-5" />,
      color: "text-red-600 bg-red-50",
      pulse: false,
    },
    {
      label: "Overdue",
      value: overdueCount,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "text-red-600 bg-red-50",
      pulse: overdueCount > 0,
    },
  ];

  const categoryLabel: Record<string, string> = {
    Maintenance: "Maintenance",
    LabEquipment: "Lab Equipment",
    Stationery: "Stationery",
    ITEquipment: "IT Equipment",
    Other: "Other",
  };

  return (
    <Layout
      activePage={activePage}
      onPageChange={setActivePage}
      navItems={
        showManageUsers
          ? [
              ...teacherNavItems,
              {
                label: "Manage Users",
                icon: <Users className="h-4 w-4" />,
                id: "manage-users",
              },
            ]
          : teacherNavItems
      }
      userName={userName}
      userRole="teacher"
    >
      {activePage === "manage-users" ? (
        <SuperAdminPage />
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="shadow-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}${
                          stat.pulse ? " animate-pulse ring-2 ring-red-400" : ""
                        }`}
                      >
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {isLoading ? "—" : stat.value}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Requests Table */}
          <Card className="shadow-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold">
                My Requests
              </CardTitle>
              <Button
                data-ocid="teacher.open_modal_button"
                onClick={() => setFormOpen(true)}
                size="sm"
                className="bg-sidebar hover:bg-sidebar/90 text-sidebar-foreground gap-1.5"
              >
                <Plus className="h-4 w-4" />
                New Request
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div
                  data-ocid="teacher.loading_state"
                  className="p-6 space-y-3"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : requests.length === 0 ? (
                <div
                  data-ocid="teacher.empty_state"
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">
                    No requests yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click &quot;New Request&quot; to submit your first
                    requirement
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs">Title</TableHead>
                        <TableHead className="text-xs">Category</TableHead>
                        <TableHead className="text-xs">Priority</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">
                          Submitted Date
                        </TableHead>
                        <TableHead className="text-xs">Required Date</TableHead>
                        <TableHead className="text-xs">Location</TableHead>
                        <TableHead className="text-xs">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((req, idx) => (
                        <TableRow
                          key={String(req.id)}
                          data-ocid={`teacher.item.${idx + 1}`}
                          className={
                            isOverdue(req)
                              ? "bg-red-50 border-l-2 border-l-red-500"
                              : ""
                          }
                        >
                          <TableCell className="font-medium text-sm max-w-[180px] truncate">
                            {req.title}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {categoryLabel[req.category] ?? req.category}
                          </TableCell>
                          <TableCell>
                            <PriorityBadge priority={req.priority} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={req.status} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(req.submittedAt)}
                          </TableCell>
                          <TableCell
                            className={`text-sm whitespace-nowrap ${
                              isOverdue(req)
                                ? "text-red-600 font-bold"
                                : "text-muted-foreground"
                            }`}
                          >
                            {isOverdue(req) && (
                              <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded mr-1 font-semibold">
                                Overdue
                              </span>
                            )}
                            {formatExpectedDate(req.expectedDate)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {req.location}
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px]">
                            {(req.status === Status.Approved ||
                              req.status === Status.Rejected) &&
                            req.reviewRemarks ? (
                              <span className="text-xs text-muted-foreground italic">
                                {req.reviewRemarks}
                              </span>
                            ) : req.status === Status.UnableToFulfill &&
                              req.adminActionNote ? (
                              <span className="text-xs text-orange-600 italic">
                                Admin: {req.adminActionNote}
                              </span>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <RequestForm
        open={formOpen}
        onOpenChange={setFormOpen}
        userName={userName}
      />
    </Layout>
  );
}
