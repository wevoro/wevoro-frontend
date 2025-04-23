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

    const { data, image, id } = entries;

    const formData = new FormData();

    if (image) formData.append("image", image as File);
    if (data) formData.append("data", data);

    const queryId = id ? `?id=${id}` : "";

    const apiUrl =
      env === "qa"
        ? `${process.env.NEXT_PUBLIC_QA_API_URL}/user/personal-information${queryId}`
        : `/user/personal-information${queryId}`;

    const response = await api.patch(apiUrl, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    console.log("🚀 ~ POST ~ response:", response.data);

    if (response.status === 200) {
      const res = NextResponse.json({
        status: 200,
        message: "Personal information updated successfully",
      });
      return res;
    }
  } catch (error: any) {
    console.error("Personal information update failed:", error.response);
    return NextResponse.json({
      status: 500,
      message: error.response.data.message,
    });
  }
}
