import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectToDatabase } from "@/lib/db"
import { runScrapePipeline } from "@/services/scraper/pipeline"

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await connectToDatabase()
  let sourceNames: string[] | undefined

  try {
    const body = (await request.json()) as { sources?: unknown }
    if (Array.isArray(body.sources)) {
      sourceNames = body.sources.filter((value): value is string => typeof value === "string")
    }
  } catch {
    sourceNames = undefined
  }

  const result = await runScrapePipeline(sourceNames)

  return NextResponse.json(result)
}
