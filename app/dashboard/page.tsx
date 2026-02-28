import { redirect } from "next/navigation"
import { auth } from "@/auth"
import DashboardClient from "@/components/dashboard/DashboardClient"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/signin")
  }

  return <DashboardClient defaultCity="Sydney" />
}
