"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserMinus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function OffboardDialog({ employeeId, employeeName }: { employeeId: number, employeeName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Form State
  const [date, setDate] = useState("");
  const [type, setType] = useState("RESIGNED");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return alert("Select Date");

    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}/resign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            dateOfLeaving: date,
            type,
            reason 
        })
      });

      if (res.ok) {
        alert(`${employeeName} has been offboarded.`);
        setOpen(false);
        window.location.reload(); // Force hard reload to update status
      } else {
        throw new Error("Failed");
      }
    } catch (error) {
      alert("Error processing offboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-red-600" title="Offboard">
          <UserMinus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Offboard {employeeName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Last Working Day</Label>
            <Input type="date" required onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select onValueChange={setType} defaultValue="RESIGNED">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="RESIGNED">Resignation</SelectItem>
                <SelectItem value="TERMINATED">Termination</SelectItem>
                <SelectItem value="ABSCONDING">Absconding</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reason / Remarks</Label>
            <Textarea 
              placeholder="e.g. Found better opportunity" 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              Confirm Offboarding
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
