"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type GetTicketsDialogProps = {
  eventId: string
  eventTitle: string
}

export default function GetTicketsDialog({ eventId, eventTitle }: GetTicketsDialogProps) {
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!consent) {
      setError("Please accept email consent to continue.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/events/${eventId}/ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? "Unable to process your request.")
        return
      }

      if (typeof data.redirectUrl === "string") {
        window.location.assign(data.redirectUrl)
      }
    } catch {
      setError("Unexpected server error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">GET TICKETS</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{eventTitle}</DialogTitle>
          <DialogDescription>
            Enter your email and consent so we can notify you about matching events.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>I agree to receive event-related emails.</span>
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Redirecting..." : "Continue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
