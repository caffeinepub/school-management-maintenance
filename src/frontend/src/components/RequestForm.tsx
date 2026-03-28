import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSubmitRequest } from "../hooks/useQueries";

interface RequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
}

export function RequestForm({
  open,
  onOpenChange,
  userName,
}: RequestFormProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [location, setLocation] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expectedDate, setExpectedDate] = useState("");

  const submitRequest = useSubmitRequest();

  const reset = () => {
    setTitle("");
    setCategory("");
    setDescription("");
    setPriority("");
    setLocation("");
    setQuantity("");
    setExpectedDate("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !title ||
      !category ||
      !description ||
      !priority ||
      !location ||
      !expectedDate
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      await submitRequest.mutateAsync({
        title,
        submitterName: userName,
        categoryText: category,
        priorityText: priority,
        description,
        quantity: quantity ? BigInt(quantity) : undefined,
        expectedDate,
        location,
      });
      toast.success("Request submitted successfully!");
      reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to submit request. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="request_form.dialog"
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>New Requirement Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                data-ocid="request_form.input"
                placeholder="e.g. Broken projector in Room 204"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Category <span className="text-destructive">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-ocid="request_form.select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="LabEquipment">Lab Equipment</SelectItem>
                  <SelectItem value="Stationery">Stationery</SelectItem>
                  <SelectItem value="ITEquipment">IT Equipment</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>
                Priority <span className="text-destructive">*</span>
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger data-ocid="request_form.select">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Urgent">🔴 Urgent</SelectItem>
                  <SelectItem value="High">🟠 High</SelectItem>
                  <SelectItem value="Medium">🟡 Medium</SelectItem>
                  <SelectItem value="Low">🟢 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">
                Location / Room <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                data-ocid="request_form.input"
                placeholder="e.g. Room 204, Lab Block B"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity (optional)</Label>
              <Input
                id="quantity"
                data-ocid="request_form.input"
                type="number"
                min="1"
                placeholder="e.g. 5"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expectedDate">
                Expected Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="expectedDate"
                data-ocid="request_form.input"
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                data-ocid="request_form.textarea"
                placeholder="Describe the requirement in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="request_form.cancel_button"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={submitRequest.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="request_form.submit_button"
              disabled={submitRequest.isPending}
            >
              {submitRequest.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
