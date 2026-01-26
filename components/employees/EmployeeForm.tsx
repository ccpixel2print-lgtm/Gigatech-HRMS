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

interface EmployeeFormProps {
  initialData?: any;
}

export function EmployeeForm({ initialData }: EmployeeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 1. Prepare Default Values safely
  const defaultValues: Partial<EmployeeFormValues> = {
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || initialData?.personalEmail || "",
    designation: initialData?.designation || "",
    // Date: Handle string vs Date object
    dateOfJoining: initialData?.dateOfJoining ? new Date(initialData.dateOfJoining) : undefined,
    // Salary: Handle nested salary object or flat structure
    basicSalary: Number(initialData?.salary?.basicSalary || initialData?.basicSalary || 0),
    hra: Number(initialData?.salary?.hra || initialData?.hra || 0),
    da: Number(initialData?.salary?.da || initialData?.da || 0),
    pf: Number(initialData?.salary?.pf || initialData?.pf || 0),
    esi: Number(initialData?.salary?.esi || initialData?.esi || 0),
    specialAllowance: Number(initialData?.salary?.specialAllowance || initialData?.specialAllowance || 0),
    professionalTax: Number(initialData?.salary?.professionalTax || initialData?.professionalTax || 0),
  };

  // 2. Initialize Form
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema as any),
    defaultValues,
    mode: "onChange",
  });

  // 3. Watch values for Calculator
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

  // 4. Submit Handler
  async function onSubmit(data: EmployeeFormValues) {
    setLoading(true);
    try {
      const isEdit = !!initialData;
      const url = isEdit ? `/api/employees/${initialData.id}` : "/api/employees";
      const method = isEdit ? "PATCH" : "POST";

      console.log("Submitting to", url, method, data);

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || "Operation failed");
      }

      alert(isEdit ? "Updated Successfully!" : "Created Successfully!");
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto p-4">
        
        {/* PERSONAL DETAILS */}
        <Card>
          <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control as any} name="firstName" render={({ field }) => (
              <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control as any} name="lastName" render={({ field }) => (
              <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control as any} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control as any} name="dateOfJoining" render={({ field }) => (
              <FormItem><FormLabel>Date of Joining</FormLabel><FormControl><Input type="date" {...field} value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control as any} name="designation" render={({ field }) => (
              <FormItem><FormLabel>Designation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent>
        </Card>

        {/* SALARY STRUCTURE */}
        <Card>
          <CardHeader><CardTitle>Salary Structure (₹)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control as any} name="basicSalary" render={({ field }) => (
              <FormItem><FormLabel>Basic Salary</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control as any} name="hra" render={({ field }) => (
              <FormItem><FormLabel>HRA</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control as any} name="da" render={({ field }) => (
              <FormItem><FormLabel>DA</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control as any} name="pf" render={({ field }) => (
              <FormItem><FormLabel>PF (Deduction)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control as any} name="esi" render={({ field }) => (
              <FormItem><FormLabel>ESI (Deduction)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent>
        </Card>

        {/* LIVE PREVIEW */}
        <Card className="bg-slate-50 border-blue-200">
          <CardContent className="pt-6 grid grid-cols-3 gap-4 text-center">
            <div><div className="text-sm text-gray-500">Gross</div><div className="text-xl font-bold text-green-600">₹{gross.toFixed(2)}</div></div>
            <div><div className="text-sm text-gray-500">Deductions</div><div className="text-xl font-bold text-red-600">₹{deductions.toFixed(2)}</div></div>
            <div><div className="text-sm text-gray-500">Net Pay</div><div className="text-xl font-bold text-blue-600">₹{net.toFixed(2)}</div></div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full h-12 text-lg">
          {loading ? "Saving..." : (initialData ? "Update Employee" : "Create Employee")}
        </Button>
      </form>
    </Form>
  );
}
