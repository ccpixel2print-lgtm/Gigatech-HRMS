"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton"; // Optional, or use simple div

interface HeaderUserInfoProps {
  role: "HR" | "EMPLOYEE";
}

export function HeaderUserInfo({ role }: HeaderUserInfoProps) {
  const [info, setInfo] = useState({ name: "", subtitle: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        if (role === "EMPLOYEE") {
          // Fetch detailed employee data (Name + Designation)
          const res = await fetch("/api/employee/me");
          if (res.ok) {
            const data = await res.json();
            setInfo({
              name: `${data.firstName} ${data.lastName}`,
              subtitle: data.designation || "Employee"
            });
          }
        } else {
          // HR: Fetch basic user data (Name + Fixed Role)
          const res = await fetch("/api/auth/me");
          if (res.ok) {
            const data = await res.json();
            setInfo({
              name: data.fullName || "HR Admin",
              subtitle: "HR Manager"
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [role]);

  if (loading) {
    return (
      <div className="text-right hidden md:block space-y-1">
        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse ml-auto" />
        <div className="h-3 w-16 bg-slate-200 rounded animate-pulse ml-auto" />
      </div>
    );
  }

  return (
    <div className="text-right hidden md:block">
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
        {info.name}
      </p>
      <p className="text-xs text-slate-500">
        {info.subtitle}
      </p>
    </div>
  );
}
