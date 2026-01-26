"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, FileText, Calendar, Plus, Search } from "lucide-react";

export default function HRDashboard() {
  const [stats, setStats] = useState({ total: 0, draft: 0, newJoiners: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real data on mount
    fetch("/api/hr/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">HR Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the HR Management Portal
        </p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.total}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Profiles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.draft}</div>
            <p className="text-xs text-muted-foreground">Pending completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.newJoiners}</div>
            <p className="text-xs text-muted-foreground">New joiners</p>
          </CardContent>
        </Card>
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/hr/employees/new"
            className="flex items-center p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="mr-4 bg-blue-100 p-2 rounded-full">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="font-medium">Add New Employee</div>
              <div className="text-sm text-muted-foreground">Create a new profile</div>
            </div>
          </Link>
          
          <Link
            href="/hr/employees"
            className="flex items-center p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="mr-4 bg-purple-100 p-2 rounded-full">
              <Search className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="font-medium">View All Employees</div>
              <div className="text-sm text-muted-foreground">Manage records</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
