import { getProLoginData } from "@/app/actions";
import { WaitlistGuard } from "@/components/global/waitlist-guard";
import VerifyOTP from "@/components/global/verify-otp";

export const dynamic = "force-dynamic";
const ProVerifyOTPPage = async () => {
  const loginData = await getProLoginData();
  return WaitlistGuard(
    <VerifyOTP {...loginData} image={"/pro.jpg"} source="pro" />
  );
};

export default ProVerifyOTPPage;
