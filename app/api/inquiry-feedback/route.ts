import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendInquiryNeedsReviewAlert } from "@/lib/resend";

// Landing spot for the Yes/No links in an inquiry confirmation email's poll
// — a GET because it's clicked straight out of an email client, not
// submitted from a form. "No" pings the team; "Yes" just closes the loop.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const resolvedParam = searchParams.get("resolved");

  if (!id || (resolvedParam !== "true" && resolvedParam !== "false")) {
    return new NextResponse("Missing or invalid parameters.", { status: 400 });
  }
  const resolved = resolvedParam === "true";

  const inquiry = await prisma.inquiry.findUnique({ where: { id } });
  if (!inquiry) {
    return new NextResponse("We couldn't find this request — it may have expired.", {
      status: 404,
    });
  }

  await prisma.inquiry.update({ where: { id }, data: { resolved } });

  if (!resolved) {
    await sendInquiryNeedsReviewAlert(inquiry);
  }

  const message = resolved
    ? "Glad that helped — thanks for letting us know!"
    : "Got it — our team will follow up with you personally.";

  const page = `<!doctype html><html><head><meta charset="utf-8" /><title>Thanks</title></head><body style="font-family:Verdana,Geneva,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5;"><p style="font-size:16px;color:#1a1a1a;">${message}</p></body></html>`;

  return new NextResponse(page, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
