import { getPartnerSignupData } from "@/app/actions";
import { WaitlistGuard } from "@/components/global/waitlist-guard";
import PartnerSignup from "@/components/global/partner-signup";

export const dynamic = "force-dynamic";
export default async function PartnerSignupPage() {
  const signupData = await getPartnerSignupData();
  return WaitlistGuard(<PartnerSignup {...signupData} />);
}
