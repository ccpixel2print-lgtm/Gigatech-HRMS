import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // 1. Create Today's Date
  const today = new Date();
  // 2. Reset Time to 00:00:00 to catch any holiday happening TODAY
  today.setHours(0, 0, 0, 0);

// Fetch ALL 2026 holidays
const holidays = await prisma.holiday.findMany({
    where: { year: 2026 },
    orderBy: { date: 'asc' }
    });
    
    // Filter for future ones in JS
    const future = holidays.filter(h => new Date(h.date) >= new Date());
    
    return NextResponse.json(future.slice(0, 3));
    
}
