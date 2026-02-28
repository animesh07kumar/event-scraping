import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import User from "@/models/User"

export async function POST(req: Request) {
  const { email, otp } = await req.json()

  await connectToDatabase()

  const user = await User.findOne({ email })

  if (!user || user.otp !== otp) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
  }

  user.emailIsVerified = true
  user.otp = undefined
  await user.save()

  return NextResponse.json({ message: "Email verified successfully" })
}