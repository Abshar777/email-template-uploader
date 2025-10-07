// Utilities for templates, placeholder parsing, and localStorage persistence

export type EmailTemplate = {
  id: string
  name: string
  html: string
  createdAt: number
}

type StoreShape = {
  templates: EmailTemplate[]
  selectedId?: string | null
}

const STORE_KEY = "emailTemplates"
const VALUES_PREFIX = "emailTemplateValues:"

export const TemplatesStore = {
  load(): StoreShape {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (!raw) return { templates: [] }
      return JSON.parse(raw) as StoreShape
    } catch {
      return { templates: [] }
    }
  },
  save(data: StoreShape) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data))
    } catch {
      // ignore
    }
  },
  loadValues(templateId: string): Record<string, string> | null {
    try {
      const raw = localStorage.getItem(VALUES_PREFIX + templateId)
      if (!raw) return null
      return JSON.parse(raw) as Record<string, string>
    } catch {
      return null
    }
  },
  saveValues(templateId: string, values: Record<string, string>) {
    try {
      localStorage.setItem(VALUES_PREFIX + templateId, JSON.stringify(values))
    } catch {
      // ignore
    }
  },
  deleteValues(templateId: string) {
    try {
      localStorage.removeItem(VALUES_PREFIX + templateId)
    } catch {
      // ignore
    }
  },
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
