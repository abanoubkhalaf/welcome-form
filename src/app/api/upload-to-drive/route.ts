import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { formData, fileName, folderDate } = body;

    // Check for formData instead of imageData now
    if (!formData || !fileName) {
      return NextResponse.json({ error: "Missing data (formData or fileName)" }, { status: 400 });
    }

    const appsScriptUrl = process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL;

    // Forward the text data directly to Apps Script
    const response = await fetch(appsScriptUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({ formData, fileName, folderDate }),
    });

    const text = await response.text();
    
    try {
      const result = JSON.parse(text);
      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json({ error: result.error || "Upload failed" }, { status: 500 });
      }
    } catch (e) {
      return NextResponse.json({ 
        error: "Google Apps Script error",
        details: text.substring(0, 200)
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
