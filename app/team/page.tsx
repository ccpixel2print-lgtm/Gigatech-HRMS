import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCog } from 'lucide-react'

export default function TeamDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <UserCog className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Team Lead Dashboard</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Welcome, Team Lead!</CardTitle>
            <CardDescription>
              Manage your team and approve requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is a placeholder for the team lead dashboard. Phase 2 authentication is complete.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
