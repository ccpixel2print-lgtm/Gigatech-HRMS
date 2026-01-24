'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { 
  createEmployeeSchema, 
  type CreateEmployeeInput 
} from '@/lib/validators/employee'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
    setValue,
    watch,
  } = useForm<CreateEmployeeInput>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      status: 'DRAFT',
      salary: {
        otherAllowances: '0',
        esi: '0',
        professionalTax: '0',
        incomeTax: '0',
        otherDeductions: '0',
        isActive: true,
      },
    },
  })

  // Watch salary fields for real-time calculation
  const watchedSalary = watch('salary')

  useEffect(() => {
    if (watchedSalary) {
      const basic = parseFloat(watchedSalary.basicSalary || '0')
      const hra = parseFloat(watchedSalary.hra || '0')
      const conveyance = parseFloat(watchedSalary.conveyanceAllowance || '0')
      const medical = parseFloat(watchedSalary.medicalAllowance || '0')
      const special = parseFloat(watchedSalary.specialAllowance || '0')
      const other = parseFloat(watchedSalary.otherAllowances || '0')

      const pf = parseFloat(watchedSalary.providentFund || '0')
      const esi = parseFloat(watchedSalary.esi || '0')
      const pt = parseFloat(watchedSalary.professionalTax || '0')
      const it = parseFloat(watchedSalary.incomeTax || '0')
      const otherDed = parseFloat(watchedSalary.otherDeductions || '0')

      const gross = basic + hra + conveyance + medical + special + other
      const deductions = pf + esi + pt + it + otherDed
      const net = gross - deductions

      setSalaryPreview({
        gross: gross,
        deductions: deductions,
        net: net,
      })

      // Auto-calculate CTC and Net Salary
      setValue('salary.ctcAnnual', gross.toString())
      setValue('salary.netSalaryAnnual', net.toString())
      setValue('salary.netSalaryMonthly', (net / 12).toFixed(2))
    }
  }, [watchedSalary, setValue])

  const onSubmit = async (data: CreateEmployeeInput) => {
    setSubmitting(true)
    try {
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
      console.error('Failed to create employee:', error)
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth')}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select onValueChange={(value) => setValue('gender', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-destructive">{errors.gender.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  <Select onValueChange={(value) => setValue('maritalStatus', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE">Single</SelectItem>
                      <SelectItem value="MARRIED">Married</SelectItem>
                      <SelectItem value="DIVORCED">Divorced</SelectItem>
                      <SelectItem value="WIDOWED">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="personalPhone">Personal Phone *</Label>
                  <Input
                    id="personalPhone"
                    {...register('personalPhone')}
                    placeholder="9876543210"
                  />
                  {errors.personalPhone && (
                    <p className="text-sm text-destructive">{errors.personalPhone.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="personalEmail">Personal Email</Label>
                <Input
                  id="personalEmail"
                  type="email"
                  {...register('personalEmail')}
                  placeholder="rajesh@personal.com"
                />
                {errors.personalEmail && (
                  <p className="text-sm text-destructive">{errors.personalEmail.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentAddress">Current Address</Label>
                <Input
                  id="currentAddress"
                  {...register('currentAddress')}
                  placeholder="123 MG Road, Bangalore"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    {...register('city')}
                    placeholder="Bangalore"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    {...register('state')}
                    placeholder="Karnataka"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    {...register('pincode')}
                    placeholder="560001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                  <Input
                    id="emergencyContactName"
                    {...register('emergencyContactName')}
                    placeholder="Priya Kumar"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                  <Input
                    id="emergencyContactPhone"
                    {...register('emergencyContactPhone')}
                    placeholder="9876543211"
                  />
                </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workEmail">Work Email *</Label>
                  <Input
                    id="workEmail"
                    type="email"
                    {...register('workEmail')}
                    placeholder="rajesh.kumar@gigatech.com"
                  />
                  {errors.workEmail && (
                    <p className="text-sm text-destructive">{errors.workEmail.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Temporary Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    placeholder="Default: 1234"
                  />
                  <p className="text-xs text-muted-foreground">Leave empty to use default (1234)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="employmentType">Employment Type *</Label>
                  <Select onValueChange={(value) => setValue('employmentType', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_TIME">Full Time</SelectItem>
                      <SelectItem value="PART_TIME">Part Time</SelectItem>
                      <SelectItem value="CONTRACT">Contract</SelectItem>
                      <SelectItem value="INTERN">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.employmentType && (
                    <p className="text-sm text-destructive">{errors.employmentType.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation *</Label>
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
                  <Label htmlFor="department">Department *</Label>
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
                  <Label htmlFor="bankAccountNumber">Account Number</Label>
                  <Input
                    id="bankAccountNumber"
                    {...register('bankAccountNumber')}
                    placeholder="12345678901234"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankIfscCode">IFSC Code</Label>
                  <Input
                    id="bankIfscCode"
                    {...register('bankIfscCode')}
                    placeholder="HDFC0001234"
                  />
                  {errors.bankIfscCode && (
                    <p className="text-sm text-destructive">{errors.bankIfscCode.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankBranch">Branch</Label>
                  <Input
                    id="bankBranch"
                    {...register('bankBranch')}
                    placeholder="MG Road Branch"
                  />
                </div>
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
                    <Label htmlFor="aadharNumber">Aadhar Number</Label>
                    <Input
                      id="aadharNumber"
                      {...register('aadharNumber')}
                      placeholder="123456789012"
                      maxLength={12}
                    />
                    {errors.aadharNumber && (
                      <p className="text-sm text-destructive">{errors.aadharNumber.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="esicNumber">ESIC Number</Label>
                    <Input
                      id="esicNumber"
                      {...register('esicNumber')}
                      placeholder="Optional"
                    />
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
                      {...register('salary.basicSalary')}
                      placeholder="300000"
                    />
                    {errors.salary?.basicSalary && (
                      <p className="text-sm text-destructive">{errors.salary.basicSalary.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hra">HRA *</Label>
                    <Input
                      id="hra"
                      type="number"
                      step="0.01"
                      {...register('salary.hra')}
                      placeholder="120000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="conveyanceAllowance">Conveyance *</Label>
                    <Input
                      id="conveyanceAllowance"
                      type="number"
                      step="0.01"
                      {...register('salary.conveyanceAllowance')}
                      placeholder="19200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medicalAllowance">Medical *</Label>
                    <Input
                      id="medicalAllowance"
                      type="number"
                      step="0.01"
                      {...register('salary.medicalAllowance')}
                      placeholder="15000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialAllowance">Special *</Label>
                    <Input
                      id="specialAllowance"
                      type="number"
                      step="0.01"
                      {...register('salary.specialAllowance')}
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
                    <Label htmlFor="providentFund">Provident Fund (PF) *</Label>
                    <Input
                      id="providentFund"
                      type="number"
                      step="0.01"
                      {...register('salary.providentFund')}
                      placeholder="36000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="esi">ESI</Label>
                    <Input
                      id="esi"
                      type="number"
                      step="0.01"
                      {...register('salary.esi')}
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
                      {...register('salary.professionalTax')}
                      placeholder="2400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="incomeTax">Income Tax (TDS)</Label>
                    <Input
                      id="incomeTax"
                      type="number"
                      step="0.01"
                      {...register('salary.incomeTax')}
                      placeholder="0"
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

              {/* Effective Date */}
              <div className="space-y-2">
                <Label htmlFor="effectiveFrom">Effective From *</Label>
                <Input
                  id="effectiveFrom"
                  type="date"
                  {...register('salary.effectiveFrom')}
                />
                {errors.salary?.effectiveFrom && (
                  <p className="text-sm text-destructive">{errors.salary.effectiveFrom.message}</p>
                )}
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
