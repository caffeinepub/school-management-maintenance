import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { GraduationCap } from "lucide-react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useUserProfile } from "./hooks/useQueries";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AuthorityDashboard } from "./pages/AuthorityDashboard";
import { LoginPage } from "./pages/LoginPage";
import { RoleSetupPage } from "./pages/RoleSetupPage";
import { TeacherDashboard } from "./pages/TeacherDashboard";

function LoadingScreen() {
  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center"
      data-ocid="app.loading_state"
    >
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-sidebar flex items-center justify-center mx-auto">
          <GraduationCap className="h-8 w-8 text-white" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-32 mx-auto" />
          <Skeleton className="h-3 w-24 mx-auto" />
        </div>
        <p className="text-sm text-muted-foreground">Loading SchoolManage...</p>
      </div>
    </div>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  if (isInitializing) return <LoadingScreen />;

  if (!identity)
    return (
      <>
        <LoginPage />
        <Toaster richColors position="top-right" />
      </>
    );

  if (profileLoading) return <LoadingScreen />;

  // No profile or unknown role → setup
  if (
    !profile ||
    !profile.role ||
    !["teacher", "authority", "admin"].includes(profile.role)
  ) {
    return (
      <>
        <RoleSetupPage />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  return (
    <>
      {profile.role === "teacher" && (
        <TeacherDashboard userName={profile.name} />
      )}
      {profile.role === "authority" && (
        <AuthorityDashboard userName={profile.name} />
      )}
      {profile.role === "admin" && <AdminDashboard userName={profile.name} />}
      <Toaster richColors position="top-right" />
    </>
  );
}
