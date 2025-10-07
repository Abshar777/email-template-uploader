// Utilities for templates and placeholder parsing

export type EmailTemplate = {
  name: string
  html: string
  createdAt?: number
  _id?: string // MongoDB ID
}

export function extractPlaceholders(html: string): Set<string> {
  const set = new Set<string>()
  const re = /{{\s*([a-zA-Z0-9_-]+)\s*}}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    set.add(m[1])
  }
  return set
}

export function renderTemplate(html: string, values: Record<string, string>): string {
  return html.replace(/{{\s*([a-zA-Z0-9_-]+)\s*}}/g, (_m, key: string) => {
    const v = values?.[key]
    return v != null ? String(v) : ""
  })
}