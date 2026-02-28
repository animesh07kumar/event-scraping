import { redirect } from "next/navigation"
import { auth } from "@/auth"
import DashboardClient from "@/components/dashboard/DashboardClient"

type DashboardPageProps = {
  searchParams: Promise<{
    city?: string | string[]
    from?: string | string[]
    to?: string | string[]
  }>
}

const resolveCity = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0]?.trim() || "Sydney"
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim()
  }

  return "Sydney"
}

const resolveDate = (value: string | string[] | undefined) => {
  const parsed = Array.isArray(value) ? value[0] : value
  if (!parsed) return ""
  return /^\d{4}-\d{2}-\d{2}$/.test(parsed.trim()) ? parsed.trim() : ""
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth()

  if (!session) {
    redirect("/signin")
  }

  const params = await searchParams
  const initialCity = resolveCity(params.city)
  const initialFrom = resolveDate(params.from)
  const initialTo = resolveDate(params.to)

  return (
    <DashboardClient
      defaultCity={initialCity}
      defaultDateFrom={initialFrom}
      defaultDateTo={initialTo}
    />
  )
}
