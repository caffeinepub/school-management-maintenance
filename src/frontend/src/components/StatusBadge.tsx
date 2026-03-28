import { Badge } from "@/components/ui/badge";
import { Priority, Status } from "../backend.d";

export function StatusBadge({ status }: { status: Status }) {
  const config: Record<Status, { label: string; className: string }> = {
    [Status.Pending]: {
      label: "Pending",
      className:
        "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
    },
    [Status.Approved]: {
      label: "Approved",
      className:
        "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
    },
    [Status.Rejected]: {
      label: "Rejected",
      className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
    },
    [Status.Completed]: {
      label: "Completed",
      className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
    },
    [Status.Seen]: {
      label: "Seen",
      className: "bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-100",
    },
    [Status.UnableToFulfill]: {
      label: "Unable to Fulfill",
      className:
        "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100",
    },
  };
  const { label, className } = config[status] ?? {
    label: status,
    className: "",
  };
  return (
    <Badge variant="outline" className={`text-xs font-medium ${className}`}>
      {label}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config: Record<Priority, { label: string; className: string }> = {
    [Priority.Urgent]: {
      label: "Urgent",
      className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
    },
    [Priority.High]: {
      label: "High",
      className:
        "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100",
    },
    [Priority.Medium]: {
      label: "Medium",
      className:
        "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
    },
    [Priority.Low]: {
      label: "Low",
      className:
        "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
    },
  };
  const { label, className } = config[priority] ?? {
    label: priority,
    className: "",
  };
  return (
    <Badge variant="outline" className={`text-xs font-medium ${className}`}>
      {label}
    </Badge>
  );
}
