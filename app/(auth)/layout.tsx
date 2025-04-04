/* eslint-disable @next/next/no-img-element */
import Help from "@/components/global/help";
import React, { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = async ({ children }: AuthLayoutProps) => {
  return (
    <div>
      {children}
      <Help />
    </div>
  );
};

export default AuthLayout;
