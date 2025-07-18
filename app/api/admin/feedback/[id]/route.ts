import api from "@/lib/axiosInterceptor";

import { NextResponse } from "next/server";

export async function PATCH(
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
    const { id } = params;

    const apiUrl =
      env === "qa"
        ? `${process.env.NEXT_PUBLIC_QA_API_URL}/feedback/${id}`
        : `/feedback/${id}`;

    const response = await api.patch(apiUrl, data);

    if (response.status === 200) {
      const res = NextResponse.json({
        status: 200,
        message: "Feedback updated successfully!",
        data: response.data.data,
      });
      return res;
    }
  } catch (error: any) {
    console.error("Feedback update failed:", error.response?.status);
    return NextResponse.json({
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Failed to update feedback",
    });
  }
}

export async function DELETE(
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

    const { id } = params;

    const apiUrl =
      env === "qa"
        ? `${process.env.NEXT_PUBLIC_QA_API_URL}/feedback/${id}`
        : `/feedback/${id}`;

    const response = await api.delete(apiUrl);

    if (response.status === 200) {
      const res = NextResponse.json({
        status: 200,
        message: "Feedback deleted successfully!",
      });
      return res;
    }
  } catch (error: any) {
    console.error("Feedback deletion failed:", error.response?.status);
    return NextResponse.json({
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Failed to delete feedback",
    });
  }
} 