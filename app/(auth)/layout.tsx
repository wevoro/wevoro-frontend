/* eslint-disable @next/next/no-img-element */
import Help from "@/components/global/help";
import React, { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <>
      {children}
      <Help />
    </>
  );
};

export default AuthLayout;
