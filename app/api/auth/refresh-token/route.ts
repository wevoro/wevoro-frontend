import { logout } from "@/app/actions";
import api from "@/lib/axiosInterceptor";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Read refresh token from httpOnly cookie (secure) instead of request body
    const refreshToken = cookies().get("refreshToken")?.value;

    if (!refreshToken) {
      await logout();
      return NextResponse.json(
        { status: 401, message: "No refresh token found" },
        { status: 401 }
      );
    }

    const response = await api.post(`/auth/refresh-token`, {
      refreshToken,
    });

    const { accessToken } = response.data?.data;
    const res = NextResponse.json({ message: "Token refreshed", status: 200 });

    // Only refresh the ACCESS token, NOT the refresh token
    // This implements "absolute session timeout" - refresh token keeps its original expiry
    res.cookies.delete("accessToken");

    res.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour (for testing) - change to 60 * 60 for production
      path: "/",
    });

    return res;
  } catch (error) {
    console.log("error from refresh token", error);

    await logout();
    return NextResponse.json(
      { status: 401, message: "Token refresh failed" },
      { status: 401 }
    );
  }
}


