"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";

export default function HRLeaveDashboard() {
  const [leaves, setLeaves] = useState([]);
  const [compOffs, setCompOffs] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [leaveRes, coRes, balRes] = await Promise.all([
            fetch("/api/hr/leaves"),
            fetch("/api/hr/compoffs"),
            fetch("/api/hr/leaves/balances")
        ]);
        
        if(leaveRes.ok) setLeaves(await leaveRes.json());
        if(coRes.ok) setCompOffs(await coRes.json());
        if(balRes.ok) setBalances(await balRes.json());
        
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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
  const pendingCompOffs = compOffs.filter((c: any) => c.status === "PENDING");
  const historyCompOffs = compOffs.filter((c: any) => c.status !== "PENDING");

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Leave Management</h1>

      <Tabs defaultValue="leaves">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="leaves">Leave Requests ({pendingLeaves.length})</TabsTrigger>
          <TabsTrigger value="compoffs">Comp-Off Requests ({pendingCompOffs.length})</TabsTrigger>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
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
                  {pendingLeaves.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No pending leaves</TableCell></TableRow>
                  ) : (
                    pendingLeaves.map((l: any) => (
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
                    ))
                  )}
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
                  {pendingCompOffs.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No pending comp-offs</TableCell></TableRow>
                  ) : (
                    pendingCompOffs.map((c: any) => (
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
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: BALANCES */}
        <TabsContent value="balances" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-center">CL</TableHead>
                    <TableHead className="text-center">SL</TableHead>
                    <TableHead className="text-center">EL</TableHead>
                    <TableHead className="text-center">CO</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((emp: any) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                        <div className="text-xs text-muted-foreground">{emp.employeeCode}</div>
                      </TableCell>
                      {['CL', 'SL', 'EL', 'CO'].map(code => {
                        const b = emp.balances[code];
                        return (
                          <TableCell key={code} className="text-center">
                            {b ? (
                              <div className="flex flex-col items-center">
                                <span className={`font-bold ${Number(b.balance) < 0 ? 'text-red-500' : 'text-slate-700'}`}>
                                  {b.balance}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  Used: {b.used}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: HISTORY */}
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
                        <TableHead className="text-right">Days</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyLeaves.map((l: any) => (
                        <TableRow key={l.id}>
                          <TableCell>
                            <div className="font-medium">{l.employee.firstName} {l.employee.lastName}</div>
                            <div className="text-xs text-muted-foreground">{l.employee.employeeCode}</div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{l.leaveType.code}</Badge></TableCell>
                          <TableCell>
                             <div className="flex flex-col text-xs">
                               <span>{new Date(l.fromDate).toLocaleDateString()}</span>
                               <span className="text-muted-foreground">to</span>
                               <span>{new Date(l.toDate).toLocaleDateString()}</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{Number(l.totalDays)}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={l.reason}>
                            {l.reason}
                          </TableCell>
                          <TableCell>
                            <Badge className={l.status === 'APPROVED' ? 'bg-green-100 text-green-800' : l.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'}>
                                {l.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* COMP-OFF HISTORY TABLE */}
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
                      {historyCompOffs.map((c: any) => (
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
