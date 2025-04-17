import { getPartnerLoginData } from "@/app/actions";
import { WaitlistGuard } from "@/components/global/waitlist-guard";
import ForgotPassword from "@/components/global/forgot-password";

export const dynamic = "force-dynamic";
const PartnerForgotPasswordPage = async () => {
  const loginData = await getPartnerLoginData();
  return WaitlistGuard(
    <ForgotPassword
      {...loginData}
      image={"/partner_signin.svg"}
      source="partner"
    />
  );
};

export default PartnerForgotPasswordPage;
