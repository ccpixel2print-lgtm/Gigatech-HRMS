"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Helper to safely convert Prisma Decimals/Strings to numbers
const toNum = (val: any) => {
  if (val === null || val === undefined) return 0;
  const num = parseFloat(val.toString());
  return isNaN(num) ? 0 : num;
};

interface PayrollSummary {
  month: number;
  year: number;
  totalNetPay: number;
  count: number;
  status: string; // Mixed or Published
  records: any[]; // The actual rows
}

export default function PayrollHistoryPage() {
  const [summaries, setSummaries] = useState<PayrollSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null); // "month-year"

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch("/api/payroll"); 
      if(res.ok) {
        const data = await res.json();

        console.log("API DATA RAW:", data);

        if (data.length > 0) {
          console.log("FIRST RECORD KEYS:", Object.keys(data[0]));
        }
        
        // FILTER HERE: Only keep PUBLISHED records
        const publishedOnly = data.filter((r: any) => r.status === "PROCESSED");
        
        const grouped = groupData(publishedOnly); // Group the filtered data
        setSummaries(grouped);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Helper to group flat records into Month summaries
  function groupData(records: any[]) {
    const groups: Record<string, PayrollSummary> = {};
    
    records.forEach((r: any) => {
      const key = `${r.month}-${r.year}`;
      if (!groups[key]) {
        groups[key] = {
          month: r.month,
          year: r.year,
          totalNetPay: 0,
          count: 0,
          status: "DRAFT",
          records: []
        };
      }
      // SAFE MATH using toNum()
      groups[key].totalNetPay += toNum(r.netSalary);
      groups[key].count += 1;
      groups[key].records.push(r);
      
      if (r.status === "PUBLISHED" || r.status === "PROCESSED") {
          groups[key].status = r.status;
      }
    });

    return Object.values(groups).sort((a, b) => b.month - a.month); // Newest first
  }

  const toggleExpand = (key: string) => {
    setExpandedRow(expandedRow === key ? null : key);
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /> Loading History...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Payroll History</h1>

      {summaries.map((summary) => (
        <Card key={`${summary.month}-${summary.year}`} className="overflow-hidden">
          <div 
            className="p-4 flex items-center justify-between bg-slate-50 cursor-pointer hover:bg-slate-100 transition"
            onClick={() => toggleExpand(`${summary.month}-${summary.year}`)}
          >
            <div className="flex items-center gap-4">
              {expandedRow === `${summary.month}-${summary.year}` ? <ChevronDown /> : <ChevronRight />}
              <div>
                <h3 className="font-bold text-lg">
                  {new Date(0, summary.month - 1).toLocaleString('default', { month: 'long' })} {summary.year}
                </h3>
                <p className="text-sm text-gray-500">{summary.count} Employees Paid</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-700">₹{summary.totalNetPay.toFixed(2)}</div>
              <Badge variant={summary.status === "PUBLISHED" ? "default" : "secondary"}>
                {summary.status}
              </Badge>
            </div>
          </div>

          {/* Expanded Detail Table */}
          {expandedRow === `${summary.month}-${summary.year}` && (
            <div className="border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Net Pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.records.map((rec: any) => {
                    // Calculate safely
                    const gross = toNum(rec.grossSalary);
                    const bonus = toNum(rec.otherAllowances);
                    const lopDays = toNum(rec.lopDays);
                    const otherDed = toNum(rec.otherDeductions);
                    const net = toNum(rec.netSalary);
                    
                    // Calculate LOP Amount: (Gross / 30) * LOP Days
                    // Note: Use Gross or Basic depending on your policy. Assuming Gross for MVP.
                    const lopAmount = (gross / 30) * lopDays;
                    const totalDeductions = otherDed + lopAmount;

                    return (
                      <TableRow key={rec.id}>
                        <TableCell className="font-medium">
                          {rec.employee.firstName} {rec.employee.lastName}
                        </TableCell>
                        <TableCell>₹{gross.toFixed(2)}</TableCell>
                        <TableCell className="text-red-500">-₹{totalDeductions.toFixed(2)}</TableCell>
                        <TableCell className="text-green-600">+₹{bonus.toFixed(2)}</TableCell>
                        <TableCell className="font-bold">₹{net.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
