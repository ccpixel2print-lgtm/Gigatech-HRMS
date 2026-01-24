import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield } from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Welcome, Administrator!</CardTitle>
            <CardDescription>
              You have full system access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is a placeholder for the admin dashboard. Phase 2 authentication is complete.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
