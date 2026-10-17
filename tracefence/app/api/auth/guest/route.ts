import { NextResponse } from "next/server";
import { issueGuestToken } from "@/lib/auth/guest";

/** Anonymous public session  no password. Public corpus only. */
export async function POST() {
  const guest = issueGuestToken();
  return NextResponse.json(guest);
}
