// app/(auth)/components/AuthGuard.tsx

import { getEnvironment } from "@/app/actions";
import { transformEnvironment } from "@/utils/transformEnvironment";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export const WaitlistGuard = async (children: ReactNode) => {
  const environment = await getEnvironment();
  const environmentType = transformEnvironment(environment?.environmentType);

  if (environmentType === "waitlist") {
    redirect("/"); // Or your fallback route
  }

  return children;
};
