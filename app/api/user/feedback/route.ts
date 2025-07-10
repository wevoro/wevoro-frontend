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
    const data = await req.json();
    console.log('🚀 ~ POST ~ data:', data)

    const apiUrl =
      env === "qa"
        ? `${process.env.NEXT_PUBLIC_QA_API_URL}/feedback`
        : `/feedback`;

    const response = await api.post(apiUrl, data);
    console.log('🚀 ~ POST ~ response:', response)

    if (response.status === 200) {
      const res = NextResponse.json({
        status: 200,
        message: "Feedback sent successfully!",
      });
      return res;
    } else {
      // Fallback response for non-200 status codes
      return NextResponse.json({
        status: response.status || 500,
        message: "Feedback submission failed",
      });
    }
  } catch (error: any) {
    console.error("Feedback send failed:", error);
    return NextResponse.json({
      status: error.response.status || 500,
      message: error.response.data.message,
    });
  }
}
