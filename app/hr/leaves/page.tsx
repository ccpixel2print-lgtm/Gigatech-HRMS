"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Briefcase } from "lucide-react";

export default function HRLeaveDashboard() {
  const [leaves, setLeaves] = useState([]);
  const [compOffs, setCompOffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [leaveRes, coRes] = await Promise.all([
            fetch("/api/hr/leaves"),
            fetch("/api/hr/compoffs")
        ]);
        if(leaveRes.ok) setLeaves(await leaveRes.json());
        if(coRes.ok) setCompOffs(await coRes.json());
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // LEAVE ACTION
  const handleLeaveAction = async (id: number, status: "APPROVED" | "REJECTED") => {
    if(!confirm(`Mark this leave as ${status}?`)) return;
    setProcessingId(id);
    try {
      await fetch(`/api/leaves/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      fetchData(); 
    } catch(e) { alert("Failed"); } 
    finally { setProcessingId(null); }
  };

  // COMP-OFF ACTION
  const handleCompOffAction = async (id: number) => {
    if(!confirm("Approve this Comp-Off Credit?")) return;
    setProcessingId(id);
    try {
      await fetch(`/api/hr/compoffs/${id}/approve`, { method: "POST" });
      fetchData();
    } catch(e) { alert("Failed"); }
    finally { setProcessingId(null); }
  };

  const pendingLeaves = leaves.filter((l: any) => l.status === "PENDING");
  const historyLeaves = leaves.filter((l: any) => l.status !== "PENDING");

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;
  
  const pendingCompOffsCount = compOffs.filter((c: any) => c.status === "PENDING").length;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Leave Management</h1>

      <Tabs defaultValue="leaves">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="leaves">Leave Requests ({pendingLeaves.length})</TabsTrigger>
          <TabsTrigger value="compoffs">Comp-Off Requests ({pendingCompOffsCount})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* TAB 1: LEAVES */}
        <TabsContent value="leaves" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingLeaves.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <div className="font-medium">{l.employee.firstName} {l.employee.lastName}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{l.leaveType.code}</Badge></TableCell>
                      <TableCell>{new Date(l.fromDate).toLocaleDateString()} - {new Date(l.toDate).toLocaleDateString()}</TableCell>
                      <TableCell>{Number(l.totalDays)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{l.reason}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleLeaveAction(l.id, "APPROVED")} disabled={processingId === l.id}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleLeaveAction(l.id, "REJECTED")} disabled={processingId === l.id}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pendingLeaves.length === 0 && <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No pending leaves</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: COMP-OFFS */}
        <TabsContent value="compoffs" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Worked Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                 {compOffs.filter((c: any) => c.status === "PENDING").map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">{c.employee.firstName} {c.employee.lastName}</div>
                      </TableCell>
                      <TableCell>{new Date(c.workedDate).toLocaleDateString()}</TableCell>
                      <TableCell className="max-w-[300px]">{c.reason}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleCompOffAction(c.id)} disabled={processingId === c.id}>
                          <Check className="w-4 h-4 mr-2" /> Approve Credit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {compOffs.length === 0 && <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No pending comp-offs</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: HISTORY */}
        <TabsContent value="history" className="mt-4">
          
          <Tabs defaultValue="leaves-hist">
            <div className="mb-4">
               <TabsList>
                 <TabsTrigger value="leaves-hist">Leave History</TabsTrigger>
                 <TabsTrigger value="co-hist">Comp-Off History</TabsTrigger>
               </TabsList>
            </div>

            {/* LEAVE HISTORY TABLE */}
            <TabsContent value="leaves-hist">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyLeaves.map((l: any) => (
                        <TableRow key={l.id}>
                          <TableCell>{l.employee.firstName} {l.employee.lastName}</TableCell>
                          <TableCell><Badge variant="outline">{l.leaveType.code}</Badge></TableCell>
                          <TableCell>{new Date(l.fromDate).toLocaleDateString()}</TableCell>
                          <TableCell><Badge>{l.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* COMP-OFF HISTORY TABLE (New) */}
            <TabsContent value="co-hist">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Worked Date</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Filter compOffs state for non-pending */}
                      {compOffs.filter((c:any) => c.status !== "PENDING").map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell>{c.employee.firstName} {c.employee.lastName}</TableCell>
                          <TableCell>{new Date(c.workedDate).toLocaleDateString()}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{c.reason}</TableCell>
                          <TableCell><Badge>{c.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
