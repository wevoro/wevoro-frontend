import api from "@/lib/axiosInterceptor";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const referer = req.headers.get("referer");
    let env = "prod";
    if (referer) {
      const parsedUrl = new URL(referer);
      env = parsedUrl.searchParams.get("env") || "prod";
    }

    const data = await req.json();
    

    const apiUrl =
      env === "qa"
        ? `${process.env.NEXT_PUBLIC_QA_API_URL}/feedback/reply`
        : `/feedback/reply`;

    const response = await api.post(apiUrl, data);

    if (response.status === 200) {
      const res = NextResponse.json({
        status: 200,
        message: "Reply sent successfully!",
        data: response.data.data,
      });
      return res;
    }
  } catch (error: any) {
    console.error("Reply send failed:", error.response?.status);
    return NextResponse.json({
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Failed to send reply",
    });
  }
} 