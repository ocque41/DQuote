import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

import { authenticateApiRequest } from "@/lib/api-auth";

export async function POST(req: Request) {
  const authResult = await authenticateApiRequest();
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const { url } = await put(`dquote/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ url });
}
