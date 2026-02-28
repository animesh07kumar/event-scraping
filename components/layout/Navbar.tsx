import Link from "next/link"
import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import { signOut } from "@/auth"

export default async function Navbar() {
  const session = await auth()

  const userName = session?.user?.name || ""
  const firstLetter = userName ? userName.charAt(0).toUpperCase() : ""

  return (
    <nav className="w-full border-b bg-white">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold">
          Events 
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {!session ? (
            <>
              <Link href="/signin">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>

              <form
                action={async () => {
                  "use server"
                  await signOut()
                }}
              >
                <button
                  type="submit"
                  className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-semibold"
                >
                  {firstLetter}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}