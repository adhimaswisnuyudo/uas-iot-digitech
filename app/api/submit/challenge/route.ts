import { NextResponse } from "next/server";
import { createSubmitChallenge } from "@/lib/antibot";

export async function GET() {
  const challenge = createSubmitChallenge();
  return NextResponse.json(challenge);
}
