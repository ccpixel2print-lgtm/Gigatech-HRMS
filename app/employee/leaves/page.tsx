"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface LeaveBalance {
  leaveTypeId: number
  code: string
  name: string
  quota: number
  used: number
  available: number
  isPaid: boolean
  carryForward: boolean
}

interface LeaveApplication {
  id: number
  fromDate: string
  toDate: string
  totalDays: string
  reason: string
  status: string
  leaveType: {
    code: string
    name: string
  }
  createdAt: string
}

export default function EmployeeLeavesPage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [applications, setApplications] = useState<LeaveApplication[]>([])
  const [employeeId, setEmployeeId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    fromDate: '',
    toDate: '',
    reason: '',
    contactDuringLeave: ''
  })

  // Fetch employee ID first
  useEffect(() => {
    const fetchEmployeeId = async () => {
      try {
        const res = await fetch('/api/employees')
        if (res.ok) {
          const employees = await res.json()
          // Get current user's employee record
          if (employees.length > 0) {
            setEmployeeId(employees[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching employee ID:', error)
      }
    }
    fetchEmployeeId()
  }, [])

  // Fetch balances and applications
  useEffect(() => {
    if (!employeeId) return

    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch balances
        const balanceRes = await fetch(`/api/leaves/balance/${employeeId}`)
        if (balanceRes.ok) {
          const data = await balanceRes.json()
          setBalances(data.balances || [])
        }

        // Fetch applications
        const appRes = await fetch('/api/leaves/applications')
        if (appRes.ok) {
          const data = await appRes.json()
          setApplications(data)
        }
      } catch (error) {
        console.error('Error fetching leave data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [employeeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeId) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/leaves/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          employeeId,
          leaveTypeId: parseInt(formData.leaveTypeId),
          isHalfDayStart: false,
          isHalfDayEnd: false
        })
      })

      if (res.ok) {
        alert('Leave application submitted successfully!')
        setIsDialogOpen(false)
        setFormData({
          leaveTypeId: '',
          fromDate: '',
          toDate: '',
          reason: '',
          contactDuringLeave: ''
        })
        
        // Refresh data
        const balanceRes = await fetch(`/api/leaves/balance/${employeeId}`)
        if (balanceRes.ok) {
          const data = await balanceRes.json()
          setBalances(data.balances || [])
        }

        const appRes = await fetch('/api/leaves/applications')
        if (appRes.ok) {
          const data = await appRes.json()
          setApplications(data)
        }
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error submitting leave:', error)
      alert('Failed to submit leave application')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PENDING: 'outline',
      APPROVED: 'default',
      REJECTED: 'destructive',
      L1_APPROVED: 'secondary',
      L2_APPROVED: 'secondary'
    }
    
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      APPROVED: 'bg-green-100 text-green-800 border-green-300',
      REJECTED: 'bg-red-100 text-red-800 border-red-300',
      L1_APPROVED: 'bg-blue-100 text-blue-800 border-blue-300',
      L2_APPROVED: 'bg-blue-100 text-blue-800 border-blue-300'
    }

    return (
      <Badge variant={variants[status] || 'outline'} className={colors[status] || ''}>
        {status.replace(/_/g, ' ')}
      </Badge>
    )
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Leaves</h1>
          <p className="text-gray-600">Manage your leave applications and view balances</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Apply for Leave</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
              <DialogDescription>
                Fill in the details to submit your leave application
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="leaveTypeId">Leave Type</Label>
                <select
                  id="leaveTypeId"
                  value={formData.leaveTypeId}
                  onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                  required
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select leave type</option>
                  {balances.map((balance) => (
                    <option key={balance.leaveTypeId} value={balance.leaveTypeId}>
                      {balance.name} ({balance.code}) - Available: {balance.available} days
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromDate">Start Date</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={formData.fromDate}
                    onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="toDate">End Date</Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={formData.toDate}
                    onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  placeholder="Please provide a reason for your leave"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="contactDuringLeave">Contact Number (Optional)</Label>
                <Input
                  id="contactDuringLeave"
                  type="tel"
                  value={formData.contactDuringLeave}
                  onChange={(e) => setFormData({ ...formData, contactDuringLeave: e.target.value })}
                  placeholder="Contact number during leave"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {balances.map((balance) => (
          <Card key={balance.leaveTypeId}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>{balance.code}</span>
                <Badge variant={balance.isPaid ? 'default' : 'secondary'}>
                  {balance.isPaid ? 'Paid' : 'Unpaid'}
                </Badge>
              </CardTitle>
              <CardDescription>{balance.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold">{balance.quota} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Used:</span>
                  <span className="font-semibold text-red-600">{balance.used} days</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-bold text-green-600">{balance.available} days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Applications History */}
      <Card>
        <CardHeader>
          <CardTitle>Leave History</CardTitle>
          <CardDescription>Your past and pending leave applications</CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No leave applications yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">From</th>
                    <th className="text-left py-3 px-4">To</th>
                    <th className="text-left py-3 px-4">Days</th>
                    <th className="text-left py-3 px-4">Reason</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Badge variant="outline">{app.leaveType.code}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(app.fromDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(app.toDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-semibold">{app.totalDays}</td>
                      <td className="py-3 px-4 max-w-xs truncate" title={app.reason}>
                        {app.reason}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
