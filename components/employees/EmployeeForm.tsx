'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { employeeSchema, type EmployeeFormValues } from '@/lib/validators/employee'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Save, Calculator } from 'lucide-react'

export function EmployeeForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('personal')

  // Salary calculation preview
  const [salaryPreview, setSalaryPreview] = useState({
    gross: 0,
    deductions: 0,
    net: 0,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      basicSalary: 0,
      hra: 0,
      da: 0,
      specialAllowance: 0,
      pf: 0,
      esi: 0,
      professionalTax: 0,
    },
  })

  // Watch salary fields for real-time calculation
  const basicSalary = watch('basicSalary') || 0
  const hra = watch('hra') || 0
  const da = watch('da') || 0
  const specialAllowance = watch('specialAllowance') || 0
  const pf = watch('pf') || 0
  const esi = watch('esi') || 0
  const professionalTax = watch('professionalTax') || 0

  useEffect(() => {
    const gross = Number(basicSalary) + Number(hra) + Number(da) + Number(specialAllowance)
    const deductions = Number(pf) + Number(esi) + Number(professionalTax)
    const net = gross - deductions

    setSalaryPreview({
      gross: gross,
      deductions: deductions,
      net: net,
    })
  }, [basicSalary, hra, da, specialAllowance, pf, esi, professionalTax])

  const onSubmit = async (data: EmployeeFormValues) => {
    setSubmitting(true)
    try {
      console.log('[FORM] Submitting employee data:', data)
      
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to create employee')
        return
      }

      alert('Employee created successfully!')
      router.push('/hr/employees')
    } catch (error) {
      console.error('[FORM] Failed to create employee:', error)
      alert('Failed to create employee')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="banking">Bank & Statutory</TabsTrigger>
          <TabsTrigger value="salary">Salary Structure</TabsTrigger>
        </TabsList>

        {/* Tab 1: Personal Details */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
              <CardDescription>
                Basic information about the employee
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    placeholder="Rajesh"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    placeholder="Kumar"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Work Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="rajesh.kumar@gigatech.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Employment Details */}
        <TabsContent value="employment">
          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
              <CardDescription>
                Job-related information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfJoining">Date of Joining *</Label>
                <Input
                  id="dateOfJoining"
                  type="date"
                  {...register('dateOfJoining')}
                />
                {errors.dateOfJoining && (
                  <p className="text-sm text-destructive">{errors.dateOfJoining.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    {...register('designation')}
                    placeholder="Software Engineer"
                  />
                  {errors.designation && (
                    <p className="text-sm text-destructive">{errors.designation.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    {...register('department')}
                    placeholder="Engineering"
                  />
                  {errors.department && (
                    <p className="text-sm text-destructive">{errors.department.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Bank & Statutory */}
        <TabsContent value="banking">
          <Card>
            <CardHeader>
              <CardTitle>Bank & Statutory Details</CardTitle>
              <CardDescription>
                Banking and Indian compliance information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    {...register('bankName')}
                    placeholder="HDFC Bank"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    {...register('accountNumber')}
                    placeholder="12345678901234"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  {...register('ifscCode')}
                  placeholder="HDFC0001234"
                />
                {errors.ifscCode && (
                  <p className="text-sm text-destructive">{errors.ifscCode.message}</p>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-4">Statutory Details (Indian Compliance)</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="panNumber">PAN Number</Label>
                    <Input
                      id="panNumber"
                      {...register('panNumber')}
                      placeholder="ABCDE1234F"
                      className="uppercase"
                    />
                    {errors.panNumber && (
                      <p className="text-sm text-destructive">{errors.panNumber.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uanNumber">UAN (PF Number)</Label>
                    <Input
                      id="uanNumber"
                      {...register('uanNumber')}
                      placeholder="100000000001"
                      maxLength={12}
                    />
                    {errors.uanNumber && (
                      <p className="text-sm text-destructive">{errors.uanNumber.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Salary Structure */}
        <TabsContent value="salary">
          <Card>
            <CardHeader>
              <CardTitle>Salary Structure (Annual)</CardTitle>
              <CardDescription>
                Define the CTC breakdown and deductions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Earnings */}
              <div className="border-b pb-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Earnings (Annual)
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basicSalary">Basic Salary *</Label>
                    <Input
                      id="basicSalary"
                      type="number"
                      step="0.01"
                      {...register('basicSalary')}
                      placeholder="300000"
                    />
                    {errors.basicSalary && (
                      <p className="text-sm text-destructive">{errors.basicSalary.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hra">HRA (House Rent Allowance)</Label>
                    <Input
                      id="hra"
                      type="number"
                      step="0.01"
                      {...register('hra')}
                      placeholder="120000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="da">DA (Dearness Allowance)</Label>
                    <Input
                      id="da"
                      type="number"
                      step="0.01"
                      {...register('da')}
                      placeholder="50000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialAllowance">Special Allowance</Label>
                    <Input
                      id="specialAllowance"
                      type="number"
                      step="0.01"
                      {...register('specialAllowance')}
                      placeholder="100000"
                    />
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="border-b pb-4">
                <h3 className="font-medium mb-3">Deductions (Annual)</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pf">Provident Fund (PF)</Label>
                    <Input
                      id="pf"
                      type="number"
                      step="0.01"
                      {...register('pf')}
                      placeholder="36000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="esi">ESI</Label>
                    <Input
                      id="esi"
                      type="number"
                      step="0.01"
                      {...register('esi')}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="professionalTax">Professional Tax</Label>
                    <Input
                      id="professionalTax"
                      type="number"
                      step="0.01"
                      {...register('professionalTax')}
                      placeholder="2400"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <h3 className="font-medium mb-3">Salary Preview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Gross Annual (CTC):</span>
                    <span className="font-medium">₹{salaryPreview.gross.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Deductions:</span>
                    <span className="font-medium text-destructive">-₹{salaryPreview.deductions.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Net Annual:</span>
                    <span className="font-bold text-green-600">₹{salaryPreview.net.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Net Monthly:</span>
                    <span className="font-medium">₹{(salaryPreview.net / 12).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/hr/employees')}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Create Employee
        </Button>
      </div>
    </form>
  )
}
