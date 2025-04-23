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

    const { coverImage } = entries;

    const formData = new FormData();

    if (coverImage) formData.append("coverImage", coverImage as File);

    const apiUrl =
      env === "qa"
        ? `${process.env.NEXT_PUBLIC_QA_API_URL}/user/cover-image`
        : `/user/cover-image`;

    const response = await api.patch(apiUrl, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.log("🚀 ~ POST ~ response:", response.data);

    if (response.status === 200) {
      const res = NextResponse.json({
        status: 200,
        message: "Cover image updated successfully",
      });
      return res;
    }
  } catch (error: any) {
    console.error("Cover image update failed:", error.response);
    return NextResponse.json({
      status: 500,
      message: error.response.data.message,
    });
  }
}
