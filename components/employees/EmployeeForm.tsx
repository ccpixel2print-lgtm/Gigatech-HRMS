"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeSchema, type EmployeeFormValues } from "@/lib/validators/employee";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function EmployeeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      basicSalary: 0, hra: 0, da: 0, pf: 0, esi: 0,
      specialAllowance: 0, professionalTax: 0
    },
    mode: "onChange",
  });

  // Real-time Salary Calculation
  const basic = Number(form.watch("basicSalary") || 0);
  const hra = Number(form.watch("hra") || 0);
  const da = Number(form.watch("da") || 0);
  const special = Number(form.watch("specialAllowance") || 0);
  const pf = Number(form.watch("pf") || 0);
  const pt = Number(form.watch("professionalTax") || 0);
  const esi = Number(form.watch("esi") || 0);
  
  const gross = basic + hra + da + special;
  const deductions = pf + pt + esi;
  const net = gross - deductions;

  async function onSubmit(data: EmployeeFormValues) {
    setLoading(true);
    try {
      console.log("Submitting Payload:", data);
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || "Failed to create employee");
      }

      alert("Employee Created Successfully!");
      router.push("/hr/employees");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, (errors) => console.log(errors))} className="space-y-6 p-4 max-w-4xl mx-auto">
        
        {/* Personal & Employment */}
        <Card>
          <CardHeader><CardTitle>Employee Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="firstName" render={({ field }) => (
              <FormItem><FormLabel>First Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="lastName" render={({ field }) => (
              <FormItem><FormLabel>Last Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="dateOfJoining" render={({ field }) => (
              <FormItem><FormLabel>Date of Joining *</FormLabel><FormControl><Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="designation" render={({ field }) => (
              <FormItem><FormLabel>Designation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Salary Structure */}
        <Card>
          <CardHeader><CardTitle>Salary Structure (Monthly ₹)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="basicSalary" render={({ field }) => (
              <FormItem><FormLabel>Basic Salary *</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="hra" render={({ field }) => (
              <FormItem><FormLabel>HRA</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="pf" render={({ field }) => (
              <FormItem><FormLabel>PF (Deduction)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card className="bg-slate-50 border-blue-200">
          <CardContent className="pt-6 grid grid-cols-3 gap-4 text-center">
            <div><div className="text-sm text-gray-500">Gross</div><div className="text-xl font-bold text-green-600">₹{gross.toFixed(2)}</div></div>
            <div><div className="text-sm text-gray-500">Deductions</div><div className="text-xl font-bold text-red-600">₹{deductions.toFixed(2)}</div></div>
            <div><div className="text-sm text-gray-500">Net Pay</div><div className="text-xl font-bold text-blue-600">₹{net.toFixed(2)}</div></div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full h-12 text-lg">
          {loading ? "Creating Employee..." : "Create Employee"}
        </Button>
      </form>
    </Form>
  );
}
