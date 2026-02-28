import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { runScrapePipeline } from "@/services/scraper/pipeline"

export async function POST(request: NextRequest) {
  const headerSecret = request.headers.get("x-cron-secret")
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret || headerSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized cron call" }, { status: 401 })
  }

  await connectToDatabase()
  const result = await runScrapePipeline()

  return NextResponse.json(result)
}
