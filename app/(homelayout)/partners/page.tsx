import ExpandJob from "@/components/global/landing/expand-job";
import Faqs from "@/components/global/landing/faqs";
import Features from "@/components/global/landing/features";
import GetStarted from "@/components/global/landing/get-started";
import Grow from "@/components/global/landing/grow";
import PartnerBanner from "@/components/global/landing/partner-banner";
import { BriefcaseIcon, FileText, IdCardIcon, UserIcon } from "lucide-react";
import Testimonial from "@/components/global/landing/testimonial";
import WhyHirenza from "@/components/global/landing/why-horizzon";
import Image from "next/image";
import { getEnvironment, getPartnerData } from "@/app/actions";
import StayTuned from "@/components/global/landing/stay-tuned";
import { transformEnvironment } from "@/utils/transformEnvironment";
export const dynamic = "force-dynamic";
export default async function PartnerLandingPage() {
  const environment = await getEnvironment();
  const environmentType = transformEnvironment(environment?.environmentType);
  const partnerData = await getPartnerData();
  const {
    section1 = {},
    section2 = {},
    section3 = {},
    section4 = {},
    section5 = {},
    section6 = {},
    section7 = {},
    section8 = {},
  } = partnerData || {};

  const whyUsImages = ["/expedite.svg", "/turnover.svg", "/cost.svg"];

  const features =
    section2?.features &&
    section2?.features?.map((item: any, index: number) => {
      return {
        img: whyUsImages[index],
        ...item,
      };
    });

  const images = {
    null: "/get-started-partner.svg",
    0: "/registration.svg",
    1: "/review-cna.svg",
    2: "/send-offer.svg",
    3: "/hire-cna.svg",
  };
  const stepsBgColor = {
    null: "bg-[#6ADD8D]",
    0: "bg-[#6ADD8D]",
    1: "bg-[#c9f9e3]",
    2: "bg-[#6ADD8D]",
    3: "bg-[#c9f9e3]",
  };

  const stepsIcons = [
    <IdCardIcon className="size-[18px]" key={0} />,
    <UserIcon className="size-[18px]" key={1} />,
    <FileText className="size-[18px]" key={2} />,
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
      <PartnerBanner {...section1} environmentType={environmentType} />

      <Image
        src="/vector-banner.svg"
        alt="partner bg"
        width={600}
        height={512}
        className="absolute md:-right-36 -right-24 top-[40rem] md:top-[60rem] md:w-[689px] w-[248px] md:h-[512px] h-[184px]"
      />

      <WhyHirenza source="partner" features={features} />
      <Image
        src="/vector-expand.svg"
        alt="partner bg"
        width={600}
        height={512}
        className="absolute -left-36 top-[150rem] w-[689px] h-[512px] z-10 md:block hidden"
      />
      <ExpandJob {...section3} environmentType={environmentType} />
      <Features {...section4} />
      <GetStarted images={images} stepsBgColor={stepsBgColor} steps={steps} />
      <Grow source="partner" {...section6} environmentType={environmentType} />
      <Testimonial source="partner" {...section7} />
      <Faqs {...section8} />
      <StayTuned />
    </div>
  );
}
