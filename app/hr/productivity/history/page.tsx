"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ArrowLeft, Clock, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProductivityHistory() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedEmp, setSelectedEmp] = useState("ALL");

  // Fetch Employees for Dropdown
  useEffect(() => {
    fetch("/api/employees").then(r => r.json()).then(setEmployees);
    fetchHistory(); // Initial load
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fromDate) params.append("from", fromDate);
    if (toDate) params.append("to", toDate);
    if (selectedEmp && selectedEmp !== "ALL") params.append("employeeId", selectedEmp);
    
    const res = await fetch(`/api/hr/productivity/history?${params.toString()}`);
    if (res.ok) setLogs(await res.json());
    setLoading(false);
  };

  // KPI Calculations (Memoized)
  const stats = useMemo(() => {
    if (!logs.length) return { total: 0, count: 0, maxTask: "-" };
    
    const totalMins = logs.reduce((sum, l:any) => sum + (l.durationMinutes || 0), 0);
    const maxTaskLog: any = logs.reduce((max:any, l:any) => (l.durationMinutes > (max.durationMinutes || 0) ? l : max), {});

    return {
        total: (totalMins / 60).toFixed(1),
        count: logs.length,
        maxTask: `${maxTaskLog.taskTitle} (${maxTaskLog.durationMinutes}m)`
    };
  }, [logs]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4"/>
        </Button>
        <h1 className="text-2xl font-bold">Productivity Archives</h1>
      </div>

      {/* FILTERS */}
      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-4 items-end">
            <div className="w-48">
                <label className="text-xs font-medium mb-1 block">Employee</label>
                <Select value={selectedEmp} onValueChange={setSelectedEmp}>
                    <SelectTrigger><SelectValue placeholder="All Employees" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Employees</SelectItem>
                        {employees.map((e: any) => (
                            <SelectItem key={e.id} value={e.id.toString()}>{e.firstName} {e.lastName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <label className="text-xs font-medium mb-1 block">From</label>
                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div>
                <label className="text-xs font-medium mb-1 block">To</label>
                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <Button onClick={fetchHistory}><Search className="mr-2 h-4 w-4"/> Search</Button>
        </CardContent>
      </Card>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
            <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full"><Clock className="h-6 w-6 text-blue-600"/></div>
                <div><p className="text-sm text-muted-foreground">Total Hours</p><h3 className="text-2xl font-bold">{stats.total} hrs</h3></div>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full"><TrendingUp className="h-6 w-6 text-green-600"/></div>
                <div><p className="text-sm text-muted-foreground">Longest Task</p><h3 className="text-sm font-bold truncate max-w-[150px]" title={stats.maxTask}>{stats.maxTask}</h3></div>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full"><Search className="h-6 w-6 text-purple-600"/></div>
                <div><p className="text-sm text-muted-foreground">Tasks Logged</p><h3 className="text-2xl font-bold">{stats.count}</h3></div>
            </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No records found</TableCell></TableRow>
              ) : (
                logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.startTime).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{log.attendanceRecord.employee.firstName} {log.attendanceRecord.employee.lastName}</TableCell>
                    <TableCell>{log.taskTitle}</TableCell>
                    <TableCell>{log.durationMinutes}m</TableCell>
                    <TableCell><Badge variant="outline">{log.status}</Badge></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
