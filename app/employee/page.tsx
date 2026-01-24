import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from 'lucide-react'

export default function EmployeeDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <User className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Employee Dashboard</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Welcome, Employee!</CardTitle>
            <CardDescription>
              View your payslips and manage leaves
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is a placeholder for the employee dashboard. Phase 2 authentication is complete.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
