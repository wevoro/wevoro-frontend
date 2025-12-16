import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// Sanity webhook secret - add this to your .env.local file
const SANITY_WEBHOOK_SECRET = process.env.SANITY_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    // Verify the webhook secret (optional but recommended)
    const secret = req.headers.get("x-sanity-webhook-secret");
    console.log('🚀 ~ POST ~ secret:', secret,SANITY_WEBHOOK_SECRET)
    
    if (SANITY_WEBHOOK_SECRET && secret !== SANITY_WEBHOOK_SECRET) {
      return NextResponse.json(
        { message: "Invalid webhook secret" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { _type } = body;

    console.log(`🔄 Sanity webhook: Revalidating content for type: ${_type}`);

    // Revalidate the specific content type tag
    if (_type) {
      revalidateTag(`sanity-${_type}`);
    }

    // Also revalidate the general 'sanity' tag to catch all
    revalidateTag("sanity");

    return NextResponse.json({
      message: "Revalidation triggered",
      type: _type,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Sanity webhook error:", error);
    return NextResponse.json(
      { message: "Error processing webhook", error: error.message },
      { status: 500 }
    );
  }
}

// Also allow GET for testing the endpoint
export async function GET() {
  return NextResponse.json({
    message: "Sanity revalidation webhook endpoint",
    usage: "POST to this endpoint with Sanity document data to trigger revalidation",
  });
}
