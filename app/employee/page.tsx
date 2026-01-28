"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch "Me" data
    fetch("/api/employee/me")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => setEmployee(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Dynamic Welcome Banner */}
      <div className="bg-white p-8 rounded-lg border shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">
          {loading ? (
            <span className="flex items-center gap-2">
              Welcome, <Loader2 className="h-6 w-6 animate-spin" />
            </span>
          ) : (
            `Welcome, ${employee?.firstName || "Employee"}!`
          )}
        </h1>
        <p className="text-muted-foreground mt-2">
          {employee 
            ? `${employee.designation} • ${employee.department}` 
            : "Employee Portal"}
        </p>
      </div>

      {/* Placeholder Cards (Existing) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">My Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
          </CardContent>
        </Card>
        {/* You can leave other cards static/empty for now */}
      </div>
    </div>
  );
}
