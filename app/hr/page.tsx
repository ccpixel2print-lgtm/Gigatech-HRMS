export default function HRDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">HR Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the HR Management Portal
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Employees</h3>
          <p className="text-3xl font-bold mt-2">0</p>
          <p className="text-sm text-muted-foreground mt-1">Active employees</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Draft Profiles</h3>
          <p className="text-3xl font-bold mt-2">0</p>
          <p className="text-sm text-muted-foreground mt-1">Pending completion</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
          <h3 className="text-sm font-medium text-muted-foreground">This Month</h3>
          <p className="text-3xl font-bold mt-2">0</p>
          <p className="text-sm text-muted-foreground mt-1">New joiners</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="space-y-2">
          <a
            href="/hr/employees/new"
            className="block p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="font-medium">Add New Employee</div>
            <div className="text-sm text-muted-foreground">Create a new employee profile</div>
          </a>
          <a
            href="/hr/employees"
            className="block p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="font-medium">View All Employees</div>
            <div className="text-sm text-muted-foreground">Browse and manage employee records</div>
          </a>
        </div>
      </div>
    </div>
  )
}
