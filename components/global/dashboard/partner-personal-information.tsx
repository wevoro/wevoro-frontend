"use client";
import React from "react";
import Title from "../title";
import EditBtn from "./edit-btn";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/lib/context";
import moment from "moment";
import NoData from "../no-data";
import SectionDescription from "../section-description";

const PartnerPersonalInformation = ({
  from,
  partnerUser,
}: {
  from?: string;
  partnerUser?: any;
}) => {
  const { user } = useAppContext();

  const userData = partnerUser ? partnerUser : user;

  const firstName = userData?.personalInfo?.firstName;
  const lastName = userData?.personalInfo?.lastName;
  const dateEstablished = userData?.personalInfo?.dateEstablished;
  const address = userData?.personalInfo?.address;
  const companyName = userData?.personalInfo?.companyName;
  const industry = userData?.personalInfo?.industry;
  const email = userData?.email;
  const phone = userData?.personalInfo?.phone;

  const bio = userData?.personalInfo?.bio;
  const noData = !userData?.personalInfo;

  return (
    <div
      className={cn(
        "bg-white md:rounded-[16px]",
        from === "admin" ? "p-0" : "px-4 p-6 md:p-8 "
      )}
    >
      <div className="flex items-center justify-between border-b pb-4 mb-8">
        <Title
          text="Personal information"
          className="mb-0 !text-lg md:!text-2xl"
        />
        {from !== "admin" && (
          <EditBtn href={`/partner/edit/personal-information?edit=true`} />
        )}
      </div>

      {!noData ? (
        <div className="space-y-6">
          <div className="border-b pb-6 flex flex-col gap-5">
            <SectionTitle
              text="Company Details"
              className="uppercase text-[#9E9E9E]"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(firstName || lastName) && (
                <div className="flex flex-col gap-1.5 md:gap-2.5">
                  <SectionTitle text="Name" />
                  <SectionDescription
                    text={`${firstName} ${lastName}`}
                    from={from}
                  />
                </div>
              )}

              {companyName && (
                <div className="flex flex-col gap-1.5 md:gap-2.5">
                  <SectionTitle text="Company Name" />

                  <SectionDescription text={companyName} from={from} />
                </div>
              )}
              {industry && (
                <div className="flex flex-col gap-1.5 md:gap-2.5">
                  <SectionTitle text="Industry" />

                  <SectionDescription text={industry} from={from} />
                </div>
              )}

              {dateEstablished && (
                <div className="flex flex-col gap-1.5 md:gap-2.5">
                  <SectionTitle text="Date Established" />
                  <SectionDescription
                    text={moment(dateEstablished).format("MMMM Do YYYY")}
                    from={from}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="border-b pb-6 flex flex-col gap-1.5 md:gap-2.5">
            <SectionTitle text="Bio" />
            <SectionDescription text={bio || "N/A"} from={from} />
          </div>
          <div className="border-b pb-6 flex flex-col gap-5">
            <SectionTitle
              text="Contact Details"
              className="uppercase text-[#9E9E9E]"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {email && (
                <div className="flex flex-col gap-1.5 md:gap-2.5">
                  <SectionTitle text="Email address" />
                  <SectionDescription text={email} from={from} />
                </div>
              )}

              {phone && (
                <div className="flex flex-col gap-1.5 md:gap-2.5">
                  <SectionTitle text="Phone Number" />

                  <SectionDescription text={phone} from={from} />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <SectionTitle text="Address" className="uppercase text-[#9E9E9E]" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5 md:gap-2.5">
                <SectionTitle text="Street Address" />
                <SectionDescription text={address?.street} from={from} />
              </div>
              <div className="flex flex-col gap-1.5 md:gap-2.5">
                <SectionTitle text="City" />
                <SectionDescription text={address?.city} from={from} />
              </div>
              <div className="flex flex-col gap-1.5 md:gap-2.5">
                <SectionTitle text="State/Province" />
                <SectionDescription text={address?.state} from={from} />
              </div>
              <div className="flex flex-col gap-1.5 md:gap-2.5">
                <SectionTitle text="Postal/Zip Code" />

                <SectionDescription text={address?.zipCode} from={from} />
              </div>
              <div className="flex flex-col gap-1.5 md:gap-2.5">
                <SectionTitle text="Country" />
                <SectionDescription text={address?.country} from={from} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <NoData />
      )}
    </div>
  );
};

export default PartnerPersonalInformation;

const SectionTitle = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  return (
    <h3
      className={cn(
        "text-sm md:text-base font-medium text-[#6C6C6C]",
        className
      )}
    >
      {text}
    </h3>
  );
};
