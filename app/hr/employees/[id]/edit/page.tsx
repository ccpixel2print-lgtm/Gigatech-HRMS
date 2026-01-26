"use client";

import { useEffect, useState } from "react";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
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
        <button 
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Edit Employee</CardTitle>
        </CardHeader>
      </Card>
      
      {/* We pass the fetched data as initialData to the form */}
      <EmployeeForm initialData={employee} />
    </div>
  );
}
