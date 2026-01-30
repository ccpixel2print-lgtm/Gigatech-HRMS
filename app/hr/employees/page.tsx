"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Pencil, 
  CheckCircle, 
  Loader2, 
  User, 
  Briefcase,
  Mail, Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [publishingId, setPublishingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/employees")
      .then((res) => res.json())
      .then((data) => {
        setEmployees(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  const handlePublish = async (id: number) => {
    if(!confirm("Publish this employee? This will create their login access.")) return;
    
    setPublishingId(id);
    try {
      const res = await fetch(`/api/employees/${id.toString()}/publish`, { method: "POST" });
      if (res.ok) {
        alert("Employee Published Successfully!");
        window.location.reload(); 
      } else {
        const err = await res.json();
        alert("Error: " + err.message);
      }
    } catch (e) {
      alert("Failed to connect");
    } finally {
      setPublishingId(null);
    }
  };

  const filteredEmployees = employees.filter((emp: any) =>
    emp.firstName.toLowerCase().includes(search.toLowerCase()) ||
    emp.lastName.toLowerCase().includes(search.toLowerCase()) ||
    emp.employeeCode.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Manage your team and their roles.</p>
        </div>
        <Link href="/hr/employees/new">
          <Button className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Employee
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or code..."
              className="pl-8 bg-slate-50 border-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modern List View */}
      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[300px]">Employee Profile</TableHead>
              <TableHead>Role & Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee: any) => (
              <TableRow key={employee.id} className="hover:bg-slate-50/50">
                {/* 1. COMPOSITE PROFILE COLUMN */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    {/* Initials Avatar */}
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                          {employee.employeeCode}
                        </span>
                        <span className="flex items-center gap-1">
                           {/* Handle Email Display Logic */}
                           <Mail className="h-3 w-3" />
                           {(employee as any).personalEmail || employee.email || "No Email"}
                        </span>
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* 2. ROLE COLUMN */}
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-medium text-sm text-slate-700">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                      {employee.designation || "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground pl-5.5">
                      {employee.department || "General"}
                    </div>
                  </div>
                </TableCell>

                {/* 3. STATUS BADGE */}
                <TableCell>
                  {employee.status === "DRAFT" ? (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">
                      Draft
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shadow-none font-medium">
                      Active
                    </Badge>
                  )}
                </TableCell>

                {/* 4. ACTIONS (Horizontal) */}
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-2">
                    
                    {/* 1. PUBLISH (Draft Only) */}
                    {employee.status === "DRAFT" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-8 border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => handlePublish(employee.id)}
                        disabled={publishingId === employee.id}
                        title="Publish Employee"
                      >
                        {publishingId === employee.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                            Publish
                          </>
                        )}
                      </Button>
                    )}

                    {/* 2. VIEW (Published Only - Optional safe view) */}
                    {employee.status === "PUBLISHED" && (
                      <Link href={`/hr/employees/${employee.id}/edit?view=true`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600" title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}

                    {/* 3. EDIT (Always Visible) */}
                    <Link href={`/hr/employees/${employee.id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>

                  </div>
                </TableCell>


              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredEmployees.length === 0 && (
          <div className="p-12 text-center text-muted-foreground bg-slate-50">
            No employees found. Add one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
