/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import { Averia_Serif_Libre } from "next/font/google";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useAppContext } from "@/lib/context";

const averia = Averia_Serif_Libre({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export default function Auth({
  title,
  children,
  subtitle,
  type,
  source,
  image,
  descriptionTitle,
  description,
  alreadyHaveAccount,
  resendOTP,
  isResendOTPLoading,
}: any) {
  const { querySuffix } = useAppContext();

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row">
      <div
        className="hidden lg:flex lg:w-1/3 bg-cover bg-no-repeat bg-center text-center flex-col justify-between items-center text-white px-4 xl:px-14 pt-10"
        style={{
          backgroundImage: `url(${image})`,
          backgroundPosition: source === "partner" ? "center 20%" : "center",
        }}
      >
        <div className="flex flex-col items-center justify-between h-[90vh]">
          <Link
            href="/"
            className={cn(
              `${averia.className} text-[40px] 3xl:text-5xl !font-light`,
              {
                "text-primary": source === "partner",
              }
            )}
          >
            Hirenza
          </Link>
          <div className="xl:max-w-md mx-auto">
            <p className="text-[28px] 2xl:text-[32px] mb-4 leading-[40px] xl:leading-[46px] font-bold">
              {descriptionTitle}
            </p>

            <p className="mb-10">{description}</p>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-2/3 p-4 pt-24 lg:p-8 bg-[#f9f9f9] overflow-y-auto h-screen scrollbar-hide">
        <div
          className="w-full max-w-[620px] mx-auto"
          style={{ display: "table", height: "100%" }}
        >
          <div
            style={{ display: "table-cell", verticalAlign: "middle" }}
            className="space-y-6"
          >
            <div className="text-center space-y-2 mb-10">
              <h1 className="text-[32px] font-semibold tracking-tight">
                {title}
              </h1>

              <p className="text-base ">{subtitle}</p>
            </div>
            {children}

            <div className="text-start">
              {(type === "login" || type === "signup") &&
                source !== "admin" && (
                  <>
                    {type === "login" ? (
                      <p className="text-base">
                        New to Hirenza?{" "}
                        <Link
                          href={`/${source}/signup${querySuffix}`}
                          className="text-primary font-semibold underline underline-offset-4"
                        >
                          Create an account
                        </Link>
                      </p>
                    ) : (
                      <p className="text-base">
                        {alreadyHaveAccount}{" "}
                        <Link
                          href={`/${source}/login${querySuffix}`}
                          className="text-primary font-semibold underline underline-offset-4"
                        >
                          Login
                        </Link>
                      </p>
                    )}
                  </>
                )}

              {type === "verify-otp" && (
                <div className="text-base flex items-center">
                  Didn't receive the code?{" "}
                  <Button
                    variant="special"
                    onClick={resendOTP}
                    disabled={isResendOTPLoading}
                    className="text-primary font-semibold underline underline-offset-4"
                  >
                    {isResendOTPLoading ? "Sending..." : "Resend code"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
