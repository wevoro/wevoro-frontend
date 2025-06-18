// @ts-nocheck
"use client";
import Upload from "@/components/global/personal-info/upload";
import Title from "@/components/global/title";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import OnboardButton from "@/components/global/onboard-button";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import LoadingOverlay from "@/components/global/loading-overlay";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useAppContext } from "@/lib/context";
import Editor from "../ui/editor";
import { cn } from "@/lib/utils";
import { PhoneInput } from "@/components/ui/phone-input";

const OnboardPersonalInfo = forwardRef((props: any) => {
  const { source, from, userFromAdmin, onClose } = props;
  const searchParams = useSearchParams();
  const isEdit = searchParams.get("edit") === "true";

  const {
    refetchUser,
    user,
    querySuffix,
    id,
    personalInfoRef,
    refetchUsers,
    refetchQaUsers,
  } = useAppContext();

  const userData =
    from && userFromAdmin?.personalInfo
      ? userFromAdmin?.personalInfo
      : !from && user?.personalInfo
        ? user?.personalInfo
        : {};

  const {
    image,
    bio,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    address,
    phone,
    companyName,
    industry,
    dateEstablished,
  } = userData;

  const proDefaultValues = {
    image: image || "",
    bio: bio || "",
    firstName: firstName || "",
    lastName: lastName || "",
    dateOfBirth: source === "pro" ? dateOfBirth?.split("T")[0] : "",
    gender: gender || (from === "admin" ? "Male" : ""),
    phone: phone || "",
    address: {
      street: address?.street || "",
      city: address?.city || "",
      state: address?.state || "",
      zipCode: address?.zipCode || "",
      country: address?.country || "",
    },
  };

  const partnerDefaultValues = {
    image: image || "",
    firstName: firstName || "",
    lastName: lastName || "",
    companyName: companyName || "",
    industry: industry || "",
    bio: bio || "",
    dateEstablished: source === "partner" ? dateEstablished?.split("T")[0] : "",
    phone: phone || "",
    address: {
      street: address?.street || "",
      city: address?.city || "",
      state: address?.state || "",
      zipCode: address?.zipCode || "",
      country: address?.country || "",
    },
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues:
      source === "partner" ? partnerDefaultValues : proDefaultValues,
  });

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: any) => {
    try {
      const path =
        source === "pro"
          ? "/pro/onboard/professional-info"
          : querySuffix
            ? `/partner/pros/${id}?s=true`
            : "/partner/profile";
      if (!isDirty && !isEdit && !from) {
        return router.push(path);
      }
      setIsLoading(true);

      source === "pro" &&
        data.dateOfBirth &&
        (data.dateOfBirth = new Date(data.dateOfBirth).toISOString());

      const formData = new FormData();

      const { image, ...rest } = data;

      typeof data.image === "object" && formData.append("image", data.image[0]);

      formData.append("data", JSON.stringify(rest));

      if (from === "admin") {
        formData.append("id", userFromAdmin?._id);
      }

      const response = await fetch("/api/user/personal-information", {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();
      if (responseData.status === 200) {
        refetchUser();
        if (from === "admin") {
          refetchUsers();
          refetchQaUsers();
          // onClose && onClose();
        }
        reset();

        if (!from) {
          toast.success(
            isEdit
              ? "Personal information updated successfully!"
              : "Personal information submitted successfully!"
          );
          if (isEdit) {
            router.back();
          } else {
            router.push(path);
          }
        }
      } else {
        toast.error(responseData.message || "Something went wrong!");
      }
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      console.log("inside catch", error);
      toast.error(error.message || "Something went wrong!");
    }
  };

  useImperativeHandle(personalInfoRef, () => ({
    submitForm: () => handleSubmit(onSubmit)(),
  }));
  const renderError = (message: string) => {
    return <p className="text-red-500 text-sm">{message}</p>;
  };

  const imageFile = watch("image")?.[0];
  return (
    <form onSubmit={handleSubmit(onSubmit)} ref={personalInfoRef}>
      {isLoading && <LoadingOverlay />}
      <Title text="Personal Information" />

      <div className="flex flex-col gap-8">
        <div className="text-center flex flex-col gap-3">
          <Upload register={register} image={image} imageFile={imageFile} />
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-medium leading-[25.2px] text-gray-800">
            About/Bio
          </h2>
          <Controller
            name="bio"
            control={control}
            render={({ field }) => (
              <Editor
                value={field.value}
                onChange={(content) =>
                  setValue("bio", content, { shouldDirty: true })
                }
                placeholder="Write about yourself..."
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-3">
            <label className="text-base font-medium leading-[22.4px] text-[#1C1C1C]">
              First name{" "}
              {from !== "admin" && <span className="text-red-500">*</span>}
            </label>
            <Input
              {...register("firstName", {
                required: from !== "admin" && "First name is required",
              })}
              className="rounded-[12px] h-14 bg-[#f9f9f9]"
              placeholder="Please enter your first name"
              name="firstName"
              isError={!!errors.firstName}
            />
            {errors.firstName &&
              renderError(errors.firstName.message as string)}
          </div>
          <div className="flex flex-col gap-3">
            <label className="text-base font-medium leading-[22.4px] text-[#1C1C1C]">
              Last name{" "}
              {from !== "admin" && <span className="text-red-500">*</span>}
            </label>
            <Input
              {...register("lastName", {
                required: from !== "admin" && "Last name is required",
              })}
              className="rounded-[12px] h-14 bg-[#f9f9f9]"
              placeholder="Please enter your last name"
              name="lastName"
              isError={!!errors.lastName}
            />
            {errors.lastName && renderError(errors.lastName.message as string)}
          </div>
          {source === "pro" && (
            <>
              <div className="flex flex-col gap-3">
                <label className="text-base font-medium leading-[22.4px] text-[#1C1C1C]">
                  Date of Birth{" "}
                  {from !== "admin" && <span className="text-red-500">*</span>}
                </label>
                <Input
                  {...register("dateOfBirth", {
                    required: from !== "admin" && "Date of birth is required",
                  })}
                  className="rounded-[12px] h-14 bg-[#f9f9f9] uppercase"
                  type="date"
                  placeholder="DD/MM/YYYY"
                  name="dateOfBirth"
                  isError={!!errors.dateOfBirth}
                  max={new Date().toISOString().split("T")[0]}
                />
                {errors.dateOfBirth &&
                  renderError(errors.dateOfBirth.message as string)}
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-base font-medium">
                  Gender{" "}
                  {from !== "admin" && <span className="text-red-500">*</span>}
                </label>
                <Controller
                  name="gender"
                  control={control}
                  rules={{
                    required: from !== "admin" && "Gender is required.",
                  }}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="rounded-[12px] h-14 bg-[#f9f9f9]">
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.gender && renderError(errors.gender.message as string)}
              </div>
            </>
          )}

          {source === "partner" && (
            <>
              <div className="flex flex-col gap-3">
                <label className="text-base font-medium leading-[22.4px] text-[#1C1C1C]">
                  Company Name{" "}
                  {from !== "admin" && <span className="text-red-500">*</span>}
                </label>
                <Input
                  {...register("companyName", {
                    required: from !== "admin" && "Company name is required",
                  })}
                  className="rounded-[12px] h-14 bg-[#f9f9f9]"
                  placeholder="Please enter your company name"
                  name="companyName"
                  isError={!!errors.companyName}
                />
                {errors.companyName &&
                  renderError(errors.companyName.message as string)}
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-base font-medium">
                  Company Industry{" "}
                  {from !== "admin" && <span className="text-red-500">*</span>}
                </label>
                <Controller
                  name="industry"
                  control={control}
                  rules={{
                    required: from !== "admin" && "Industry is required.",
                  }}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger
                        className="rounded-[12px] h-14 bg-[#f9f9f9]"
                        isError={!!errors.industry}
                      >
                        <SelectValue placeholder="Industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="Assisted Living">
                            Assisted Living
                          </SelectItem>
                          <SelectItem value="Home Care">Home Care</SelectItem>
                          <SelectItem value="Home Health">
                            Home Health
                          </SelectItem>
                          <SelectItem value="Hospitals">Hospitals</SelectItem>
                          <SelectItem value="Nursing Home">
                            Nursing Home
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.industry &&
                  renderError(errors.industry.message as string)}
              </div>
            </>
          )}

          <div
            className={cn(
              "flex flex-col gap-3",
              source === "pro" && "col-span-2"
            )}
          >
            <label className="text-base font-medium leading-[22.4px] text-[#1C1C1C]">
              Phone Number{" "}
              {from !== "admin" && <span className="text-red-500">*</span>}
            </label>
            <Controller
              name="phone"
              control={control}
              rules={{
                required: from !== "admin" && "Phone number is required",
              }}
              render={({ field }) => (
                <PhoneInput
                  {...field}
                  // className="rounded-[12px] h-14 bg-[#f9f9f9]"
                  placeholder="Enter your phone number"
                  isError={!!errors.phone}
                />
              )}
            />
            {errors.phone && renderError(errors.phone.message as string)}
          </div>

          {source === "partner" && (
            <div className="flex flex-col gap-3">
              <label className="text-base font-medium leading-[22.4px] text-[#1C1C1C]">
                Date of Establishment{" "}
                {from !== "admin" && <span className="text-red-500">*</span>}
              </label>
              <Input
                {...register("dateEstablished", {
                  required:
                    from !== "admin" && "Date of establishment is required",
                })}
                className="rounded-[12px] h-14 bg-[#f9f9f9] uppercase"
                type="date"
                placeholder="DD/MM/YYYY"
                name="dateEstablished"
                isError={!!errors.dateEstablished}
                max={new Date().toISOString().split("T")[0]}
              />
              {errors.dateEstablished &&
                renderError(errors.dateEstablished.message as string)}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <h2 className="text-lg font-medium leading-[25.2px] text-gray-800">
            Address
          </h2>
          <div className="flex flex-col gap-3">
            <label className="text-base font-medium leading-[22.4px] text-[#1C1C1C]">
              Street address{" "}
              {from !== "admin" && <span className="text-red-500">*</span>}
            </label>
            <Input
              className="rounded-[12px] h-14 bg-[#f9f9f9]"
              placeholder="Input Text"
              {...register("address.street", {
                required: from !== "admin" && "Street address is required",
              })}
              isError={!!errors.address?.street}
            />
            {errors.address?.street &&
              renderError(errors.address.street.message as string)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-3">
              <label className="text-base font-medium leading-[22.4px] text-[#1C1C1C]">
                City{" "}
                {from !== "admin" && <span className="text-red-500">*</span>}
              </label>
              <Input
                className="rounded-[12px] h-14 bg-[#f9f9f9]"
                placeholder="Input Text"
                {...register("address.city", {
                  required: from !== "admin" && "City is required",
                })}
                isError={!!errors.address?.city}
              />
              {errors.address?.city &&
                renderError(errors.address.city.message as string)}
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-base font-medium leading-[22.4px] text-[#1C1C1C]">
                State/Province{" "}
                {from !== "admin" && <span className="text-red-500">*</span>}
              </label>
              <Input
                className="rounded-[12px] h-14 bg-[#f9f9f9]"
                placeholder="Input Text"
                {...register("address.state", {
                  required: from !== "admin" && "State is required",
                })}
                isError={!!errors.address?.state}
              />
              {errors.address?.state &&
                renderError(errors.address.state.message as string)}
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-base font-medium leading-[22.4px] text-[#1C1C1C]">
                Postal/Zip code{" "}
                {from !== "admin" && <span className="text-red-500">*</span>}
              </label>
              <Input
                className="rounded-[12px] h-14 bg-[#f9f9f9]"
                placeholder="Input Text"
                {...register("address.zipCode", {
                  required: from !== "admin" && "Zip code is required",
                })}
                isError={!!errors.address?.zipCode}
              />
              {errors.address?.zipCode &&
                renderError(errors.address.zipCode.message as string)}
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-base font-medium leading-[22.4px] text-[#1C1C1C]">
                Country{" "}
                {from !== "admin" && <span className="text-red-500">*</span>}
              </label>
              <Input
                className="rounded-[12px] h-14 bg-[#f9f9f9]"
                placeholder="Input Text"
                {...register("address.country", {
                  required: from !== "admin" && "Country is required",
                })}
                isError={!!errors.address?.country}
              />
              {errors.address?.country &&
                renderError(errors.address.country.message as string)}
            </div>
          </div>
        </div>

        {from !== "admin" && (
          <div className="flex gap-5">
            {isEdit && (
              <OnboardButton
                text="Cancel"
                onClick={() => router.back()}
                className="w-full bg-white text-[#1C1C1C] border border-gray-300 hover:text-white"
              />
            )}
            <OnboardButton
              text={isEdit ? "Save & Exit" : "Next"}
              type="submit"
              className="w-full"
              disabled={!isDirty && isEdit}
            />
          </div>
        )}
      </div>
    </form>
  );
});

OnboardPersonalInfo.displayName = "OnboardPersonalInfo";

export default OnboardPersonalInfo;
