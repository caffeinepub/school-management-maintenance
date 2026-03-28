import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface RemarksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "approve" | "reject";
  requestTitle: string;
  onConfirm: (remarks: string) => Promise<void>;
}

export function RemarksDialog({
  open,
  onOpenChange,
  mode,
  requestTitle,
  onConfirm,
}: RemarksDialogProps) {
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(remarks);
      setRemarks("");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="remarks.dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {mode === "approve" ? "Approve Request" : "Reject Request"}
          </DialogTitle>
          <DialogDescription>
            {mode === "approve" ? "Approve" : "Reject"} &quot;{requestTitle}
            &quot;. Add remarks (optional).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="remarks">Remarks</Label>
          <Textarea
            id="remarks"
            data-ocid="remarks.textarea"
            placeholder="Enter your remarks here..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            data-ocid="remarks.cancel_button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            data-ocid="remarks.confirm_button"
            variant={mode === "reject" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading}
            className={
              mode === "approve" ? "bg-green-600 hover:bg-green-700" : ""
            }
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "approve" ? "Approve" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
