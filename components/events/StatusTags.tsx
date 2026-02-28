import { Badge } from "@/components/ui/badge"

const STATUS_VARIANTS = {
  new: "secondary",
  updated: "default",
  inactive: "destructive",
  imported: "outline",
} as const

type EventStatus = keyof typeof STATUS_VARIANTS

type StatusTagsProps = {
  tags: string[]
}

export default function StatusTags({ tags }: StatusTagsProps) {
  const normalized = tags.filter((tag): tag is EventStatus => tag in STATUS_VARIANTS)

  if (normalized.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {normalized.map((status) => (
        <Badge key={status} variant={STATUS_VARIANTS[status]}>
          {status}
        </Badge>
      ))}
    </div>
  )
}
