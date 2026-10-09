import { getProLoginData } from "@/app/actions";
import ResetPassword from "@/components/global/reset-password";
import { WaitlistGuard } from "@/components/global/waitlist-guard";
export const dynamic = "force-dynamic";
const ProResetPasswordPage = async () => {
  const loginData = await getProLoginData();
  return WaitlistGuard(
    <ResetPassword {...loginData} image={"/pro.jpg"} source="pro" />
  );
};

export default ProResetPasswordPage;
