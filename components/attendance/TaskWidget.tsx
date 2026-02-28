"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Play, CheckCircle, PauseCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function TaskWidget() {
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [elapsed, setElapsed] = useState(0); // Seconds

  // Form States
  const [newTask, setNewTask] = useState("");
  const [estimate, setEstimate] = useState("60");
  const [note, setNote] = useState("");
  const [actionType, setActionType] = useState<"POSTPONE" | "CANCEL" | null>(null);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);

  // 1. Fetch Status on Mount
  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/attendance/today");
      if (res.ok) {
        const data = await res.json();
        if (data.attendance?.workLogs) {
          // Check for IN_PROGRESS task
          setTodayLogs(data.attendance.workLogs); // <--- SAVE LOGS
          const current = data.attendance?.workLogs?.find((l: any) => l.status === "IN_PROGRESS");
          if (current) {
            setActiveTask(current);
            // Calculate elapsed seconds since start
            const start = new Date(current.startTime).getTime();
            const now = new Date().getTime();
            setElapsed(Math.floor((now - start) / 1000));
          } else {
            setActiveTask(null);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  // 2. Timer Ticker
  useEffect(() => {
    let interval: any;
    if (activeTask) {
      interval = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTask]);

  // 3. Handlers
  const handleStart = async () => {
    if (!newTask) return;
    setLoading(true);
    await fetch("/api/attendance/task/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskTitle: newTask, estimatedMinutes: estimate })
    });
    setNewTask("");
    await fetchStatus();
  };

  const handleUpdate = async (action: "COMPLETE" | "POSTPONE" | "CANCEL") => {
    if ((action === "POSTPONE" || action === "CANCEL") && !note) {
       // Require note for negative actions? Or optional. Let's make optional for MVP or enforce via UI state.
       // Here we assume state 'note' is captured if dialog open.
    }
    
    setLoading(true);
    await fetch("/api/attendance/task/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: activeTask.id, action, note })
    });
    setNote("");
    setActionType(null); // Close dialogs
    await fetchStatus(); // Reset to Idle
  };

  // Helper: Format Seconds to HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  if (loading && !activeTask) return <Card className="h-full flex items-center justify-center p-8"><Loader2 className="animate-spin" /></Card>;

  return (
    <Card className="h-full border-blue-100 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center text-lg">
          <span>Current Activity</span>
          {activeTask ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 animate-pulse">● Live</Badge>
          ) : (
            <Badge variant="secondary">Idle</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* STATE 1: WORKING */}
        {activeTask ? (
          <div className="space-y-6">
            <div className="text-center py-4 bg-slate-50 rounded-lg border border-slate-100">
              <h3 className="font-semibold text-lg text-slate-800">{activeTask.taskTitle}</h3>
              <div className="text-4xl font-mono font-bold text-blue-600 mt-2">
                {formatTime(elapsed)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Target: {activeTask.estimatedMinutes} mins</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleUpdate("COMPLETE")}>
                <CheckCircle className="mr-2 h-4 w-4" /> Mark Complete
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                {/* POSTPONE DIALOG */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                      <PauseCircle className="mr-2 h-4 w-4" /> Postpone
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Postpone Task</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <Label>Reason for postponement</Label>
                      <Textarea placeholder="e.g. Adhoc meeting called..." onChange={e => setNote(e.target.value)} />
                      <Button onClick={() => handleUpdate("POSTPONE")}>Confirm Postpone</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* CANCEL DIALOG */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                      <XCircle className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Cancel Task</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <Label>Reason for cancellation</Label>
                      <Textarea placeholder="e.g. Requirement changed..." onChange={e => setNote(e.target.value)} />
                      <Button variant="destructive" onClick={() => handleUpdate("CANCEL")}>Confirm Cancel</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        ) : (
          
          /* STATE 2: IDLE (START NEW) */
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What are you working on?</Label>
              <Input 
                placeholder="e.g. Developing Login API" 
                value={newTask} 
                onChange={e => setNewTask(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Est. Time (Mins)</Label>
              <Input 
                type="number" 
                value={estimate} 
                onChange={e => setEstimate(e.target.value)} 
              />
            </div>
            <Button className="w-full" onClick={handleStart} disabled={!newTask}>
              <Play className="mr-2 h-4 w-4" /> Start Timer
            </Button>
          </div>
        )}
      {/* TODAY'S HISTORY */}
      <div className="border-t p-4 bg-slate-50">
        <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Today's Log</h4>
        <div className="max-h-40 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-8 text-xs">Task</TableHead>
                <TableHead className="h-8 text-xs text-right">Time</TableHead>
                <TableHead className="h-8 text-xs text-right">Target</TableHead>
                <TableHead className="h-8 text-xs text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todayLogs.map(log => {
                // Logic lives here
                const variance = log.durationMinutes > (log.estimatedMinutes * 1.25);
                const rowClass = variance ? "bg-red-50 text-red-900" : "border-b-0";
                return (
                  <TableRow key={log.id} className={rowClass}>
                    <TableCell className="py-1 text-sm">{log.taskTitle}</TableCell>
                    <TableCell className="py-1 text-xs text-right">{log.durationMinutes}m</TableCell>
                    <TableCell className="text-muted-foreground text-right">{log.estimatedMinutes}m</TableCell>
                    <TableCell className="py-1 text-right"><Badge variant="outline" className="text-[10px] h-5">{log.status}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      </CardContent>
    </Card>
  );
}
