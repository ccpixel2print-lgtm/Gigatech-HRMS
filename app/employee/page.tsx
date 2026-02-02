"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar } from "lucide-react"; // Added Calendar icon
import { Badge } from "@/components/ui/badge";

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch Employee
    const fetchMe = fetch("/api/employee/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setEmployee(data))
      .catch((err) => console.error(err));

    // 2. Fetch Holidays
    const fetchHolidays = fetch("/api/holidays/upcoming")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setHolidays(data))
      .catch((err) => console.error(err));

    // Wait for both
    Promise.all([fetchMe, fetchHolidays]).finally(() => setLoading(false));
  }, []);

  // LOGIC: Split and Sort
  // 1. Regular Holidays (isOptional = false)
  const regularHolidays = holidays.filter((h: any) => !h.isOptional);
  // 2. Optional Holidays (isOptional = true)
  const optionalHolidays = holidays.filter((h: any) => h.isOptional);

  // Helper to render a single row
  const HolidayRow = ({ h, isOptional }: { h: any, isOptional: boolean }) => (
    <div key={h.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0 mb-3 last:mb-0">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-md ${isOptional ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
          <Calendar className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-sm text-slate-900">{h.name}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(h.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
      <Badge 
        variant={isOptional ? "outline" : "default"}
        className={isOptional ? "border-amber-200 text-amber-700 bg-amber-50" : "bg-slate-900"}
      >
        {isOptional ? "Optional" : "Holiday"}
      </Badge>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
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

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* HOLIDAYS CARD */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Upcoming Holidays</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {holidays.length === 0 && (
              <p className="text-xs text-muted-foreground">No upcoming holidays.</p>
            )}

            {/* SECTION 1: REGULAR */}
            {regularHolidays.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Mandatory Holidays</h4>
                <div className="space-y-3">
                  {regularHolidays.map((h: any) => <HolidayRow key={h.id} h={h} isOptional={false} />)}
                </div>
              </div>
            )}

            {/* SECTION 2: OPTIONAL */}
            {optionalHolidays.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-3">Optional Holidays</h4>
                <div className="space-y-3 bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                  {optionalHolidays.map((h: any) => <HolidayRow key={h.id} h={h} isOptional={true} />)}
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Placeholder for other cards (e.g., My Status, Quick Links) */}
        {/* You can re-add them here if needed */}
      </div>
    </div>
  );
}
