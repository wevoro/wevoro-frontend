import Footer from "@/components/global/landing/footer";
import Navbar from "@/components/global/navbar";
import { transformEnvironment } from "@/utils/transformEnvironment";
import { getEnvironment } from "../actions";
import React from "react";
import { getFooterData } from "../actions";

const HomeLayout = async ({ children }: { children: React.ReactNode }) => {
  const footerData = await getFooterData();
  const environment = await getEnvironment();
  const environmentType = transformEnvironment(environment?.environmentType);

  return (
    <div>
      <Navbar environmentType={environmentType} />
      {children}
      <Footer {...footerData} environmentType={environmentType} />
    </div>
  );
};

export default HomeLayout;
