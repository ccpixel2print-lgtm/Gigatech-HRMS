"use client";

import { useEffect, useState } from "react";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EditEmployeePage() {
  const params = useParams();
  const searchParams = useSearchParams(); 
  const router = useRouter();
  
  // LOGIC: Check if URL has ?view=true
  const isViewMode = searchParams.get("view") === "true";

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEmployee() {
      try {
        const res = await fetch(`/api/employees/${params.id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Employee not found");
          throw new Error("Failed to load employee");
        }
        const data = await res.json();
        setEmployee(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadEmployee();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <h2 className="text-xl font-bold">Error</h2>
        <p>{error}</p>
        <Button 
          variant="outline"
          onClick={() => router.back()}
          className="mt-4"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {isViewMode ? "Employee Details" : "Edit Employee"}
        </h1>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        {/* We pass the fetched data AND the readOnly mode to the form */}
        <EmployeeForm initialData={employee} readOnly={isViewMode} />
      </Card>
    </div>
  );
}
