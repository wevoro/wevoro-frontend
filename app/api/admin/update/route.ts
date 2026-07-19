import api from "@/lib/axiosInterceptor";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
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
        ? `${process.env.NEXT_PUBLIC_QA_API_URL}/user/update/${data.id}`
        : `/user/update/${data.id}`;

    const response = await api.patch(apiUrl, data);

    // Any 2xx is a success. This used to check `=== 200` with no else branch, so
    // a 201/204 fell through and returned undefined, which Next surfaces as a
    // generic failure even though the update worked.
    if (response.status >= 200 && response.status < 300) {
      return NextResponse.json({
        status: 200,
        message: "User updated successfully!",
      });
    }

    return NextResponse.json({
      status: response.status,
      message: response.data?.message || "User update failed.",
    });
  } catch (error: any) {
    // `error.response` is undefined for network/timeout errors, so reading
    // `error.response.status` threw inside the catch itself — turning every such
    // failure into an opaque "Something went wrong" with nothing in the logs.
    const status = error?.response?.status ?? 500;
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "User update failed. Please try again.";
    console.error(`User update failed (${status}):`, message);
    return NextResponse.json({ status, message });
  }
}
