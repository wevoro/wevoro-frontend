import api from "@/lib/axiosInterceptor";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  try {
    const referer = req.headers.get("referer");
    let env = "prod";
    if (referer) {
      const parsedUrl = new URL(referer);
      env = parsedUrl.searchParams.get("env") || "prod";
    }
    const id = await req.json();

    const apiUrl =
      env === "qa"
        ? `${process.env.NEXT_PUBLIC_QA_API_URL}/user/notification/${id}`
        : `/user/notification/${id}`;

    const response = await api.delete(apiUrl);

    if (response.status === 200) {
      const res = NextResponse.json({
        status: 200,
        message: "Notification deleted successfully!",
      });
      return res;
    }
  } catch (error: any) {
    console.error("Notification delete failed:", error.response.status);
    return NextResponse.json({
      status: error.response.status || 500,
      message: error.response.data.message,
    });
  }
}
