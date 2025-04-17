import { getProLoginData } from "@/app/actions";
import ForgotPassword from "@/components/global/forgot-password";
import { WaitlistGuard } from "@/components/global/waitlist-guard";
export const dynamic = "force-dynamic";
const ProForgotPasswordPage = async () => {
  const loginData = await getProLoginData();
  return WaitlistGuard(
    <ForgotPassword {...loginData} image={"/pro.jpg"} source="pro" />
  );
};

export default ProForgotPasswordPage;
