"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, FileText } from "lucide-react";
import { pdf } from '@react-pdf/renderer';
import { PayslipDocument } from "@/components/pdf/PayslipDocument";

export default function MyPayslipsPage() {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/employee/payslips")
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setPayslips(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (id: number) => {
    // 1. Find the specific payroll record from your state
    const slip = payslips.find((p: any) => p.id === id);
    
    if (!slip) {
      alert("Error: Payslip data not found");
      return;
    }

    try {
      // 2. Generate the PDF Blob in memory
      // We pass 'slip' (the data object) to our PDF Component
      const blob = await pdf(<PayslipDocument data={slip} />).toBlob();
      
      // 3. Create a fake link to trigger the download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Payslip_${slip.month}_${slip.year}.pdf`; // Name of the file
      
      // 4. Click it automatically
      document.body.appendChild(link);
      link.click();
      
      // 5. Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("PDF Generation failed:", err);
      alert("Failed to generate PDF");
    }
  };


  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Payslips</h1>
        <p className="text-muted-foreground">View and download your monthly salary slips.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Gross Earning</TableHead>
                <TableHead>Total Deductions</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.map((slip: any) => (
                <TableRow key={slip.id}>
                  <TableCell className="font-medium">
                    {new Date(0, slip.month - 1).toLocaleString('default', { month: 'long' })} {slip.year}
                  </TableCell>
                  <TableCell>₹{Number(slip.grossSalary).toFixed(2)}</TableCell>
                  <TableCell className="text-red-500">-₹{Number(slip.totalDeductions).toFixed(2)}</TableCell>
                  <TableCell className="font-bold text-green-600">₹{Number(slip.netSalary).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={slip.status === "PAID" ? "default" : "secondary"}>
                      {slip.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleDownload(slip.id)}>
                      <Download className="w-4 h-4 mr-2" /> PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              
              {payslips.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No payslips found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
