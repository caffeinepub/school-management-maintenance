import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  Inbox,
  Loader2,
  Package,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Status } from "../backend.d";
import { Layout, adminNavItems } from "../components/Layout";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge";
import {
  useAllApprovedRequests,
  useAllRequests,
  useMarkCompleted,
  useMarkSeen,
  useMarkUnableToFulfill,
} from "../hooks/useQueries";

function formatDate(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(req: { status: Status; expectedDate?: string }): boolean {
  if (req.status !== Status.Seen) return false;
  if (!req.expectedDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reqDate = new Date(req.expectedDate);
  return reqDate <= today;
}

interface AdminDashboardProps {
  userName: string;
}

export function AdminDashboard({ userName }: AdminDashboardProps) {
  const [activePage, setActivePage] = useState("dashboard");
  const [actionId, setActionId] = useState<bigint | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [unableDialogOpen, setUnableDialogOpen] = useState(false);
  const [unableNote, setUnableNote] = useState("");
  const [pendingUnableId, setPendingUnableId] = useState<bigint | null>(null);

  const { data: approvedRequests = [], isLoading: loadingApproved } =
    useAllApprovedRequests();
  const { data: allRequests = [], isLoading: loadingAll } = useAllRequests();
  const markCompleted = useMarkCompleted();
  const markSeen = useMarkSeen();
  const markUnableToFulfill = useMarkUnableToFulfill();

  const completedRequests = allRequests.filter(
    (r) => r.status === Status.Completed,
  );

  // Active requests: Approved + Seen (not yet resolved)
  const activeRequests = approvedRequests.filter(
    (r) =>
      r.status === Status.Approved ||
      r.status === Status.Seen ||
      r.status === Status.UnableToFulfill,
  );

  const awaitingCount = approvedRequests.filter(
    (r) => r.status === Status.Approved || r.status === Status.Seen,
  ).length;

  const stats = [
    {
      label: "Awaiting Action",
      value: awaitingCount,
      icon: <Package className="h-5 w-5" />,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Completed",
      value: completedRequests.length,
      icon: <CheckCircle className="h-5 w-5" />,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Total Requests",
      value: allRequests.length,
      icon: <FileText className="h-5 w-5" />,
      color: "text-blue-600 bg-blue-50",
    },
  ];

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMarkSeen = async (id: bigint) => {
    setActionId(id);
    try {
      await markSeen.mutateAsync(id);
      toast.success("Request marked as seen — authority notified!");
    } catch {
      toast.error("Failed to update request.");
    } finally {
      setActionId(null);
    }
  };

  const handleMarkCompleted = async (id: bigint) => {
    setActionId(id);
    try {
      await markCompleted.mutateAsync(id);
      toast.success("Request marked as fulfilled — authority notified!");
    } catch {
      toast.error("Failed to update request.");
    } finally {
      setActionId(null);
    }
  };

  const openUnableDialog = (id: bigint) => {
    setPendingUnableId(id);
    setUnableNote("");
    setUnableDialogOpen(true);
  };

  const handleMarkUnableConfirm = async () => {
    if (!pendingUnableId) return;
    setActionId(pendingUnableId);
    setUnableDialogOpen(false);
    try {
      await markUnableToFulfill.mutateAsync({
        id: pendingUnableId,
        note: unableNote,
      });
      toast.success("Marked as unable to fulfill — authority notified!");
    } catch {
      toast.error("Failed to update request.");
    } finally {
      setActionId(null);
      setPendingUnableId(null);
    }
  };

  const categoryLabel: Record<string, string> = {
    Maintenance: "Maintenance",
    LabEquipment: "Lab Equipment",
    Stationery: "Stationery",
    ITEquipment: "IT Equipment",
    Other: "Other",
  };

  const RequestTable = ({
    requests,
    loading,
    showComplete,
    emptyOcid,
  }: {
    requests: typeof approvedRequests;
    loading: boolean;
    showComplete: boolean;
    emptyOcid: string;
  }) =>
    loading ? (
      <div data-ocid="admin.loading_state" className="p-6 space-y-3">
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
        <p className="text-xs text-muted-foreground mt-1">
          {showComplete
            ? "No approved requests awaiting action"
            : "No completed requests yet"}
        </p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              {showComplete && <TableHead className="w-8" />}
              <TableHead className="text-xs">Title</TableHead>
              <TableHead className="text-xs">Submitted By</TableHead>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Priority</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Submitted Date</TableHead>
              <TableHead className="text-xs">Required Date</TableHead>
              {showComplete && (
                <TableHead className="text-xs">Action</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req, idx) => {
              const idStr = String(req.id);
              const isExpanded = expandedIds.has(idStr);
              const isActing = actionId === req.id;
              const overdue = isOverdue(req);
              return (
                <>
                  <TableRow
                    key={idStr}
                    data-ocid={`admin.item.${idx + 1}`}
                    className={
                      overdue
                        ? "bg-red-50 border-l-4 border-red-400 hover:bg-red-100"
                        : "hover:bg-muted/20"
                    }
                  >
                    {showComplete && (
                      <TableCell className="w-8 p-2">
                        <button
                          type="button"
                          data-ocid={`admin.item.${idx + 1}.toggle`}
                          onClick={() => toggleExpanded(idStr)}
                          className="flex items-center justify-center w-6 h-6 rounded hover:bg-muted transition-colors"
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </TableCell>
                    )}
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
                    <TableCell className="text-sm text-muted-foreground">
                      {req.location}
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
                    {showComplete && (
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {req.status === Status.UnableToFulfill ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
                              <AlertTriangle className="h-3 w-3" /> Unable to
                              Fulfill
                            </span>
                          ) : (
                            <>
                              {req.status === Status.Seen && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-full px-2 py-0.5">
                                  <Eye className="h-3 w-3" /> Seen
                                </span>
                              )}
                              {req.status === Status.Approved && (
                                <Button
                                  data-ocid={`admin.item.${idx + 1}.secondary_button`}
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs text-sky-700 border-sky-300 hover:bg-sky-50"
                                  disabled={isActing}
                                  onClick={() => handleMarkSeen(req.id)}
                                >
                                  {isActing ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Eye className="h-3 w-3 mr-1" /> Seen
                                    </>
                                  )}
                                </Button>
                              )}
                              <Button
                                data-ocid={`admin.item.${idx + 1}.confirm_button`}
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-green-700 border-green-300 hover:bg-green-50"
                                disabled={isActing}
                                onClick={() => handleMarkCompleted(req.id)}
                              >
                                {isActing ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />{" "}
                                    Fulfilled
                                  </>
                                )}
                              </Button>
                              <Button
                                data-ocid={`admin.item.${idx + 1}.delete_button`}
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-orange-700 border-orange-300 hover:bg-orange-50"
                                disabled={isActing}
                                onClick={() => openUnableDialog(req.id)}
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" /> Not
                                Able
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                  {showComplete && isExpanded && (
                    <TableRow key={`${idStr}-details`} className="bg-muted/10">
                      <TableCell colSpan={10} className="p-0">
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-8 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-l-4 border-sky-300"
                        >
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                              Description
                            </p>
                            <p className="text-sm text-foreground">
                              {req.description || "—"}
                            </p>
                          </div>
                          {req.quantity !== undefined &&
                            req.quantity !== null && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                  Quantity
                                </p>
                                <p className="text-sm text-foreground">
                                  {String(req.quantity)}
                                </p>
                              </div>
                            )}
                          {req.reviewRemarks && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                Authority Remarks
                              </p>
                              <p className="text-sm text-foreground italic">
                                &ldquo;{req.reviewRemarks}&rdquo;
                              </p>
                            </div>
                          )}
                          {req.adminActionNote && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                Admin Note
                              </p>
                              <p className="text-sm text-foreground italic">
                                &ldquo;{req.adminActionNote}&rdquo;
                              </p>
                            </div>
                          )}
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
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
      navItems={adminNavItems(awaitingCount)}
      userName={userName}
      userRole="admin"
      notificationCount={awaitingCount}
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}
                    >
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {loadingApproved || loadingAll ? "—" : stat.value}
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

        {/* Approved Requests Table */}
        <Card className="shadow-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              Approved Requests
              {awaitingCount > 0 && (
                <span className="bg-amber-500 text-white text-xs rounded-full px-2 py-0.5">
                  {awaitingCount} awaiting
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <RequestTable
              requests={activeRequests}
              loading={loadingApproved}
              showComplete={true}
              emptyOcid="admin.approved.empty_state"
            />
          </CardContent>
        </Card>

        {/* Completed Requests */}
        <Card className="shadow-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">
              Completed Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <RequestTable
              requests={completedRequests}
              loading={loadingAll}
              showComplete={false}
              emptyOcid="admin.completed.empty_state"
            />
          </CardContent>
        </Card>
      </div>

      {/* Unable to Fulfill Dialog */}
      <Dialog open={unableDialogOpen} onOpenChange={setUnableDialogOpen}>
        <DialogContent data-ocid="admin.unable.dialog" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Unable to Fulfill
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="unable-note" className="text-sm font-medium">
              Reason / Note{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="unable-note"
              data-ocid="admin.unable.textarea"
              placeholder="Describe why this request cannot be fulfilled…"
              value={unableNote}
              onChange={(e) => setUnableNote(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              The authority will be notified of this decision.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              data-ocid="admin.unable.cancel_button"
              variant="outline"
              onClick={() => setUnableDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin.unable.confirm_button"
              variant="destructive"
              onClick={handleMarkUnableConfirm}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
