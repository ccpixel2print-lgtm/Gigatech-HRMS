"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, History, Clock } from "lucide-react";
import Link from "next/link";

export default function HRProductivityPage() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Drill Down State
  const [selectedEmp, setSelectedEmp] = useState<any>(null); // Stores ID/Name
  const [empLogs, setEmpLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/hr/productivity/summary")
      .then(r => r.json())
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  const handleOpenDetails = async (emp: any) => {
    setSelectedEmp(emp);
    setOpen(true);
    setLoadingLogs(true);
    try {
        // Fetch logs for TODAY for this specific employee
        // We reuse the history API but filter by date=today and empId
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch(`/api/hr/productivity/history?employeeId=${emp.id}&from=${today}&to=${today}`);
        if(res.ok) setEmpLogs(await res.json());
    } finally {
        setLoadingLogs(false);
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold">Productivity Monitor</h1>
            <p className="text-muted-foreground">Real-time status of your team.</p>
        </div>
        <Link href="/hr/productivity/history">
            <Button variant="outline"><History className="mr-2 h-4 w-4"/> View Historical Reports</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {summary.map((emp: any) => (
          <Card key={emp.id} className="hover:shadow-md cursor-pointer transition-all hover:border-blue-200" onClick={() => handleOpenDetails(emp)}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg">{emp.name}</h3>
                        <p className="text-xs text-muted-foreground">{emp.designation}</p>
                    </div>
                    <Badge variant={emp.status === "Working" ? "default" : "secondary"} className={emp.status === "Working" ? "bg-green-600 hover:bg-green-600" : ""}>
                        {emp.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-2xl font-bold">{emp.totalHours}</span>
                    <span className="text-xs text-muted-foreground self-end mb-1">hrs today</span>
                </div>
                <div className="bg-slate-50 p-2 rounded text-xs text-slate-600 truncate border">
                    {emp.currentTask !== "-" ? "▶ " + emp.currentTask : "No active task"}
                </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* DETAIL SHEET */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-[600px] sm:w-[540px]">
            <SheetHeader>
                <SheetTitle>{selectedEmp?.name} - Today's Log</SheetTitle>
                <SheetDescription>Detailed breakdown of tasks performed today.</SheetDescription>
            </SheetHeader>
            <div className="mt-6">
                {loadingLogs ? <Loader2 className="animate-spin mx-auto" /> : (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Task</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {empLogs.map((log: any) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">{log.taskTitle}</TableCell>
                                        <TableCell>{log.durationMinutes}m</TableCell>
                                        <TableCell><Badge variant="outline">{log.status}</Badge></TableCell>
                                    </TableRow>
                                ))}
                                {empLogs.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No logs found</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
