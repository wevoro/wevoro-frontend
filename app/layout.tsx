import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Provider from "@/lib/provider";
import { Toaster } from "sonner";
import Refresh from "@/components/global/refresh";
import Script from "next/script";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hirenza",
  description:
    "Unlock your next opportunity in healthcare. Sign in and apply jobs. It's fast, free, and puts you in control of your career journey.",
  twitter: {
    card: "summary_large_image",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 10;
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
  params: {
    locale: string;
  };
}>) {
  return (
    <html lang="en">
      <head>
        {/* <Script
          id={`usercentrics-cmp`}
          async={true}
          src={`https://web.cmp.usercentrics.eu/modules/autoblocker.js`}
          strategy={`beforeInteractive`}
          type={`text/javascript`}
        /> */}
        <Script
          id={`usercentrics-cmp`}
          async={true}
          src={`https://web.cmp.usercentrics.eu/ui/loader.js`}
          strategy={`beforeInteractive`}
          data-settings-id={`rIJPPR0BivXKei`}
          type={`text/javascript`}
        />
      </head>

      {/* <Script
        id="usercentrics-cmp"
        src="https://web.cmp.usercentrics.eu/ui/loader.js"
        data-settings-id="rIJPPR0BivXKei"
        async
      ></Script> */}

      <body className={`${poppins.className}`}>
        <Provider>
          <Refresh />
          <main>{children}</main>
          <Toaster />
        </Provider>
      </body>
    </html>
  );
}
