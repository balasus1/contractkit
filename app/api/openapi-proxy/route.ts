import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url");

  if (!target) {
    return new NextResponse("Missing url query parameter.", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new NextResponse("Invalid URL.", { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return new NextResponse("Only http/https URLs are allowed.", { status: 400 });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json, application/yaml, text/yaml, text/plain, */*"
      },
      cache: "no-store"
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream error: ${upstream.status}`, { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") || "text/plain";
    const body = await upstream.text();
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType
      }
    });
  } catch (error) {
    return new NextResponse(
      `Failed to fetch upstream URL: ${error instanceof Error ? error.message : "unknown error"}`,
      { status: 502 }
    );
  }
}
