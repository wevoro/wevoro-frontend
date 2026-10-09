import { getPartnerLoginData } from "@/app/actions";
import { WaitlistGuard } from "@/components/global/waitlist-guard";
import ResetPassword from "@/components/global/reset-password";

export const dynamic = "force-dynamic";
const PartnerResetPasswordPage = async () => {
  const loginData = await getPartnerLoginData();
  return WaitlistGuard(
    <ResetPassword
      {...loginData}
      image={"/partner_signin.svg"}
      source="partner"
    />
  );
};

export default PartnerResetPasswordPage;
