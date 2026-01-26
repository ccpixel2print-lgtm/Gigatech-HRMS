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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface EmployeeFormProps {
  initialData?: any;
}

export function EmployeeForm({ initialData }: EmployeeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

    // 1. Prepare Default Values safely
    const defaultValues: Partial<EmployeeFormValues> = {
      // Personal (Strings must default to "")
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      email: initialData?.email || "", // Or personalEmail check if mapped
      personalPhone: initialData?.personalPhone || "", 
      gender: initialData?.gender || "",
      currentAddress: initialData?.currentAddress || "",
      
      // Employment
      designation: initialData?.designation || "",
      department: initialData?.department || "",
      employmentType: initialData?.employmentType || "FULL_TIME",
      // Date: Handle string vs Date object (undefined is allowed for Dates in some setups, but better to be safe)
      dateOfJoining: initialData?.dateOfJoining ? new Date(initialData.dateOfJoining) : undefined,
  
      // Bank & Statutory (Strings must default to "")
      bankName: initialData?.bankName || "",
      accountNumber: initialData?.accountNumber || "",
      ifscCode: initialData?.ifscCode || "",
      panNumber: initialData?.panNumber || "",
      uanNumber: initialData?.uanNumber || "",
  
      // Salary (Numbers must default to 0)
      // We check both nested salary object (from GET) and flat object (from form state)
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-5xl mx-auto p-4">
        
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">
            {initialData ? "Edit Employee" : "New Employee"}
          </h2>
        </div>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="financial">Salary</TabsTrigger>
            <TabsTrigger value="statutory">Bank & Statutory</TabsTrigger>
          </TabsList>

          {/* TAB 1: PERSONAL */}
          <TabsContent value="personal" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem><FormLabel>First Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem><FormLabel>Last Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="personalPhone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                  <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem><FormLabel>Gender</FormLabel><FormControl>
                      <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="">Select Gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="currentAddress" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: EMPLOYMENT */}
          <TabsContent value="employment" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Employment Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="dateOfJoining" render={({ field }) => (
                  <FormItem><FormLabel>Date of Joining *</FormLabel><FormControl><Input type="date" {...field} value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value|| ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="designation" render={({ field }) => (
                  <FormItem><FormLabel>Designation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem><FormLabel>Department</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="employmentType" render={({ field }) => (
                  <FormItem><FormLabel>Employment Type</FormLabel><FormControl>
                    <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="FULL_TIME">Full Time</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="INTERN">Intern</option>
                      </select>
                  </FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: SALARY */}
          <TabsContent value="financial" className="mt-4">
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Salary Structure (Monthly ₹)</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField control={form.control} name="basicSalary" render={({ field }) => (
                    <FormItem><FormLabel>Basic Salary *</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="hra" render={({ field }) => (
                    <FormItem><FormLabel>HRA</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="da" render={({ field }) => (
                    <FormItem><FormLabel>DA</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="specialAllowance" render={({ field }) => (
                    <FormItem><FormLabel>Special Allowance</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="pf" render={({ field }) => (
                    <FormItem><FormLabel>PF (Deduction)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="esi" render={({ field }) => (
                    <FormItem><FormLabel>ESI (Deduction)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="professionalTax" render={({ field }) => (
                    <FormItem><FormLabel>Prof. Tax</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>

              {/* Salary Preview (Visible only on Financial Tab) */}
              <Card className="bg-slate-50 border-blue-200">
                <CardContent className="pt-6 grid grid-cols-3 gap-4 text-center">
                  <div><div className="text-sm text-gray-500">Gross</div><div className="text-xl font-bold text-green-600">₹{gross.toFixed(2)}</div></div>
                  <div><div className="text-sm text-gray-500">Deductions</div><div className="text-xl font-bold text-red-600">₹{deductions.toFixed(2)}</div></div>
                  <div><div className="text-sm text-gray-500">Net Pay</div><div className="text-xl font-bold text-blue-600">₹{net.toFixed(2)}</div></div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 4: STATUTORY */}
          <TabsContent value="statutory" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Bank & Statutory Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="bankName" render={({ field }) => (
                  <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="accountNumber" render={({ field }) => (
                  <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="ifscCode" render={({ field }) => (
                  <FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="panNumber" render={({ field }) => (
                  <FormItem><FormLabel>PAN Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="uanNumber" render={({ field }) => (
                  <FormItem><FormLabel>UAN Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Global Save Button (Always Visible) */}
        <div className="pt-4 border-t">
          <Button type="submit" disabled={loading} className="w-full md:w-auto md:px-8 h-11 text-lg">
            {loading ? "Saving..." : (initialData ? "Update Employee" : "Create Employee")}
          </Button>
        </div>

      </form>
    </Form>
  );


}
