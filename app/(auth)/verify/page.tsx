import { Suspense } from "react"
import VerifyPageClient from "./VerifyPageClient"

function VerifyPageFallback() {
  return (
    <div className="text-center text-sm text-gray-500">Loading verification form...</div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyPageFallback />}>
      <VerifyPageClient />
    </Suspense>
  )
}
