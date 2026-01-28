import { ReactNode } from 'react'
import Link from 'next/link'
import { Users, LayoutDashboard, Settings, DollarSign } from 'lucide-react'
import { LogoutButton } from "@/components/LogoutButton";
import { HeaderProfile } from "@/components/HeaderProfile"; // New Component
import { HeaderUserInfo } from "@/components/HeaderUserInfo";

export default function HRLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      
      {/* 1. FIXED SIDEBAR */}
      <aside className="w-64 bg-slate-900 dark:bg-slate-950 text-white p-6 flex flex-col fixed h-full z-20">
        <div className="mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            HR Manager
          </h2>
          <p className="text-sm text-slate-400 mt-1">Gigatech HRMS</p>
        </div>

        <nav className="space-y-2 flex-1">
          <Link
            href="/hr"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/hr/employees"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Users className="h-5 w-5" />
            <span>Employees</span>
          </Link>

          <Link
            href="/hr/payroll"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <DollarSign className="h-5 w-5" />
            <span>Payroll</span>
          </Link>

          <Link
            href="/hr/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="pt-6 border-t border-slate-800">
            <LogoutButton />
        </div>
      </aside>

      {/* 2. MAIN WRAPPER (Pushed right by ml-64) */}
      <div className="flex-1 flex flex-col ml-64 min-h-screen">
        
        {/* TOP HEADER */}
        <header className="h-16 bg-white dark:bg-slate-950 border-b flex items-center justify-end px-8 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            
            {/* REPLACE THE HARDCODED TEXT DIV WITH THIS: */}
            <HeaderUserInfo role="HR" />
            
            {/* Safe Client Component */}
            <HeaderProfile />
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
