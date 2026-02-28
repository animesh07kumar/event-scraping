import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/db"
import User from "@/models/User"
import { sendMail } from "@/services/email/email"

export async function POST(req: Request) {
  const { name, email, password } = await req.json()

  await connectToDatabase()

  const normalizedEmail = email.toLowerCase()
  const existingUser = await User.findOne({ email: normalizedEmail })
  if (existingUser) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    otp,
  })

  await sendMail(
    normalizedEmail,
    "Your EventScraping OTP",
    `Your OTP is ${otp}. It expires when used.`
  )

  return NextResponse.json({ message: "User created. Verify OTP." })
}
