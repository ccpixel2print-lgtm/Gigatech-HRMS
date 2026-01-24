import { ReactNode } from 'react'
import Link from 'next/link'
import { User, LayoutDashboard, Calendar, FileText, LogOut } from 'lucide-react'

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 dark:bg-slate-950 text-white p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Employee Portal
          </h2>
          <p className="text-sm text-slate-400 mt-1">Gigatech HRMS</p>
        </div>

        <nav className="space-y-2">
          <Link
            href="/employee"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/employee/leaves"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Calendar className="h-5 w-5" />
            <span>My Leaves</span>
          </Link>

          <Link
            href="/employee/payslips"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <FileText className="h-5 w-5" />
            <span>My Payslips</span>
          </Link>

          <Link
            href="/employee/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <User className="h-5 w-5" />
            <span>Profile</span>
          </Link>
        </nav>

        <div className="mt-auto pt-6">
          <Link
            href="/api/auth/logout"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-red-400"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50 dark:bg-slate-900">
        {children}
      </main>
    </div>
  )
}
