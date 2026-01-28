import { ReactNode } from 'react'
import Link from 'next/link'
import { LayoutDashboard, CalendarDays, Receipt, User, Settings } from 'lucide-react' // Updated Icons
import { LogoutButton } from "@/components/LogoutButton";
import { HeaderProfile } from "@/components/HeaderProfile"; // Reuse this!
import { HeaderUserInfo } from "@/components/HeaderUserInfo";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 dark:bg-slate-950 text-white p-6 flex flex-col fixed h-full z-20">
        <div className="mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            Employee
          </h2>
          <p className="text-sm text-slate-400 mt-1">Gigatech HRMS</p>
        </div>

        <nav className="space-y-2 flex-1">
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
            <CalendarDays className="h-5 w-5" />
            <span>My Leaves</span>
          </Link>

          <Link
            href="/employee/payslips"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Receipt className="h-5 w-5" />
            <span>My Payslips</span>
          </Link>

          <Link
            href="/employee/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <User className="h-5 w-5" />
            <span>My Profile</span>
          </Link>
        </nav>

        <div className="pt-6 border-t border-slate-800">
            <LogoutButton />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col ml-64 min-h-screen">
        
        {/* HEADER */}
        <header className="h-16 bg-white dark:bg-slate-950 border-b flex items-center justify-end px-8 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            
            {/* REPLACE THE HARDCODED TEXT DIV WITH THIS: */}
            <HeaderUserInfo role="EMPLOYEE" />
            
            {/* Reuse Profile Dropdown */}
            <HeaderProfile />
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
