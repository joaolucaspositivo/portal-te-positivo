import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, List, ListOrdered, Quote, Link as LinkIcon,
  Heading1, Heading2, Heading3, Undo, Redo, Eraser,
} from "lucide-react";

function ToolBtn({
  onClick, active, children, title,
}: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) {
  return (
    <button
      type="button" title={title} onClick={onClick}
      className={`p-1.5 rounded hover:bg-muted ${active ? "bg-muted text-primary" : ""}`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b p-1 bg-muted/30">
      <ToolBtn title="Título 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })}><Heading1 className="h-4 w-4" /></ToolBtn>
      <ToolBtn title="Título 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}><Heading2 className="h-4 w-4" /></ToolBtn>
      <ToolBtn title="Subtítulo" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}><Heading3 className="h-4 w-4" /></ToolBtn>
      <span className="w-px h-5 bg-border mx-1" />
      <ToolBtn title="Negrito" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}><Bold className="h-4 w-4" /></ToolBtn>
      <ToolBtn title="Itálico" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}><Italic className="h-4 w-4" /></ToolBtn>
      <span className="w-px h-5 bg-border mx-1" />
      <ToolBtn title="Lista" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}><List className="h-4 w-4" /></ToolBtn>
      <ToolBtn title="Lista numerada" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}><ListOrdered className="h-4 w-4" /></ToolBtn>
      <ToolBtn title="Citação" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}><Quote className="h-4 w-4" /></ToolBtn>
      <span className="w-px h-5 bg-border mx-1" />
      <ToolBtn title="Inserir link" onClick={() => {
        const url = window.prompt("URL do link:", editor.getAttributes("link").href ?? "https://");
        if (url === null) return;
        if (url === "") editor.chain().focus().unsetLink().run();
        else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
      }} active={editor.isActive("link")}><LinkIcon className="h-4 w-4" /></ToolBtn>
      <ToolBtn title="Limpar formatação" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><Eraser className="h-4 w-4" /></ToolBtn>
      <span className="w-px h-5 bg-border mx-1" />
      <ToolBtn title="Desfazer" onClick={() => editor.chain().focus().undo().run()}><Undo className="h-4 w-4" /></ToolBtn>
      <ToolBtn title="Refazer" onClick={() => editor.chain().focus().redo().run()}><Redo className="h-4 w-4" /></ToolBtn>
    </div>
  );
}

export function RichTextEditor({
  value, onChange, placeholder,
}: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noreferrer", target: "_blank" } }),
      Placeholder.configure({ placeholder: placeholder ?? "Escreva aqui…" }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[180px] p-3 focus:outline-none [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child]:before:text-muted-foreground [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:pointer-events-none",
      },
    },
    immediatelyRender: false,
  });

  if (!editor) return <div className="border rounded-md min-h-[220px]" />;
  return (
    <div className="border rounded-md bg-background">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}