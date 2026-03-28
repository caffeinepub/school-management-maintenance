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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Check,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Inbox,
  X,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { type Request, Status } from "../backend.d";
import { Layout, authorityNavItems } from "../components/Layout";
import { RemarksDialog } from "../components/RemarksDialog";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge";
import {
  useAllPendingRequests,
  useAllRequests,
  useApproveRequest,
  useRejectRequest,
} from "../hooks/useQueries";

function formatDate(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Overdue for authority: admin has not fulfilled or marked unable, required date has passed
function isOverdueForAuthority(req: Request): boolean {
  if (req.status !== Status.Approved && req.status !== Status.Seen)
    return false;
  if (!req.expectedDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reqDate = new Date(req.expectedDate);
  return reqDate <= today;
}

interface AuthorityDashboardProps {
  userName: string;
}

export function AuthorityDashboard({ userName }: AuthorityDashboardProps) {
  const [activePage, setActivePage] = useState("dashboard");
  const [remarksOpen, setRemarksOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [remarksMode, setRemarksMode] = useState<"approve" | "reject">(
    "approve",
  );

  const { data: pendingRequests = [], isLoading: loadingPending } =
    useAllPendingRequests();
  const { data: allRequests = [], isLoading: loadingAll } = useAllRequests();
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();

  const reviewedRequests = allRequests.filter(
    (r) => r.status !== Status.Pending,
  );

  const stats = [
    {
      label: "Pending Approval",
      value: pendingRequests.length,
      icon: <Clock className="h-5 w-5" />,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Approved",
      value: allRequests.filter(
        (r) =>
          r.status === Status.Approved ||
          r.status === Status.Completed ||
          r.status === Status.Seen ||
          r.status === Status.UnableToFulfill,
      ).length,
      icon: <CheckCircle className="h-5 w-5" />,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Rejected",
      value: allRequests.filter((r) => r.status === Status.Rejected).length,
      icon: <XCircle className="h-5 w-5" />,
      color: "text-red-600 bg-red-50",
    },
    {
      label: "Total Requests",
      value: allRequests.length,
      icon: <FileText className="h-5 w-5" />,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Overdue",
      value: allRequests.filter(isOverdueForAuthority).length,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "text-red-600 bg-red-50",
      overdue: true,
    },
  ];

  const openRemarks = (req: Request, mode: "approve" | "reject") => {
    setSelectedRequest(req);
    setRemarksMode(mode);
    setRemarksOpen(true);
  };

  const handleConfirm = async (remarks: string) => {
    if (!selectedRequest) return;
    try {
      if (remarksMode === "approve") {
        await approveRequest.mutateAsync({ id: selectedRequest.id, remarks });
        toast.success("Request approved successfully");
      } else {
        await rejectRequest.mutateAsync({ id: selectedRequest.id, remarks });
        toast.success("Request rejected");
      }
    } catch {
      toast.error("Action failed. Please try again.");
      throw new Error("failed");
    }
  };

  const categoryLabel: Record<string, string> = {
    Maintenance: "Maintenance",
    LabEquipment: "Lab Equipment",
    Stationery: "Stationery",
    ITEquipment: "IT Equipment",
    Other: "Other",
  };

  const FulfilledBadge = ({
    status,
    adminActionNote,
  }: { status: Status; adminActionNote?: string }) => {
    if (status === Status.Completed) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
          <Check className="h-3 w-3" /> Fulfilled
        </span>
      );
    }
    if (status === Status.Seen) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-full px-2 py-0.5">
          <Eye className="h-3 w-3" /> Seen by Admin
        </span>
      );
    }
    if (status === Status.UnableToFulfill) {
      return (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
            <AlertTriangle className="h-3 w-3" /> Unable to Fulfill
          </span>
          {adminActionNote && (
            <span className="text-xs text-orange-600 italic">
              {adminActionNote}
            </span>
          )}
        </div>
      );
    }
    if (status === Status.Rejected) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
          <X className="h-3 w-3" /> Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
        <Clock className="h-3 w-3" /> Pending
      </span>
    );
  };

  const RequestsTable = ({
    requests,
    loading,
    emptyOcid,
  }: { requests: Request[]; loading: boolean; emptyOcid: string }) =>
    loading ? (
      <div data-ocid="authority.loading_state" className="p-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    ) : requests.length === 0 ? (
      <div
        data-ocid={emptyOcid}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">No requests here</p>
        <p className="text-xs text-muted-foreground mt-1">All caught up!</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs">Title</TableHead>
              <TableHead className="text-xs">Submitted By</TableHead>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Priority</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Submitted Date</TableHead>
              <TableHead className="text-xs">Required Date</TableHead>
              <TableHead className="text-xs">Admin Status</TableHead>
              <TableHead className="text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req, idx) => {
              const overdue = isOverdueForAuthority(req);
              return (
                <TableRow
                  key={String(req.id)}
                  data-ocid={`authority.item.${idx + 1}`}
                  className={
                    overdue
                      ? "bg-red-50 border-l-4 border-red-400 hover:bg-red-100"
                      : undefined
                  }
                >
                  <TableCell className="font-medium text-sm max-w-[150px] truncate">
                    <span className="flex items-center gap-1.5">
                      {req.title}
                      {overdue && (
                        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-700 bg-red-100 border border-red-300 rounded-full px-1.5 py-0.5 shrink-0">
                          <AlertTriangle className="h-3 w-3" /> Overdue
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {req.submittedByName}
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
                  <TableCell className="text-sm whitespace-nowrap">
                    <span
                      className={
                        overdue
                          ? "font-semibold text-red-700"
                          : "text-muted-foreground"
                      }
                    >
                      {req.expectedDate || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <FulfilledBadge
                      status={req.status}
                      adminActionNote={req.adminActionNote || undefined}
                    />
                  </TableCell>
                  <TableCell>
                    {req.status === Status.Pending && (
                      <div className="flex gap-1.5">
                        <Button
                          data-ocid={`authority.item.${idx + 1}.confirm_button`}
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-green-700 border-green-300 hover:bg-green-50"
                          onClick={() => openRemarks(req, "approve")}
                        >
                          <Check className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button
                          data-ocid={`authority.item.${idx + 1}.delete_button`}
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-red-700 border-red-300 hover:bg-red-50"
                          onClick={() => openRemarks(req, "reject")}
                        >
                          <X className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                    {req.reviewRemarks && (
                      <span className="text-xs text-muted-foreground italic block">
                        &quot;{req.reviewRemarks}&quot;
                      </span>
                    )}
                    {req.adminActionNote && (
                      <span className="text-xs text-orange-600 italic block mt-0.5">
                        Note: &quot;{req.adminActionNote}&quot;
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );

  return (
    <Layout
      activePage={activePage}
      onPageChange={setActivePage}
      navItems={authorityNavItems()}
      userName={userName}
      userRole="authority"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className={`shadow-card border-border relative overflow-hidden ${"overdue" in stat && stat.overdue && !loadingAll && stat.value > 0 ? "ring-2 ring-red-400" : ""}`}
              >
                {"overdue" in stat &&
                  stat.overdue &&
                  !loadingAll &&
                  stat.value > 0 && (
                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                    </span>
                  )}
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}
                    >
                      {stat.icon}
                    </div>
                    <div>
                      <p
                        className={`text-2xl font-bold ${"overdue" in stat && stat.overdue && !loadingAll && stat.value > 0 ? "text-red-600" : "text-foreground"}`}
                      >
                        {loadingPending || loadingAll ? "—" : stat.value}
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

        {/* Tabs */}
        <Card className="shadow-card border-border">
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-semibold">
              Requests Management
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <Tabs defaultValue="pending">
              <div className="px-6">
                <TabsList
                  data-ocid="authority.tab"
                  className="grid w-full max-w-xs grid-cols-2"
                >
                  <TabsTrigger value="pending">
                    Pending
                    {pendingRequests.length > 0 && (
                      <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full w-4 h-4 inline-flex items-center justify-center">
                        {pendingRequests.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="pending" className="mt-4">
                <RequestsTable
                  requests={pendingRequests}
                  loading={loadingPending}
                  emptyOcid="authority.pending.empty_state"
                />
              </TabsContent>
              <TabsContent value="history" className="mt-4">
                <RequestsTable
                  requests={reviewedRequests}
                  loading={loadingAll}
                  emptyOcid="authority.history.empty_state"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {selectedRequest && (
        <RemarksDialog
          open={remarksOpen}
          onOpenChange={setRemarksOpen}
          mode={remarksMode}
          requestTitle={selectedRequest.title}
          onConfirm={handleConfirm}
        />
      )}
    </Layout>
  );
}
