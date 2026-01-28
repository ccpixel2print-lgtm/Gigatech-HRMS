"use client";

import { useState, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Save, Lock, Loader2, ChevronDown, ChevronUp, History } from "lucide-react";
import Link from "next/link";

// Helper to safely parse API strings to numbers
const toNum = (val: string | number | null | undefined) => {
  if (!val) return 0;
  return typeof val === 'string' ? parseFloat(val) : val;
};

// Types matching your API response
interface PayrollRecord {
  id: number; // Changed to number to match your DB
  employee: { firstName: string; lastName: string; employeeCode: string };
  basicSalary: string;
  grossSalary: string; // Changed from grossEarnings
  netSalary: string;   // Changed from netPay
  lopDays: string;
  otherAllowances: string; // Changed from otherAllowance
  otherDeductions: string;
  totalDeductions: string;
  status: "DRAFT" | "PROCESSED" | "PAID";
}

export default function PayrollPage() {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Max allowed date (Next Month)
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const maxMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (id: number) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  const handleGenerate = async () => {
    if (!selectedMonth) return alert("Please select a month");

    const [year, month] = selectedMonth.split("-").map(Number);
    
    // Future Check (Optional)
    const selectedDate = new Date(year, month - 1);
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    if (selectedDate > currentMonthStart) {
       // alert("Cannot generate payroll for future months.");
       // return;
    }

    setLoading(true);
    try {
      // STEP 1: Run Generation Logic (Adds missing employees, skips existing)
      console.log("Syncing Payroll...");
      const genRes = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year })
      });

      // We don't care if it created 0 or 10 records, just ensure it ran.
      if (!genRes.ok) {
         // If error is not "already exists", throw it
         const errData = await genRes.json();
         console.warn("Generation Warning:", errData);
      }

      // STEP 2: Fetch Everything (Old + New)
      console.log(`Fetching: /api/payroll?month=${month}&year=${year}`);
      const fetchRes = await fetch(`/api/payroll?month=${month}&year=${year}`);
      
      if (fetchRes.ok) {
        setRecords(await fetchRes.json());
      } else {
        throw new Error("Failed to load records");
      }

    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (record: PayrollRecord, action: "SAVE" | "PUBLISH") => {
    setSavingId(record.id);
    try {
      const payload = {
        id: record.id,
        lopDays: toNum(record.lopDays),
        otherAllowances: toNum(record.otherAllowances),
        otherDeductions: toNum(record.otherDeductions),
        status: action === "PUBLISH" ? "PROCESSED" : record.status, // Map PUBLISH -> PROCESSED
      };

      const res = await fetch("/api/payroll", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Update failed");
      
      const updatedRecord = await res.json();
      
      setRecords(prev => prev.map(r => r.id === record.id ? updatedRecord : r));
      if(action === "PUBLISH") alert("Payroll Processed!");

    } catch (err) {
      console.error(err);
      alert("Failed to update record");
    } finally {
      setSavingId(null);
    }
  };

  const updateLocalField = (id: number, field: keyof PayrollRecord, value: string) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Generator</h1>
          <p className="text-muted-foreground">Monthly salary processing</p>
        </div>
        
        <Link href="/hr/payroll/history">
          <Button variant="outline" className="gap-2">
            <History className="h-4 w-4" /> History
          </Button>
        </Link>
      </div>

      <Card className="bg-slate-50">
        <CardContent className="pt-6 flex gap-4 items-end">
          <div className="space-y-2 w-64">
            <label className="text-sm font-medium">Period</label>
            <Input 
              type="month" 
              value={selectedMonth}
              max={maxMonthStr}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white"
            />
          </div>
          <Button onClick={handleGenerate} disabled={loading} type="button">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Load Data
          </Button>
        </CardContent>
      </Card>

      {records.length > 0 && (
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-100">
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>LOP Days</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => {
                const isLocked = record.status === "PROCESSED" || record.status === "PAID";
                const isExpanded = expandedRows.has(record.id);

                return (
                  <Fragment key={record.id}>
                    <TableRow className={isExpanded ? "bg-blue-50/50 border-b-0" : ""}>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleRow(record.id)}>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{record.employee.firstName} {record.employee.lastName}</div>
                        <div className="text-xs text-muted-foreground">{record.employee.employeeCode}</div>
                      </TableCell>
                      
                      <TableCell>
                        <Input 
                          type="number" 
                          className="w-20 h-8 bg-white" 
                          value={record.lopDays} 
                          disabled={isLocked}
                          onChange={(e) => updateLocalField(record.id, "lopDays", e.target.value)}
                        />
                      </TableCell>
                      
                      <TableCell className="text-right font-bold text-blue-600">
                        ₹{toNum(record.netSalary).toFixed(2)}
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={isLocked ? "default" : "secondary"}>{record.status}</Badge>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!isLocked && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleUpdate(record, "SAVE")} disabled={savingId === record.id}>
                                {savingId === record.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              </Button>
                              <Button size="sm" onClick={() => handleUpdate(record, "PUBLISH")} disabled={savingId === record.id}>
                                <Lock className="w-4 h-4 mr-1" /> Process
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* DETAIL ROW */}
                    {isExpanded && (
                      <TableRow className="bg-blue-50/30 hover:bg-blue-50/30">
                        <TableCell colSpan={6} className="p-4 pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-md bg-white">
                            
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">BREAKDOWN</p>
                              <p className="text-sm">Basic: ₹{toNum(record.basicSalary).toFixed(2)}</p>
                              <p className="text-sm">Gross: ₹{toNum(record.grossSalary).toFixed(2)}</p>
                              <p className="text-sm text-red-500">Total Ded: ₹{toNum(record.totalDeductions).toFixed(2)}</p>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-medium text-green-600">BONUS / ALLOWANCE</label>
                              <Input 
                                type="number" 
                                className="h-9" 
                                value={record.otherAllowances} 
                                disabled={isLocked}
                                onChange={(e) => updateLocalField(record.id, "otherAllowances", e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-medium text-red-600">EXTRA DEDUCTIONS</label>
                              <Input 
                                type="number" 
                                className="h-9" 
                                value={record.otherDeductions} 
                                disabled={isLocked}
                                onChange={(e) => updateLocalField(record.id, "otherDeductions", e.target.value)}
                              />
                            </div>

                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
