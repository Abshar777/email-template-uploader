"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { extractPlaceholders, renderTemplate, type EmailTemplate, TemplatesStore } from "@/lib/templates"

type ValueMap = Record<string, string>

export function EmailTemplateApp() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = useMemo(() => templates.find((t) => t.id === selectedId) || null, [templates, selectedId])
  const [values, setValues] = useState<ValueMap>({})

  // Load templates and last selection
  useEffect(() => {
    const store = TemplatesStore.load()
    if (store.templates.length === 0) {
      // seed with example
      const example: EmailTemplate = {
        id: crypto.randomUUID(),
        name: "Welcome Template",
        createdAt: Date.now(),
        html: `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>{{title}}</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0a0a0a;color:#e5e7eb;margin:0;padding:24px}
      .card{background:#111827;border:1px solid #1f2937;border-radius:12px;max-width:640px;margin:0 auto;padding:24px}
      .btn{display:inline-block;background:#2563eb;color:white;padding:10px 16px;border-radius:8px;text-decoration:none}
      a{color:#60a5fa}
    </style>
  </head>
  <body>
    <div class="card">
      <h1 style="margin-top:0;margin-bottom:8px">{{title}}</h1>
      <p style="margin-top:0;color:#9ca3af">{{subtitle}}</p>
      <div style="margin:16px 0">{{body}}</div>
      <a href="{{cta_url}}" class="btn">{{cta_label}}</a>
      <p style="color:#6b7280;margin-top:24px;font-size:12px">If you have questions, reply to this email.</p>
    </div>
  </body>
</html>`,
      }
      TemplatesStore.save({ templates: [example], selectedId: example.id })
      setTemplates([example])
      setSelectedId(example.id)
      setValues(
        TemplatesStore.loadValues(example.id) || {
          title: "Welcome to Our Product",
          subtitle: "We’re glad you’re here.",
          body: "<p>Hi there,<br/>Thanks for signing up! Here are a few tips to get started…</p>",
          cta_label: "Get Started",
          cta_url: "https://example.com/start",
        },
      )
    } else {
      setTemplates(store.templates)
      setSelectedId(store.selectedId || null)
      if (store.selectedId) {
        setValues(TemplatesStore.loadValues(store.selectedId) || {})
      }
    }
  }, [])

  // Persist selection and values
  useEffect(() => {
    TemplatesStore.save({ templates, selectedId })
  }, [templates, selectedId])

  useEffect(() => {
    if (selectedId) {
      TemplatesStore.saveValues(selectedId, values)
    }
  }, [selectedId, values])

  const handleAdd = useCallback((tpl: EmailTemplate) => {
    setTemplates((prev) => [tpl, ...prev])
    setSelectedId(tpl.id)
    // initialize values for new template
    const keys = Array.from(extractPlaceholders(tpl.html))
    const init: ValueMap = {}
    keys.forEach((k) => (init[k] = ""))
    setValues(init)
  }, [])

  const handleDelete = useCallback(
    (id: string) => {
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      if (selectedId === id) {
        setSelectedId(templates.find((t) => t.id !== id)?.id || null)
      }
      TemplatesStore.deleteValues(id)
    },
    [selectedId, templates],
  )

  const placeholders = useMemo(() => (selected ? Array.from(extractPlaceholders(selected.html)) : []), [selected])

  const finalHtml = useMemo(() => {
    if (!selected) return ""
    return renderTemplate(selected.html, values)
  }, [selected, values])

  const downloadHtml = () => {
    if (!selected) return
    const blob = new Blob([finalHtml], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selected.name.replace(/\s+/g, "-").toLowerCase()}-rendered.html`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const downloadTemplate = () => {
    if (!selected) return
    const blob = new Blob([selected.html], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selected.name.replace(/\s+/g, "-").toLowerCase()}.html`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-12">
      {/* Left column: create/upload + list */}
      <div className="lg:col-span-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Template</CardTitle>
            <CardDescription>Paste HTML or upload a .html file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddByPaste onAdd={handleAdd} />
            <Separator />
            <AddByUpload onAdd={handleAdd} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Templates</CardTitle>
            <CardDescription>Click to select, manage items</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[360px]">
              <ul className="divide-y divide-border">
                {templates.length === 0 && <li className="p-4 text-sm text-muted-foreground">No templates yet.</li>}
                {templates.map((t) => (
                  <li key={t.id} className={cn("p-3 hover:bg-secondary/40", selectedId === t.id && "bg-secondary/60")}>
                    <button
                      className="w-full text-left"
                      onClick={() => {
                        setSelectedId(t.id)
                        setValues(TemplatesStore.loadValues(t.id) || {})
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{t.name}</div>
                          <div className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`Delete "${t.name}"?`)) handleDelete(t.id)
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right column: editor + preview */}
      <div className="lg:col-span-8 space-y-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">{selected ? selected.name : "No template selected"}</CardTitle>
              <CardDescription>Fill placeholders without touching the HTML</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={downloadTemplate} disabled={!selected}>
                Download Template
              </Button>
              <Button onClick={downloadHtml} disabled={!selected}>
                Download HTML
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <div className="text-sm text-muted-foreground">Select or add a template to begin.</div>
            ) : (
              <Tabs defaultValue="content" className="w-full">
                <TabsList>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="content" className="mt-4">
                  {placeholders.length === 0 ? (
                    <div className="rounded-md border p-4 text-sm text-muted-foreground">
                      No placeholders found. Use curly braces like {"{{title}}"} in your template HTML to enable content
                      fields.
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {placeholders.map((key) => (
                        <div key={key} className="grid gap-2">
                          <Label htmlFor={`field-${key}`} className="font-medium">
                            {key}
                          </Label>
                          {/* For typical body-like fields, use Textarea; single-line Input otherwise */}
                          {key.toLowerCase().match(/(body|content|message|desc|description)/) ? (
                            <RichTextField
                              id={`field-${key}`}
                              value={values[key] || ""}
                              onChange={(html) => setValues((v) => ({ ...v, [key]: html }))}
                            />
                          ) : (
                            <Input
                              id={`field-${key}`}
                              value={values[key] || ""}
                              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                              placeholder={`Enter ${key}`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="preview" className="mt-4">
                  <div className="rounded-md border">
                    <iframe
                      title="Email Preview"
                      className="h-[600px] w-full rounded-md"
                      // sandboxed preview for safety; allow minimal features
                      sandbox="allow-same-origin"
                      srcDoc={
                        finalHtml ||
                        "<!doctype html><html><body style='background:#0a0a0a;color:#e5e7eb;font-family:sans-serif;padding:16px'>No content</body></html>"
                      }
                    />
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AddByPaste({ onAdd }: { onAdd: (tpl: EmailTemplate) => void }) {
  const [name, setName] = useState("")
  const [html, setHtml] = useState("")

  const handleAdd = () => {
    if (!name.trim() || !html.trim()) return
    const tpl: EmailTemplate = {
      id: crypto.randomUUID(),
      name: name.trim(),
      html,
      createdAt: Date.now(),
    }
    onAdd(tpl)
    setName("")
    setHtml("")
  }

  return (
    <div className="grid gap-3">
      <Label htmlFor="name">Template name</Label>
      <Input id="name" placeholder="e.g. Order Receipt" value={name} onChange={(e) => setName(e.target.value)} />
      <Label htmlFor="html">Template HTML</Label>
      <Textarea
        id="html"
        placeholder="Paste your HTML here. Use placeholders like {{title}}, {{body}}…"
        className="min-h-40"
        value={html}
        onChange={(e) => setHtml(e.target.value)}
      />
      <div className="flex justify-end">
        <Button onClick={handleAdd} disabled={!name.trim() || !html.trim()}>
          Add Template
        </Button>
      </div>
    </div>
  )
}

function AddByUpload({ onAdd }: { onAdd: (tpl: EmailTemplate) => void }) {
  const [name, setName] = useState("")
  const [fileName, setFileName] = useState<string | null>(null)
  const [html, setHtml] = useState<string | null>(null)

  const onFile = async (file: File) => {
    const text = await file.text()
    setFileName(file.name)
    setHtml(text)
    if (!name) {
      const base = file.name.replace(/\.html?$/i, "")
      setName(base)
    }
  }

  const handleAdd = () => {
    if (!name.trim() || !html) return
    const tpl: EmailTemplate = {
      id: crypto.randomUUID(),
      name: name.trim(),
      html,
      createdAt: Date.now(),
    }
    onAdd(tpl)
    setName("")
    setFileName(null)
    setHtml(null)
  }

  return (
    <div className="grid gap-3">
      <Label htmlFor="upload-name">Template name</Label>
      <Input id="upload-name" placeholder="e.g. Newsletter" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="grid gap-2">
        <Label>Upload .html</Label>
        <input
          type="file"
          accept=".html,text/html"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
          }}
          className="block w-full text-sm file:mr-4 file:rounded-md file:border file:border-input file:bg-secondary file:px-3 file:py-1.5 file:text-foreground"
        />
        {fileName && <div className="text-xs text-muted-foreground">Selected: {fileName}</div>}
      </div>
      <div className="flex justify-end">
        <Button onClick={handleAdd} disabled={!name.trim() || !html}>
          Add Uploaded
        </Button>
      </div>
    </div>
  )
}

function RichTextField({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (html: string) => void
}) {
  // very lightweight rich text using contenteditable
  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      if (el && value !== el.innerHTML) {
        el.innerHTML = value || ""
      }
    },
    [value],
  )

  const exec = (cmd: string) => {
    document.execCommand(cmd, false)
  }

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-1 border-b p-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => exec("bold")}>
          Bold
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => exec("italic")}>
          Italic
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => exec("underline")}>
          Underline
        </Button>
        <Separator orientation="vertical" className="mx-1 h-5" />
        <Button type="button" variant="ghost" size="sm" onClick={() => exec("insertUnorderedList")}>
          • List
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => exec("insertOrderedList")}>
          1. List
        </Button>
      </div>
      <div
        id={id}
        className="min-h-32 max-h-80 overflow-auto p-3 outline-none"
        contentEditable
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        ref={ref}
        aria-label="Rich text editor"
        role="textbox"
      />
    </div>
  )
}
