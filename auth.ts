import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/db"
import User, { AuthProvider } from "@/models/User"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) {
          return null
        }

        await connectToDatabase()

        const user = await User.findOne({ email: email.toLowerCase() })
        if (!user || !user.password || !user.emailIsVerified) {
          return null
        }

        const isValidPassword = await bcrypt.compare(password, user.password)
        if (!isValidPassword) {
          return null
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        }
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) {
        return true
      }

      await connectToDatabase()

      const existingUser = await User.findOne({ email: user.email.toLowerCase() })

      if (!existingUser) {
        await User.create({
          name: user.name ?? "Google User",
          email: user.email.toLowerCase(),
          provider: AuthProvider.GOOGLE,
          emailIsVerified: true,
        })
        return true
      }

      existingUser.name = user.name ?? existingUser.name
      existingUser.email = user.email.toLowerCase()
      existingUser.provider = AuthProvider.GOOGLE
      existingUser.emailIsVerified = true
      await existingUser.save()

      return true
    },
  },
  secret: process.env.AUTH_SECRET,
})
