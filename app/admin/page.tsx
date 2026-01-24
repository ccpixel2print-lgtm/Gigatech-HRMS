import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Users, Settings as SettingsIcon, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the Gigatech HRMS Admin Panel
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">System users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">ADMIN, HR, TEAM_LEAD, EMPLOYEE</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Link href="/admin/users">
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button className="w-full justify-start" variant="outline">
              <SettingsIcon className="h-4 w-4 mr-2" />
              System Settings
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Phase 2 Complete */}
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardHeader>
          <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Phase 2: Authentication & Role Management
          </CardTitle>
          <CardDescription>
            All backend and admin features are now complete
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-green-700 dark:text-green-300">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              JWT Authentication with rate limiting
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Role-Based Access Control (RBAC)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              User Management UI with CRUD operations
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Account unlock functionality
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

