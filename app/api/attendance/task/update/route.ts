import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskId, action, note } = body; 
    // action: "COMPLETE" | "POSTPONE" | "CANCEL"

    // 1. Find Task
    const task = await prisma.workLog.findUnique({ where: { id: taskId } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // 2. Calculate Final Duration
    const now = new Date();
    // Duration = (Now - Start) + Any previous duration if resumed (though we create new logs for resume usually)
    const sessionMinutes = Math.floor((now.getTime() - new Date(task.startTime).getTime()) / 60000);
    
    // 3. Determine Status String
    let status = "COMPLETED";
    if (action === "POSTPONE") status = "PAUSED"; // or "POSTPONED" if you add to schema
    if (action === "CANCEL") status = "CANCELLED";

    // 4. Update
    await prisma.workLog.update({
        where: { id: taskId },
        data: {
            endTime: now,
            durationMinutes: { increment: sessionMinutes }, // Add to whatever was there
            status: status,
            completionNote: note
        }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
