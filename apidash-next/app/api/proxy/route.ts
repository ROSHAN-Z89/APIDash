import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const {
      url,
      method = "GET",
      headers = {},
      body,
    } = await request.json();

    // Basic validation
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    let targetUrl: URL;

    try {
      targetUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL" },
        { status: 400 }
      );
    }

    if (!["http:", "https:"].includes(targetUrl.protocol)) {
      return NextResponse.json(
        { error: "Only HTTP and HTTPS URLs are allowed" },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    const response = await fetch(targetUrl.toString(), {
      method,
      headers,
      body:
        ["GET", "HEAD"].includes(method)
          ? undefined
          : body || undefined,
    });

    const elapsed = Date.now() - startTime;
    const responseText = await response.text();

    // Convert response headers to a plain object
    const responseHeaders: Record<string, string> = {};

    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseText,
      time: elapsed,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Request failed";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}