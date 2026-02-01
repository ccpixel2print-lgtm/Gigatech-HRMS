"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    // 1. Fetch Employee
    const fetchMe = fetch("/api/employee/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setEmployee(data))
      .catch((err) => console.error(err));

    // 2. Fetch Holidays (NEW)
    const fetchHolidays = fetch("/api/holidays/upcoming")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setHolidays(data))
      .catch((err) => console.error(err));

    // Wait for both (optional, but cleaner for loading state)
    Promise.all([fetchMe, fetchHolidays]).finally(() => setLoading(false));
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
                {/* HOLIDAYS CARD */}
                <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Upcoming Holidays</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {holidays.length === 0 ? (
              <p className="text-xs text-muted-foreground">No upcoming holidays.</p>
            ) : (
              holidays.map((h: any) => (
                <div key={h.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{h.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(h.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{h.type}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* You can leave other cards static/empty for now */}
      </div>
    </div>
  );
}
