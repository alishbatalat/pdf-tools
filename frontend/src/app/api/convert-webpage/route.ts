import { NextResponse } from "next/server";
import { convertUrlToPdfViaCloudConvert } from "@/lib/cloudconvert";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "Enter a valid http(s) URL." }, { status: 400 });
    }

    const result = await convertUrlToPdfViaCloudConvert(url);

    return new NextResponse(new Uint8Array(result.bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Conversion failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
