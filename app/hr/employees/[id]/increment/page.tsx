"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowRight, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function IncrementPage() {
  const params = useParams();
  const router = useRouter();
  
  // 1. ADD STATE FOR HISTORY
  const [employee, setEmployee] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]); // <--- NEW
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [type, setType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 2. FETCH BOTH EMPLOYEE AND HISTORY
    const fetchEmp = fetch(`/api/employees/${params.id}`).then(res => res.json());
    const fetchHist = fetch(`/api/employees/${params.id}/salary-history`).then(res => res.json());

    Promise.all([fetchEmp, fetchHist])
      .then(([empData, histData]) => {
        setEmployee(empData);
        if(Array.isArray(histData)) setHistory(histData);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  // Calculate New Salary Logic
  const calculateNew = (currentVal: any) => {
    const base = Number(currentVal || 0);
    if (!value) return base;
    
    const numValue = parseFloat(value);
    if (type === "PERCENTAGE") {
      return base + (base * (numValue / 100));
    } else {
      return base; 
    }
  };

  const currentSalary = employee?.salary || {};
  
  const newBasic = calculateNew(currentSalary.basicSalary);
  const newHra = calculateNew(currentSalary.hra);
  const newDa = calculateNew(currentSalary.da);
  const newTa = calculateNew(currentSalary.ta);
  const newSpecial = calculateNew(currentSalary.specialAllowance);
  const newPf = newBasic * 0.12; 
  const newEsi = (newBasic + newHra + newDa + newTa + newSpecial) * 0.0075;

  const currentGross = 
    Number(currentSalary.basicSalary || 0) +
    Number(currentSalary.hra || 0) +
    Number(currentSalary.da || 0) +
    Number(currentSalary.ta || 0) +
    Number(currentSalary.specialAllowance || 0);
    
  const newGross = newBasic + newHra + newDa + newTa + newSpecial;

  const handleSubmit = async () => {
    if(!effectiveDate) return alert("Select Effective Date");
    
    setSaving(true);
    try {
      const payload = {
        newSalary: {
          basicSalary: newBasic,
          hra: newHra,
          da: newDa,
          ta: newTa,
          specialAllowance: newSpecial,
          providentFund: newPf,
          esi: newEsi,
          professionalTax: Number(currentSalary.professionalTax), 
        },
        effectiveDate,
        remarks,
        incrementPercentage: type === "PERCENTAGE" ? value : null
      };

      const res = await fetch(`/api/employees/${params.id}/increment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if(res.ok) {
        alert("Increment Applied Successfully!");
        router.push("/hr/employees");
      } else {
        throw new Error("Failed");
      }
    } catch(e) {
      alert("Error processing increment");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Process Increment</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Card */}
        <Card>
          <CardHeader><CardTitle>Increment Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Increment Type</Label>
              <RadioGroup defaultValue="PERCENTAGE" onValueChange={(v: any) => setType(v)} className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PERCENTAGE" id="pct" />
                  <Label htmlFor="pct">Percentage (%)</Label>
                </div>
                <div className="flex items-center space-x-2 opacity-50">
                  <RadioGroupItem value="FLAT" id="flat" disabled />
                  <Label htmlFor="flat">Flat Amount (Coming Soon)</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Percentage Value</Label>
              <Input type="number" placeholder="e.g. 10" value={value} onChange={e => setValue(e.target.value)} />
            </div>

            <div>
              <Label>Effective Date</Label>
              <Input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} />
            </div>

            <div>
              <Label>Remarks</Label>
              <Input placeholder="Annual Appraisal" value={remarks} onChange={e => setRemarks(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card className="bg-slate-50">
          <CardHeader><CardTitle>Salary Preview</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Row label="Basic Salary" oldVal={currentSalary.basicSalary} newVal={newBasic} />
              <Row label="HRA" oldVal={currentSalary.hra} newVal={newHra} />
              <Row label="DA" oldVal={currentSalary.da} newVal={newDa} />
              <Row label="TA" oldVal={currentSalary.ta} newVal={newTa} />
              <div className="border-t pt-2 mt-2">
                <Row label="Gross Salary" oldVal={currentGross} newVal={newGross} isBold />
              </div>
            </div>
            
            <Button className="w-full mt-6" onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="animate-spin mr-2"/> : "Confirm Increment"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 3. HISTORY TABLE SECTION */}
      <Card className="mt-6">
        <CardHeader><CardTitle>Revision History</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Gross Salary</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h: any) => {
                  const gross = Number(h.basicSalary) + Number(h.hra) + Number(h.da||0) + Number(h.ta||0) + Number(h.specialAllowance);
                  return (
                    <TableRow key={h.id}>
                      <TableCell>{new Date(h.effectiveFrom).toLocaleDateString()}</TableCell>
                      <TableCell>₹{gross.toFixed(0)}</TableCell>
                      <TableCell>{h.reason || h.remarks || "-"}</TableCell>
                    </TableRow>
                  );
                })}
                {history.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                      No salary revisions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Row Component
function Row({ label, oldVal, newVal, isBold }: any) {
  const diff = newVal - Number(oldVal || 0);
  return (
    <div className={`flex justify-between items-center ${isBold ? 'font-bold' : 'text-sm'}`}>
      <span>{label}</span>
      <div className="flex items-center gap-4">
        <span className="text-slate-500 line-through">₹{Number(oldVal||0).toFixed(0)}</span>
        <ArrowRight className="w-3 h-3 text-slate-400" />
        <span className="text-green-600">₹{newVal.toFixed(0)}</span>
        <span className="text-xs text-green-600 bg-green-100 px-1 rounded">+{diff.toFixed(0)}</span>
      </div>
    </div>
  )
}
