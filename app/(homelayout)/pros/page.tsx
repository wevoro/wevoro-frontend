import { getEnvironment, getProData } from "@/app/actions";
import CareerPro from "@/components/global/landing/career-pro";
import Faqs from "@/components/global/landing/faqs";
import Features from "@/components/global/landing/features";
import GetStarted from "@/components/global/landing/get-started";
import Grow from "@/components/global/landing/grow";
import ProBanner from "@/components/global/landing/pro-banner";
import StayTuned from "@/components/global/landing/stay-tuned";
import Testimonial from "@/components/global/landing/testimonial";
import WhyHirenza from "@/components/global/landing/why-horizzon";
import { transformEnvironment } from "@/utils/transformEnvironment";
import { BriefcaseIcon, FileIcon, IdCardIcon, UserIcon } from "lucide-react";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function ProLandingPage() {
  const environment = await getEnvironment();
  const environmentType = transformEnvironment(environment?.environmentType);
  const proData = await getProData();
  const {
    section1 = {},
    section2 = {},
    section3 = {},
    section4 = {},
    section5 = {},
    section6 = {},
    section7 = {},
    section8 = {},
  } = proData || {};

  const whyUsImages = ["/interview.svg", "/peace.svg", "/earn.svg"];

  const features =
    section2?.features &&
    section2?.features?.map((item: any, index: number) => {
      return {
        img: whyUsImages[index],
        ...item,
      };
    });

  const images = {
    null: "/get-started-pro.svg",
    0: "/professional.svg",
    1: "/document-info.svg",
    2: "/profile.svg",
    3: "/jobs.svg",
  };

  const stepsBgColor = {
    null: "bg-[#bcf8dc]",
    0: "bg-[#87e4a5]",
    1: "bg-[#c9f9e3]",
    2: "bg-[#87e4a5]",
    3: "bg-[#c9f9e3]",
  };

  const stepsIcons = [
    <IdCardIcon className="size-[18px]" key={0} />,
    <FileIcon className="size-[18px]" key={1} />,
    <UserIcon className="size-[18px]" key={2} />,
    <BriefcaseIcon className="size-[18px]" key={3} />,
  ];

  const steps =
    section5?.steps &&
    section5?.steps?.map((item: any, index: number) => {
      return {
        ...item,
        icon: stepsIcons[index],
      };
    });
  return (
    <div className="mt-16 relative overflow-hidden">
      <ProBanner {...section1} environmentType={environmentType} />
      <Image
        src="/vector-banner.svg"
        alt="partner bg"
        width={600}
        height={512}
        className="absolute md:-right-36 -right-24 top-[40rem] md:top-[60rem] md:w-[689px] w-[248px] md:h-[512px] h-[184px]"
      />
      <WhyHirenza source="pro" {...section2} features={features} />
      <Image
        src="/vector-expand-pro.svg"
        alt="partner bg"
        width={453}
        height={384}
        className="absolute -left-36 top-[155rem] w-[453px] h-[384px] z-10 md:block hidden"
      />
      <CareerPro {...section3} environmentType={environmentType} />
      <Features {...section4} />
      <GetStarted images={images} stepsBgColor={stepsBgColor} steps={steps} />
      <Grow source="pro" {...section6} environmentType={environmentType} />
      <Testimonial source="pro" {...section7} />
      <Faqs {...section8} />
      <StayTuned />
    </div>
  );
}
