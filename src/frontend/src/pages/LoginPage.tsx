import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  GraduationCap,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const features = [
  {
    key: "submit",
    icon: <ClipboardList className="h-5 w-5" />,
    title: "Submit Requests",
    desc: "Teachers can file maintenance and equipment requests",
  },
  {
    key: "approval",
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Authority Approval",
    desc: "HODs and Principals review and approve/reject requests",
  },
  {
    key: "admin",
    icon: <Users className="h-5 w-5" />,
    title: "Admin Fulfillment",
    desc: "Admin staff get notified and fulfill approved requests",
  },
];

export function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen flex" data-ocid="login.page">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-sidebar-foreground">
              SchoolManage
            </p>
            <p className="text-xs text-sidebar-foreground/60">
              School Management System
            </p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          <div>
            <h2 className="text-3xl font-bold text-sidebar-foreground leading-tight">
              Streamline School
              <br />
              Operations Efficiently
            </h2>
            <p className="mt-3 text-sidebar-foreground/70 text-sm leading-relaxed">
              A centralized platform for managing maintenance requests,
              equipment needs, and resource allocation.
            </p>
          </div>
          <div className="space-y-4">
            {features.map((f, i) => (
              <motion.div
                key={f.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex gap-3 items-start"
              >
                <div className="w-9 h-9 rounded-lg bg-sidebar-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-sidebar-foreground">{f.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-sidebar-foreground">
                    {f.title}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 mt-0.5">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        <p className="text-xs text-sidebar-foreground/40">
          © {new Date().getFullYear()} Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="underline hover:text-sidebar-foreground/60"
            target="_blank"
            rel="noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="flex lg:hidden items-center gap-3 justify-center">
            <div className="w-10 h-10 rounded-xl bg-sidebar flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <p className="text-lg font-bold text-foreground">SchoolManage</p>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to access the school management portal
            </p>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-card-md border border-border space-y-4">
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">
                Secure Authentication
              </p>
              <p className="text-xs text-muted-foreground">
                Powered by Internet Identity — no passwords needed
              </p>
            </div>
            <Button
              data-ocid="login.primary_button"
              onClick={login}
              disabled={isLoggingIn}
              className="w-full bg-sidebar hover:bg-sidebar/90 text-sidebar-foreground"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Connecting...
                </>
              ) : (
                "Sign In with Internet Identity"
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            First time? You&apos;ll be able to set up your profile after login.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
