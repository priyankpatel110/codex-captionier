import { NextResponse } from "next/server"

import { extractAudioFromVideo } from "@/lib/audio"

export const runtime = "nodejs"
export const maxDuration = 120

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("video")

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing video file in form-data field `video`." },
        { status: 400 }
      )
    }

    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "Only video uploads are accepted by this route." },
        { status: 400 }
      )
    }

    const audioBuffer = await extractAudioFromVideo(
      Buffer.from(await file.arrayBuffer()),
      file.type
    )

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        "content-type": "audio/wav",
        "content-disposition": `inline; filename="${file.name.replace(/\.[^.]+$/, "") || "audio"}.wav"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected audio extraction error.",
      },
      { status: 500 }
    )
  }
}
