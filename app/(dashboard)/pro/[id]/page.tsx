import Documents from "@/components/global/dashboard/documents";
import PersonalInformation from "@/components/global/dashboard/personal-information";
import ProfessionalInformation from "@/components/global/dashboard/professional-information";
import Skills from "@/components/global/dashboard/skills";
import React from "react";
import { getUser, getUserById } from "@/app/actions";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

const ProPage = async ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const proUser = await getUserById(id);
  const user = await getUser();

  if (!proUser) {
    return redirect("/");
  }

  console.log("user?.role", user?.role);

  if (user?.role === "partner") {
    return redirect(`/partner/pros/${id}?s=true`);
  }
  return (
    <div className="relative flex flex-col gap-8 min-h-screen">
      <PersonalInformation proUser={proUser} />
      {user && (
        <>
          <ProfessionalInformation />
          <Skills />
          <Documents />
        </>
      )}

      {!user && (
        <div className="absolute top-40 lg:top-20 5xl:bottom-80 inset-0 flex items-center justify-center">
          <div className="p-6 bg-opacity-50 max-w-lg w-full text-center">
            <Button
              href={`/partner/login?id=${id}&s=true`}
              className="h-14 px-8 mr-4 border-primary text-primary rounded-lg text-base md:text-lg font-semibold"
              variant="outline"
            >
              Sign in
            </Button>
            <Button
              href={`/partner/signup?id=${id}&s=true`}
              className="h-14 px-8 rounded-lg text-base md:text-lg font-semibold"
            >
              Sign up now!
            </Button>

            <p className="mt-4 text-sm md:text-base">
              Completed your profile now in a few seconds! Enjoy our platform by
              viewing handpicked verified Pro CNAs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProPage;
