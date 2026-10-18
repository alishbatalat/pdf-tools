import { NextResponse } from "next/server";
import { convertFileViaCloudConvert } from "@/lib/cloudconvert";

export const maxDuration = 120;

function extensionOf(filename: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(filename);
  return match ? match[1].toLowerCase() : "";
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const outputFormat = formData.get("outputFormat");

    if (!(file instanceof File) || typeof outputFormat !== "string" || !outputFormat) {
      return NextResponse.json({ error: "Missing file or outputFormat." }, { status: 400 });
    }

    const inputFormat = extensionOf(file.name);
    if (!inputFormat) {
      return NextResponse.json({ error: "Couldn't determine the file's format." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await convertFileViaCloudConvert(bytes, file.name, inputFormat, outputFormat);

    return new NextResponse(new Uint8Array(result.bytes), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Conversion failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
