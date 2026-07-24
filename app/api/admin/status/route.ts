import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";

export async function GET() {
  const { isAdmin } = await getAdminViewer();
  return NextResponse.json({ isAdmin });
}
