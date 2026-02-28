"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function VerifyPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!email) {
      router.push("/signup")
    }
  }, [email, router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      setLoading(true)

      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Invalid OTP")
        return
      }

      router.push("/signin")
    } catch {
      setError("Server error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Verify Your Email</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
