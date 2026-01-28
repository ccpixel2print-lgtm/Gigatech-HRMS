"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserCircle, LogOut, User, Lock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function HeaderProfile() {
  const pathname = usePathname();
  const isEmployee = pathname?.startsWith("/employee");

  // Determine Base URL
  const baseUrl = isEmployee ? "/employee/profile" : "/hr/settings";
  
  // Define Tab Names (HR uses 'general'/'security', Emp uses 'details'/'security')
  const profileTab = isEmployee ? "details" : "general";
  const securityTab = "security";

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 border border-slate-200">
          <UserCircle className="h-6 w-6 text-slate-600" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{isEmployee ? "Employee" : "HR Admin"}</p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          {/* 1. PROFILE */}
          <Link href={`${baseUrl}?tab=${profileTab}`}>
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          </Link>

          {/* 2. CHANGE PASSWORD */}
          <Link href={`${baseUrl}?tab=${securityTab}`}>
            <DropdownMenuItem className="cursor-pointer">
              <Lock className="mr-2 h-4 w-4" />
              <span>Change Password</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
