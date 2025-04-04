import PartnerLogin from "@/components/global/partner-login";
import { getPartnerLoginData } from "@/app/actions";
import { WaitlistGuard } from "@/components/global/waitlist-guard";

export const dynamic = "force-dynamic";
export default async function PartnerLoginPage() {
  const loginData = await getPartnerLoginData();
  return WaitlistGuard(<PartnerLogin {...loginData} />);
}
