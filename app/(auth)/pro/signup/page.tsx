import { getProSignupData } from "@/app/actions";
import { WaitlistGuard } from "@/components/global/waitlist-guard";
import ProSignup from "@/components/global/pro-signup";
import React from "react";

export const dynamic = "force-dynamic";
export default async function ProSignupPage() {
  const signupData = await getProSignupData();
  return WaitlistGuard(<ProSignup {...signupData} />);
}
