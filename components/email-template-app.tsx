"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MdFolderOff } from "react-icons/md";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { LiaSpinnerSolid } from "react-icons/lia";
import {
  extractPlaceholders,
  renderTemplate,
  type EmailTemplate,
} from "@/lib/templates";
import { toast } from "sonner";

type ValueMap = Record<string, string>;

export function EmailTemplateApp() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const selected = useMemo(
    () => templates.find((t) => t._id === selectedId) || null,
    [templates, selectedId]
  );
  const [values, setValues] = useState<ValueMap>({});

  // Load templates from API
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/emails");
      if (!response.ok) throw new Error("Failed to load templates");
      const data = await response.json();
      setTemplates(data);

      // If no selection and templates exist, select the first one
      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
        // Load saved values from localStorage for this template
        const savedValues = loadValuesFromLocal(data[0].id);
        setValues(savedValues || {});
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    loadTemplates();
  }, []);

  // Save values to localStorage whenever they change
  useEffect(() => {
    if (selectedId) {
      saveValuesToLocal(selectedId, values);
    }
  }, [selectedId, values]);

  const handleAdd = useCallback(
    async (tpl: EmailTemplate) => {
      try {
        setLoading(true);
        const response = await fetch("/api/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tpl),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create template");
        }

        await loadTemplates();

        // Select the newly created template
        setSelectedId(tpl?._id  || "");

        // Initialize values for new template
        const keys = Array.from(extractPlaceholders(tpl.html));
        const init: ValueMap = {};
        keys.forEach((k) => (init[k] = ""));
        setValues(init);

        toast.success("Template created successfully!");
      } catch (error: any) {
        console.error("Error creating template:", error);
        toast.error(error.message || "Failed to create template");
      } finally {
        setLoading(false);
      }
    },
    [loadTemplates]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        const response = await fetch("/api/emails", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error?.error || "faild to delete");
        }

        // Remove from localStorage
        deleteValuesFromLocal(id);

        await loadTemplates();

        if (selectedId === id) {
          setSelectedId(templates.find((t) => t._id !== id)?._id || null);
        }
      } catch (error: any) {
        console.error("Error deleting template:", error);
        toast.error(error.message || "Failed to delete template");
      } finally {
        setLoading(false);
      }
    },
    [selectedId, templates, loadTemplates]
  );

  const placeholders = useMemo(
    () => (selected ? Array.from(extractPlaceholders(selected.html)) : []),
    [selected]
  );

  const finalHtml = useMemo(() => {
    if (!selected) return "";
    return renderTemplate(selected.html, values);
  }, [selected, values]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(label);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  const copyRenderedHtml = () => {
    if (!selected) return;
    copyToClipboard(finalHtml, "rendered");
  };

  const copyTemplate = () => {
    if (!selected) return;
    copyToClipboard(selected.html, "template");
  };

  return (
    <div className="mt-6 grid  gap-6 lg:grid-cols-12">
      {/* Left column: create/upload + list */}
      <div className="lg:col-span-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Template</CardTitle>
            <CardDescription>Paste HTML or upload a .html file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddByPaste onAdd={handleAdd} disabled={loading} />
            <Separator />
            <AddByUpload onAdd={handleAdd} disabled={loading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Templates</CardTitle>
            <CardDescription>Click to select, manage items</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[360px]">
              {loading && templates.length === 0 && (
                <div className="flex w-full h-[300px] justify-center items-center">
                  <LiaSpinnerSolid className="animate-spin text-white text-lg " />
                </div>
              )}
              {!loading && templates.length === 0 && (
                <div className="flex h-[300px] text-white flex-col gap-2 items-center justify-center">
                    <MdFolderOff className="text-white/50 text-2xl"/>
                    <p className="text-white/70 text-md">no tempalates found</p>
                </div>
              )}
              <ul className="divide-y divide-border">
                {templates.map((t) => (
                  <li
                    key={t._id}
                    className={cn(
                      "p-3 hover:bg-secondary/40",
                      selectedId === t._id && "bg-secondary/60"
                    )}
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => {
                        setSelectedId(t._id ||null);
                        const savedValues = loadValuesFromLocal(t?._id || "");
                        setValues(savedValues || {});
                      }}
                      disabled={loading}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{t.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {t.createdAt
                              ? new Date(t.createdAt).toLocaleString()
                              : "N/A"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete "${t.name}"?`))
                                handleDelete((t as any)._id);
                            }}
                            disabled={loading}
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
              <CardTitle className="text-base">
                {selected ? selected.name : "No template selected"}
              </CardTitle>
              <CardDescription>
                Fill placeholders without touching the HTML
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={copyTemplate}
                disabled={!selected || loading}
              >
                {copySuccess === "template" ? "✓ Copied!" : "Copy Template"}
              </Button>
              <Button
                onClick={copyRenderedHtml}
                disabled={!selected || loading}
              >
                {copySuccess === "rendered" ? "✓ Copied!" : "Copy HTML"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <div className="text-sm text-muted-foreground">
                Select or add a template to begin.
              </div>
            ) : (
              <Tabs defaultValue="content" className="w-full">
                <TabsList>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="content" className="mt-4">
                  {placeholders.length === 0 ? (
                    <div className="rounded-md border p-4 text-sm text-muted-foreground">
                      No placeholders found. Use curly braces like {"{{title}}"}{" "}
                      in your template HTML to enable content fields.
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {placeholders.map((key) => (
                        <div key={key} className="grid gap-2">
                          <Label
                            htmlFor={`field-${key}`}
                            className="font-medium"
                          >
                            {key}
                          </Label>
                          {/* For typical body-like fields, use Textarea; single-line Input otherwise */}
                          {key
                            .toLowerCase()
                            .match(
                              /(body|content|message|desc|description)/
                            ) ? (
                            <RichTextField
                              id={`field-${key}`}
                              value={values[key] || ""}
                              onChange={(html) =>
                                setValues((v) => ({ ...v, [key]: html }))
                              }
                            />
                          ) : (
                            <Input
                              id={`field-${key}`}
                              value={values[key] || ""}
                              onChange={(e) =>
                                setValues((v) => ({
                                  ...v,
                                  [key]: e.target.value,
                                }))
                              }
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
  );
}

function AddByPaste({
  onAdd,
  disabled,
}: {
  onAdd: (tpl: Omit<EmailTemplate, "_id" | "createdAt">) => void;
  disabled?: boolean;
}) {
  const [name, setName] = useState("");
  const [html, setHtml] = useState("");

  const handleAdd = () => {
    if (!name.trim() || !html.trim()) return;
    const tpl = {
      id: crypto.randomUUID(),
      name: name.trim(),
      html,
    };
    onAdd(tpl);
    setName("");
    setHtml("");
  };

  return (
    <div className="grid gap-3">
      <Label htmlFor="name">Template name</Label>
      <Input
        id="name"
        placeholder="e.g. Order Receipt"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={disabled}
      />
      <Label htmlFor="html">Template HTML</Label>
      <Textarea
        id="html"
        placeholder="Paste your HTML here. Use placeholders like {{title}}, {{body}}…"
        className="min-h-40"
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        disabled={disabled}
      />
      <div className="flex justify-end">
        <Button
          onClick={handleAdd}
          disabled={!name.trim() || !html.trim() || disabled}
        >
          Add Template
        </Button>
      </div>
    </div>
  );
}

function AddByUpload({
  onAdd,
  disabled,
}: {
  onAdd: (tpl: Omit<EmailTemplate, "_id" | "createdAt">) => void;
  disabled?: boolean;
}) {
  const [name, setName] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);

  const onFile = async (file: File) => {
    const text = await file.text();
    setFileName(file.name);
    setHtml(text);
    if (!name) {
      const base = file.name.replace(/\.html?$/i, "");
      setName(base);
    }
  };

  const handleAdd = () => {
    if (!name.trim() || !html) return;
    const tpl = {
      id: crypto.randomUUID(),
      name: name.trim(),
      html,
    };
    onAdd(tpl);
    setName("");
    setFileName(null);
    setHtml(null);
  };

  return (
    <div className="grid gap-3">
      <Label htmlFor="upload-name">Template name</Label>
      <Input
        id="upload-name"
        placeholder="e.g. Newsletter"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={disabled}
      />
      <div className="grid gap-2">
        <Label>Upload .html</Label>
        <input
          type="file"
          accept=".html,text/html"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
          disabled={disabled}
          className="block w-full text-sm file:mr-4 file:rounded-md file:border file:border-input file:bg-secondary file:px-3 file:py-1.5 file:text-foreground"
        />
        {fileName && (
          <div className="text-xs text-muted-foreground">
            Selected: {fileName}
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Button
          onClick={handleAdd}
          disabled={!name.trim() || !html || disabled}
        >
          Add Uploaded
        </Button>
      </div>
    </div>
  );
}

function RichTextField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (html: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Update content when value changes externally
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (cmd: string, value?: string) => {
    if (!editorRef.current) return;

    // Focus the editor first
    editorRef.current.focus();

    // Execute the command
    document.execCommand(cmd, false, value);

    // Trigger onChange to save the updated content
    onChange(editorRef.current.innerHTML);
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onChange((e.target as HTMLDivElement).innerHTML);
  };

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-1 border-b p-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent blur
            exec("bold");
          }}
        >
          <strong>Bold</strong>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("italic");
          }}
        >
          <em>Italic</em>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("underline");
          }}
        >
          <u>Underline</u>
        </Button>
        <Separator orientation="vertical" className="mx-1 h-5" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("insertUnorderedList");
          }}
        >
          • List
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("insertOrderedList");
          }}
        >
          1. List
        </Button>
        <Separator orientation="vertical" className="mx-1 h-5" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("createLink", prompt("Enter URL:") || undefined);
          }}
        >
          Link
        </Button>
      </div>
      <div
        id={id}
        ref={editorRef}
        className="min-h-32 max-h-80 overflow-auto p-3 outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        contentEditable
        onInput={handleInput}
        aria-label="Rich text editor"
        role="textbox"
        suppressContentEditableWarning
      />
    </div>
  );
}

// LocalStorage helpers for values (templates are stored in DB)
const VALUES_PREFIX = "emailTemplateValues:";

function loadValuesFromLocal(
  templateId: string
): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(VALUES_PREFIX + templateId);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return null;
  }
}

function saveValuesToLocal(templateId: string, values: Record<string, string>) {
  try {
    localStorage.setItem(VALUES_PREFIX + templateId, JSON.stringify(values));
  } catch {
    // ignore
  }
}

function deleteValuesFromLocal(templateId: string) {
  try {
    localStorage.removeItem(VALUES_PREFIX + templateId);
  } catch {
    // ignore
  }
}
