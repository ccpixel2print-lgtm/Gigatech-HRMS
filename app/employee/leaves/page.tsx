"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, CalendarDays, Loader2, Briefcase } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MyLeavesPage() {
  const [balances, setBalances] = useState([]);
  const [history, setHistory] = useState<{ leaves: any[], compOffs: any[] }>({ leaves: [], compOffs: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  // Form State
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  // Comp-Off State
  const [compOffDate, setCompOffDate] = useState("");
  const [compOffReason, setCompOffReason] = useState("");
  const [openCompOff, setOpenCompOff] = useState(false);

  const fetchData = async () => {
    try {
      const balRes = await fetch("/api/employee/leaves/balance");
      if (balRes.ok) setBalances(await balRes.json());

      const histRes = await fetch("/api/employee/leaves/history");
      if (histRes.ok) setHistory(await histRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveTypeId || !fromDate || !toDate) return alert("Fill all fields");

    // Calculate Days (Simple logic)
    const diffTime = Math.abs(new Date(toDate).getTime() - new Date(fromDate).getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 

    setSubmitting(true);
    try {
      const res = await fetch("/api/leaves/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveTypeId: Number(leaveTypeId), fromDate, toDate, days, reason })
      });

      if (!res.ok) throw new Error((await res.json()).error);
      
      alert("Application Submitted!");
      setOpen(false);
      fetchData(); // Refresh list
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCompOffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/leaves/compoff/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: compOffDate, reason: compOffReason })
      });
      if (res.ok) {
        alert("Comp-Off Request Submitted!");
        setOpenCompOff(false);
      } else {
        throw new Error("Failed");
      }
    } catch (e) {
      alert("Error submitting request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Leaves</h1>

      <div className="flex gap-3"> 
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Apply Leave</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <Label>Leave Type</Label>
                <Select onValueChange={setLeaveTypeId} value={leaveTypeId}>
                  <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                  <SelectContent>
                    {balances.map((b: any) => (
                      <SelectItem key={b.leaveType.id} value={b.leaveType.id.toString()}>
                        {b.leaveType.name} (Bal: {b.closing})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>From</Label><Input type="date" onChange={e => setFromDate(e.target.value)} required /></div>
                <div><Label>To</Label><Input type="date" onChange={e => setToDate(e.target.value)} required /></div>
              </div>
              <div>
                <Label>Reason</Label>
                <Textarea onChange={e => setReason(e.target.value)} required />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* COMP-OFF REQUEST DIALOG */}
        <Dialog open={openCompOff} onOpenChange={setOpenCompOff}>
          <DialogTrigger asChild>
            <Button variant="outline"><Briefcase className="w-4 h-4 mr-2" /> Request Comp-Off</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Request Comp-Off Credit</DialogTitle></DialogHeader>
            <form onSubmit={handleCompOffSubmit} className="space-y-4">
              <div>
                <Label>Date Worked</Label>
                <Input type="date" required onChange={e => setCompOffDate(e.target.value)} />
                <p className="text-xs text-muted-foreground">Select the holiday/weekend you worked.</p>
              </div>
              <div>
                <Label>Reason / Project</Label>
                <Textarea required placeholder="Worked on Prod Deployment..." onChange={e => setCompOffReason(e.target.value)} />
              </div>
              <Button type="submit">Submit Request</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {balances.map((b: any) => (
          <Card key={b.id}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{b.leaveType.code}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Number(b.closing)}</div>
              <p className="text-xs text-muted-foreground">{b.leaveType.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* History */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Request History</h2>
        
        <Tabs defaultValue="leaves" className="w-full">
          <TabsList>
            <TabsTrigger value="leaves">Leave Applications</TabsTrigger>
            <TabsTrigger value="compoffs">Comp-Off Requests</TabsTrigger>
          </TabsList>

          {/* TAB 1: LEAVES (Existing Table) */}
          <TabsContent value="leaves">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.leaves?.map((h: any) => (
                      <TableRow key={h.id}>
                        <TableCell><Badge variant="outline">{h.leaveType.code}</Badge></TableCell>
                        <TableCell>{new Date(h.fromDate).toLocaleDateString()} - {new Date(h.toDate).toLocaleDateString()}</TableCell>
                        <TableCell>{Number(h.totalDays)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{h.reason}</TableCell>
                        <TableCell>
                            <Badge className={h.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {h.status}
                            </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {history.leaves?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center h-24">No leave history</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: COMP-OFFS (New Table) */}
          <TabsContent value="compoffs">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Worked Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.compOffs?.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell>{new Date(c.workedDate).toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{c.reason}</TableCell>
                        <TableCell>+1 Day</TableCell>
                        <TableCell>
                            <Badge className={c.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {c.status === 'ACTIVE' ? 'APPROVED' : c.status}
                            </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {history.compOffs?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center h-24">No comp-off requests</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}