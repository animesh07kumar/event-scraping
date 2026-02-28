import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectToDatabase } from "@/lib/db"
import { runScrapePipeline } from "@/services/scraper/pipeline"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await connectToDatabase()
  let sourceNames: string[] | undefined
  let city: string | undefined

  try {
    const body = (await request.json()) as { sources?: unknown; city?: unknown }
    if (Array.isArray(body.sources)) {
      sourceNames = body.sources.filter((value): value is string => typeof value === "string")
    }
    if (typeof body.city === "string" && body.city.trim()) {
      city = body.city.trim()
    }
  } catch {
    sourceNames = undefined
    city = undefined
  }

  const result = await runScrapePipeline(sourceNames, city)

  return NextResponse.json(result)
}
