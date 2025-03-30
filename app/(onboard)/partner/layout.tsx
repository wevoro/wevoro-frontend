/* eslint-disable @next/next/no-img-element */
import React, { ReactNode } from "react";
import Onboard from "@/components/global/onboard";
import OnboardContentLayout from "@/components/global/onboard-layout";
import Help from "@/components/global/help";

const OnboardLayout: React.FC<any> = ({ children, source }) => {
  return (
    <main>
      <div className="grid grid-rows-1 lg:grid-cols-[26%_auto] h-screen">
        <div className="hidden lg:block">
          <Onboard source={source} />
        </div>
        <OnboardContentLayout source={source}>{children}</OnboardContentLayout>
      </div>
      <Help />
    </main>
  );
};

export default OnboardLayout;
