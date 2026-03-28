import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2, Shield, Wrench } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveProfile } from "../hooks/useQueries";

const roles = [
  {
    id: "teacher",
    label: "Teacher",
    desc: "Submit maintenance and equipment requests for your classes",
    icon: <GraduationCap className="h-6 w-6" />,
    color: "border-blue-300 bg-blue-50 text-blue-700",
    selectedColor: "border-blue-500 bg-blue-100 ring-2 ring-blue-400",
  },
  {
    id: "authority",
    label: "Authority (HOD/Principal)",
    desc: "Review and approve or reject submitted requests",
    icon: <Shield className="h-6 w-6" />,
    color: "border-purple-300 bg-purple-50 text-purple-700",
    selectedColor: "border-purple-500 bg-purple-100 ring-2 ring-purple-400",
  },
  {
    id: "admin",
    label: "Admin Staff",
    desc: "Receive notifications and fulfill approved requests",
    icon: <Wrench className="h-6 w-6" />,
    color: "border-green-300 bg-green-50 text-green-700",
    selectedColor: "border-green-500 bg-green-100 ring-2 ring-green-400",
  },
];

export function RoleSetupPage() {
  const [selectedRole, setSelectedRole] = useState("");
  const [name, setName] = useState("");
  const saveProfile = useSaveProfile();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!selectedRole) {
      toast.error("Please select your role");
      return;
    }
    try {
      await saveProfile.mutateAsync({ name: name.trim(), role: selectedRole });
      toast.success("Profile set up successfully!");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-6"
      data-ocid="role_setup.page"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-sidebar flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Set Up Your Profile
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us who you are to get started
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card-md p-6 space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Your Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              data-ocid="role_setup.input"
              placeholder="e.g. Dr. Sarah Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Select Your Role <span className="text-destructive">*</span>
            </Label>
            <div className="space-y-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  data-ocid={`role_setup.${role.id}.button`}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedRole === role.id
                      ? role.selectedColor
                      : `${role.color} hover:opacity-80`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div>{role.icon}</div>
                    <div>
                      <p className="text-sm font-semibold">{role.label}</p>
                      <p className="text-xs opacity-70 mt-0.5">{role.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Button
            data-ocid="role_setup.submit_button"
            onClick={handleSubmit}
            disabled={saveProfile.isPending}
            className="w-full bg-sidebar hover:bg-sidebar/90 text-sidebar-foreground"
            size="lg"
          >
            {saveProfile.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Get Started
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
