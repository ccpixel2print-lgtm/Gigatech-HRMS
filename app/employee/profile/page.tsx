"use client";

import { useEffect, useState } from "react";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Lock, User } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

export default function EmployeeProfilePage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "general"; // Default to general if no param
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Password State
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/employee/me"); 
        if (res.ok) {
            setEmployee(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleChangePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return alert("Mismatch");
    setSavingPass(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new })
      });
      if(res.ok) { alert("Password Changed"); setPasswords({current:"", new:"", confirm:""}); }
      else throw new Error((await res.json()).error);
    } catch(e: any) { alert("Error: " + e.message); }
    finally { setSavingPass(false); }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>
      
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="details"><User className="w-4 h-4 mr-2"/> Details</TabsTrigger>
          <TabsTrigger value="security"><Lock className="w-4 h-4 mr-2"/> Security</TabsTrigger>
        </TabsList>

        {/* TAB 1: EMPLOYEE DETAILS (READ ONLY) */}
        <TabsContent value="details" className="mt-6">
           {employee ? (
             // REUSING THE FORM COMPONENT IN READ-ONLY MODE
             <EmployeeForm initialData={employee} readOnly={true} />
           ) : (
             <Card><CardContent className="p-8">No employee record linked to your account.</CardContent></Card>
           )}
        </TabsContent>

        {/* TAB 2: CHANGE PASSWORD */}
        <TabsContent value="security" className="mt-6">
           <Card>
             <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
             <CardContent>
               <form onSubmit={handleChangePass} className="max-w-md space-y-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input type="password" value={passwords.current} onChange={e=>setPasswords({...passwords, current: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input type="password" value={passwords.new} onChange={e=>setPasswords({...passwords, new: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm</Label>
                    <Input type="password" value={passwords.confirm} onChange={e=>setPasswords({...passwords, confirm: e.target.value})} required />
                  </div>
                  <Button type="submit" disabled={savingPass}>
                    {savingPass ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Password"}
                  </Button>
               </form>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}