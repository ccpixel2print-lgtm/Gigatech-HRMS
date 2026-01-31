import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      select: { id: true, name: true }
    });
    
    // CRITICAL: You must return the JSON
    return NextResponse.json(companies);
    
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load companies" }, { status: 500 });
  }
}
