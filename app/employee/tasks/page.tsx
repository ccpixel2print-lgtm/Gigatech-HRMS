"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";

export default function TaskHistoryPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");

  const fetchHistory = async () => {
    setLoading(true);
    // Fetch with date filter if provided
    const query = dateFilter ? `?date=${dateFilter}` : "";
    const res = await fetch(`/api/employee/tasks/history${query}`);
    if (res.ok) setLogs(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchHistory(); }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Task History</h1>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <Input type="date" className="w-48" onChange={e => setDateFilter(e.target.value)} />
            <Button onClick={fetchHistory}><Search className="w-4 h-4 mr-2"/> Filter</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="animate-spin inline"/></TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No tasks found</TableCell></TableRow>
              ) : (
                logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.startTime).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{log.taskTitle}</TableCell>
                    <TableCell>{log.durationMinutes} mins</TableCell>
                    <TableCell><Badge variant="outline">{log.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{log.completionNote || "-"}</TableCell>
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
