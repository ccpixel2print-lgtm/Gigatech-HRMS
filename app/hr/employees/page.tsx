'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, User, Pencil, CheckCircle  } from 'lucide-react'
import Link from "next/link";
//import { Pencil,CheckCircle } from "lucide-react";

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface Employee {
  id: number
  employeeCode: string
  firstName: string
  lastName: string
  designation: string
  department: string
  status: string
  personalEmail?: string | null;
}

export default function EmployeesPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      console.log('[EMPLOYEES] Fetching employees...')
      const response = await fetch('/api/employees')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch employees: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('[EMPLOYEES] Employees fetched:', data.length)
      setEmployees(data)
      setError(null)
    } catch (error) {
      console.error('[EMPLOYEES] Failed to fetch employees:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch employees')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="default">Published</Badge>
      case 'DRAFT':
        return <Badge variant="secondary">Draft</Badge>
      case 'INACTIVE':
        return <Badge variant="destructive">Inactive</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }


    // ... other hooks ...
    const [publishingId, setPublishingId] = useState<number | null>(null); // Track loading state per button

    const handlePublish = async (id: number) => {
      if(!confirm("Publish this employee? This will create their login access.")) return;
      
      setPublishingId(id);
      try {
        const res = await fetch(`/api/employees/${id.toString()}/publish`, { method: "POST" });
        if (res.ok) {
          alert("Employee Published Successfully!");
          window.location.reload(); // Refresh to update status
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
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground mt-2">
            Manage employee records and information
          </p>
        </div>
        <Button onClick={() => router.push('/hr/employees/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
          <CardDescription>
            Total employees: {employees.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <div className="text-destructive text-center">
                <p className="font-semibold">Error loading employees</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button onClick={() => {
                setLoading(true)
                fetchEmployees()
              }}>
                Retry
              </Button>
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <User className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-semibold">No employees found</p>
                <p className="text-sm text-muted-foreground">Get started by adding your first employee</p>
              </div>
              <Button onClick={() => router.push('/hr/employees/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.employeeCode}</TableCell>
                    <TableCell>
                      {employee.firstName} {employee.lastName}
                    </TableCell>
                    <TableCell>{(employee as any).personalEmail || "-"}</TableCell>
                    <TableCell>{employee.designation}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{getStatusBadge(employee.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* Edit Button */}
                        <Link href={`/hr/employees/${employee.id}/edit`}>
                          <Button variant="ghost" size="icon" title="Edit Employee">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                      {/* Publish Button */}
                      {employee.status === "DRAFT" && (
                        <Button 
                          size="sm"
                          variant="outline" 
                          title="Publish Employee"
                          className="text-green-600 border-green-200"
                          onClick={() => handlePublish(employee.id)} // Now handlePublish exists!
                          disabled={publishingId === employee.id}
                        >
                          {publishingId === employee.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-1" /> 
                          )}
                          
                        </Button>
                      )}

                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
