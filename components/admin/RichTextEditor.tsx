"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Paragraph from "@tiptap/extension-paragraph";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";

// StarterKit's default Paragraph parses <p> tags the normal DOM way, which
// collapses runs of spaces per standard HTML whitespace rules — fine the
// first time you type (that goes straight into the live doc), but any time
// the editor re-parses an HTML string (loading a saved value, remounting)
// it silently eats double spaces. preserveWhitespace keeps them intact
// through every round-trip.
const PreserveWhitespaceParagraph = Paragraph.extend({
  parseHTML() {
    return [{ tag: "p", preserveWhitespace: "full" }];
  },
});

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Legacy messages are plain text with blank-line-separated paragraphs
// (from the old <textarea>). TipTap needs those as real separate <p> nodes
// from the start — cramming raw \n\n inside a single paragraph doesn't
// survive a save/reload round-trip (the serializer doesn't preserve bare
// newlines the way plain text did). Already-HTML content (anything saved
// by this editor before) passes through untouched.
function toEditorContent(value: string): string {
  if (/<[a-z][\s\S]*>/i.test(value)) return value;
  return value
    .split(/\n\s*\n/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function ToolbarButton({
  active,
  onClick,
  label,
  title,
  className,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  title: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`min-w-[28px] rounded px-2 py-1 text-xs font-bold normal-case ${className ?? ""} ${
        active ? "bg-foreground text-background" : "text-foreground hover:bg-border/40"
      }`}
    >
      {label}
    </button>
  );
}

// Minimal WYSIWYG for email body copy — bold/italic/underline/link only.
// Scoped deliberately: things like tables/images/headings don't translate
// well into hand-rolled transactional email HTML, and aren't needed for a
// 2-3 sentence message. Output is stored as HTML directly in
// EmailTemplate.message — the render functions insert it unescaped.
//
// Uncontrolled by design: `value` only seeds the editor once at mount
// (each row gets a fresh instance, see EmailTemplatesTable's per-row key),
// and onChange pushes edits up. Reactively calling setContent() whenever
// the `value` prop changed used to fight the user's own typing and could
// duplicate or drop content — not worth it for a case that doesn't
// currently happen in this table.
export function RichTextEditor({
  value,
  onChange,
  rows = 4,
}: {
  value: string;
  onChange: (html: string) => void;
  rows?: number;
}) {
  const [initialContent] = useState(() => toEditorContent(value));

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false,
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        code: false,
      }),
      PreserveWhitespaceParagraph,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "text-sm font-normal normal-case text-foreground outline-none [&_p]:my-2 [&_p]:whitespace-pre-wrap",
      },
    },
  });

  if (!editor) {
    return (
      <div
        className="rounded-md border border-border px-3 py-2 text-sm text-muted"
        style={{ minHeight: `${rows * 1.6}rem` }}
      />
    );
  }

  function setLink() {
    if (!editor) return;
    const previousUrl = (editor.getAttributes("link").href as string | undefined) ?? "";
    const url = window.prompt("Link URL", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="rounded-md border border-border">
      <div className="flex items-center gap-0.5 border-b border-border px-2 py-1">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="B"
          title="Bold"
        />
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="I"
          title="Italic"
          className="italic"
        />
        <ToolbarButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          label="U"
          title="Underline"
          className="underline"
        />
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={setLink}
          label="Link"
          title="Add/edit link"
        />
      </div>
      <EditorContent editor={editor} className="px-3 py-2" style={{ minHeight: `${rows * 1.6}rem` }} />
    </div>
  );
}
