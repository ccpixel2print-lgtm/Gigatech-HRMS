import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

export default function MyLeavesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Leaves</h1>
      
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-slate-100 p-4 rounded-full mb-4">
            <CalendarDays className="h-10 w-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground max-w-sm">
            The Leave Management module is currently under development. 
            Please contact HR directly for leave requests in the meantime.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
