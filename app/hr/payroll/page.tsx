"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Save, Lock, CheckCircle, Loader2 } from 'lucide-react'

interface PayrollRecord {
  id: number
  employeeId: number
  employee: {
    employeeCode: string
    firstName: string
    lastName: string
    designation: string
  }
  month: number
  year: number
  basicSalary: string
  grossSalary: string
  lopDays: string
  lopDeduction: string
  otherAllowances: string
  otherDeductions: string
  totalDeductions: string
  netSalary: string
  status: string
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
]

const YEARS = [2025, 2026, 2027, 2028, 2029, 2030]

export default function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set())

  // Load or generate payroll
  const handleLoadGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear })
      })

      if (res.ok) {
        const data = await res.json()
        
        // Fetch the records to display
        const fetchRes = await fetch(`/api/payroll?month=${selectedMonth}&year=${selectedYear}`)
        if (fetchRes.ok) {
          const fetchedRecords = await fetchRes.json()
          setRecords(fetchedRecords)
          
          if (data.summary.created > 0) {
            alert(`Successfully generated payroll for ${data.summary.created} employees`)
          } else if (data.summary.existing > 0) {
            alert(`Loaded ${data.summary.existing} existing payroll records`)
          }
        }
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error loading payroll:', error)
      alert('Failed to load/generate payroll')
    } finally {
      setLoading(false)
    }
  }

  // Update local state when input changes
  const handleInputChange = (id: number, field: string, value: string) => {
    setRecords(prevRecords =>
      prevRecords.map(record =>
        record.id === id ? { ...record, [field]: value } : record
      )
    )
  }

  // Save individual record
  const handleSave = async (record: PayrollRecord) => {
    setSavingIds(prev => new Set(prev).add(record.id))
    
    try {
      const res = await fetch('/api/payroll', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: record.id,
          lopDays: parseFloat(record.lopDays) || 0,
          otherAllowances: parseFloat(record.otherAllowances) || 0,
          otherDeductions: parseFloat(record.otherDeductions) || 0
        })
      })

      if (res.ok) {
        const updatedRecord = await res.json()
        
        // Update the record with recalculated values from backend
        setRecords(prevRecords =>
          prevRecords.map(r =>
            r.id === record.id ? {
              ...r,
              lopDays: updatedRecord.lopDays,
              lopDeduction: updatedRecord.lopDeduction,
              otherAllowances: updatedRecord.otherAllowances,
              otherDeductions: updatedRecord.otherDeductions,
              grossSalary: updatedRecord.grossSalary,
              totalDeductions: updatedRecord.totalDeductions,
              netSalary: updatedRecord.netSalary
            } : r
          )
        )
        
        alert('Payroll saved successfully!')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving payroll:', error)
      alert('Failed to save payroll')
    } finally {
      setSavingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(record.id)
        return newSet
      })
    }
  }

  // Publish/Process individual record
  const handlePublish = async (record: PayrollRecord) => {
    setSavingIds(prev => new Set(prev).add(record.id))
    
    try {
      const res = await fetch('/api/payroll', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: record.id,
          lopDays: parseFloat(record.lopDays) || 0,
          otherAllowances: parseFloat(record.otherAllowances) || 0,
          otherDeductions: parseFloat(record.otherDeductions) || 0,
          status: 'PROCESSED'
        })
      })

      if (res.ok) {
        const updatedRecord = await res.json()
        
        // Update the record with new status and calculated values
        setRecords(prevRecords =>
          prevRecords.map(r =>
            r.id === record.id ? {
              ...r,
              lopDays: updatedRecord.lopDays,
              lopDeduction: updatedRecord.lopDeduction,
              otherAllowances: updatedRecord.otherAllowances,
              otherDeductions: updatedRecord.otherDeductions,
              grossSalary: updatedRecord.grossSalary,
              totalDeductions: updatedRecord.totalDeductions,
              netSalary: updatedRecord.netSalary,
              status: updatedRecord.status
            } : r
          )
        )
        
        alert('Payroll published successfully!')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error publishing payroll:', error)
      alert('Failed to publish payroll')
    } finally {
      setSavingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(record.id)
        return newSet
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      DRAFT: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      PROCESSED: 'bg-green-100 text-green-800 border-green-300',
      PAID: 'bg-blue-100 text-blue-800 border-blue-300',
      CANCELLED: 'bg-red-100 text-red-800 border-red-300'
    }

    return (
      <Badge variant="outline" className={variants[status] || ''}>
        {status}
      </Badge>
    )
  }

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const isLocked = (status: string) => {
    return ['PROCESSED', 'PAID', 'CANCELLED'].includes(status)
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Payroll Manager</h1>
        <p className="text-gray-600">Generate and manage monthly payroll</p>
      </div>

      {/* Controls Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Payroll Period</CardTitle>
          <CardDescription>Select month and year to load or generate payroll</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="month">Month</Label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MONTHS.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <Label htmlFor="year">Year</Label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {YEARS.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <Button 
              onClick={handleLoadGenerate}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load / Generate Payroll'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      {records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payroll Records</CardTitle>
            <CardDescription>
              Showing {records.length} records for {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Employee</th>
                    <th className="text-right py-3 px-4 font-semibold">Basic Pay</th>
                    <th className="text-right py-3 px-4 font-semibold">Gross Pay</th>
                    <th className="text-center py-3 px-4 font-semibold">LOP Days</th>
                    <th className="text-center py-3 px-4 font-semibold">Bonus</th>
                    <th className="text-center py-3 px-4 font-semibold">Extra Ded.</th>
                    <th className="text-right py-3 px-4 font-semibold">Deductions</th>
                    <th className="text-right py-3 px-4 font-semibold">Net Pay</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                    <th className="text-center py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => {
                    const locked = isLocked(record.status)
                    const saving = savingIds.has(record.id)

                    return (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">
                              {record.employee.firstName} {record.employee.lastName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {record.employee.employeeCode} • {record.employee.designation}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {formatCurrency(record.basicSalary)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {formatCurrency(record.grossSalary)}
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            step="0.5"
                            value={record.lopDays}
                            onChange={(e) => handleInputChange(record.id, 'lopDays', e.target.value)}
                            disabled={locked}
                            className="w-20 text-center"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            step="100"
                            value={record.otherAllowances}
                            onChange={(e) => handleInputChange(record.id, 'otherAllowances', e.target.value)}
                            disabled={locked}
                            className="w-24 text-center"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            step="100"
                            value={record.otherDeductions}
                            onChange={(e) => handleInputChange(record.id, 'otherDeductions', e.target.value)}
                            disabled={locked}
                            className="w-24 text-center"
                          />
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-red-600">
                          {formatCurrency(record.totalDeductions)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-green-600">
                          {formatCurrency(record.netSalary)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {getStatusBadge(record.status)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-2">
                            {locked ? (
                              <Lock className="h-5 w-5 text-gray-400" />
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSave(record)}
                                  disabled={saving}
                                  className="flex items-center gap-1"
                                >
                                  {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4" />
                                  )}
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handlePublish(record)}
                                  disabled={saving}
                                  className="flex items-center gap-1"
                                >
                                  {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                  Publish
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold">
                    <td className="py-3 px-4" colSpan={6}>Total</td>
                    <td className="py-3 px-4 text-right text-red-600">
                      {formatCurrency(
                        records.reduce((sum, r) => sum + parseFloat(r.totalDeductions), 0)
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-green-600">
                      {formatCurrency(
                        records.reduce((sum, r) => sum + parseFloat(r.netSalary), 0)
                      )}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && records.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-gray-500 mb-4">No payroll records found</p>
            <p className="text-sm text-gray-400">
              Select a month and year, then click "Load / Generate Payroll" to get started
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
