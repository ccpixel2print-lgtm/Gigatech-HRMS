"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function HRSettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage system configurations</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="salary">Salary Config</TabsTrigger>
          <TabsTrigger value="leaves">Leave Policy</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>View company information (Read Only - Contact Admin to change)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label>Company Name</Label>
                <Input disabled defaultValue="GigaTech Services" />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label>Financial Year Start</Label>
                <Input disabled defaultValue="April" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Tab (Placeholder) */}
        <TabsContent value="salary">
          <Card>
            <CardHeader>
              <CardTitle>Salary Components</CardTitle>
              <CardDescription>Default percentages for auto-calculation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>PF Employee (%)</Label>
                  <Input type="number" defaultValue="12" />
                </div>
                <div>
                  <Label>PF Employer (%)</Label>
                  <Input type="number" defaultValue="12" />
                </div>
              </div>
              <Button disabled>Save Changes (Coming Soon)</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Tab (Placeholder) */}
        <TabsContent value="leaves">
          <Card>
            <CardHeader>
              <CardTitle>Leave Quotas</CardTitle>
              <CardDescription>Annual leave allocation per employee</CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-sm text-gray-500">Managed via Database Seeding in MVP Phase 1.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
