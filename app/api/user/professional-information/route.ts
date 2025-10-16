import api from "@/lib/axiosInterceptor";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const referer = req.headers.get("referer");
    let env = "prod";
    if (referer) {
      const parsedUrl = new URL(referer);
      env = parsedUrl.searchParams.get("env") || "prod";
    }

    const bodyData = await req.formData();
    const entries = Object.fromEntries(bodyData.entries());

    const { data, id, ...certificationFiles } = entries;
    
    const filesArray: any = Object.values(certificationFiles);
    // console.log('🚀 ~ POST ~ filesArray:', filesArray)

    const formData = new FormData();

    for (const file of filesArray) {
      formData.append(`certifications`, file as File, file.name);
    }

    formData.append("data", data);

    const queryId = id ? `?id=${id}` : "";

    // console.log("🚀 ~ POST ~ queryId data:", data, queryId);

    const apiUrl =
      env === "qa"
        ? `${process.env.NEXT_PUBLIC_QA_API_URL}/user/professional-information${queryId}`
        : `/user/professional-information${queryId}`;

    const response = await api.patch(apiUrl, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    // console.log(
    //   "🚀 ~ POST ~ response professional-information:",
    //   response.data
    // );

    if (response.status === 200) {
      const res = NextResponse.json({
        status: 200,
        message: "Personal information updated successfully",
        data: response.data,
      });
      return res;
    }
  } catch (error: any) {
    console.error("Professional information update failed:", error.response.data);
    return NextResponse.json({
      status: 500,
      message: error.response.data.message,
    });
  }
}
