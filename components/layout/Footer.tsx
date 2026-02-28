import Link from "next/link"
import { Github, Linkedin, Code2 } from "lucide-react"

const links = [
  {
    href: "https://github.com/animesh07kumar",
    label: "GitHub",
    icon: Github,
  },
  {
    href: "https://leetcode.com/en_animesh",
    label: "LeetCode",
    icon: Code2,
  },
  {
    href: "https://linkedin.com/in/animesh-kumar-ct",
    label: "LinkedIn",
    icon: Linkedin,
  },
]

export default function Footer() {
  return (
    <footer className="mt-12 border-t bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">Made with ❤️ by Animesh</p>

        <div className="flex flex-wrap gap-2">
          {links.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-black bg-black px-3 py-2 text-sm text-white hover:bg-white hover:text-black transition"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </footer>
  )
}
