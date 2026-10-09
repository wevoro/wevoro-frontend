import { getProLoginData } from "@/app/actions";
import { WaitlistGuard } from "@/components/global/waitlist-guard";

import ProLogin from "@/components/global/pro-login";

export const dynamic = "force-dynamic";
export default async function ProLoginPage() {
  const loginData = await getProLoginData();

  return WaitlistGuard(<ProLogin {...loginData} />);
}
