import type { JSONContent } from "@tiptap/react";
import {
  IconDownload,
  IconFileTypePdf,
  IconMarkdown,
  IconHtml,
  IconPrinter,
  IconClipboard,
} from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  Button,
  toast,
} from "@rootcx/ui";
import {
  documentToMarkdown,
  documentToHtml,
  exportPdf,
  printDocument,
  downloadFile,
} from "@/lib/export";

interface ExportMenuProps {
  title: string;
  content: JSONContent | null;
}

export function ExportMenu({ title, content }: ExportMenuProps) {
  const handleExportMarkdown = () => {
    const md = documentToMarkdown(content);
    downloadFile(md, `${title}.md`, "text/markdown");
    toast.success("Exported as Markdown");
  };

  const handleExportHtml = () => {
    const html = documentToHtml(title, content);
    downloadFile(html, `${title}.html`, "text/html");
    toast.success("Exported as HTML");
  };

  const handleExportPdf = () => {
    try {
      exportPdf(title, content);
    } catch {
      toast.error("Failed to export PDF");
    }
  };

  const handleCopyMarkdown = async () => {
    const md = documentToMarkdown(content);
    await navigator.clipboard.writeText(md);
    toast.success("Copied as Markdown");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <IconDownload className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <IconDownload className="mr-2 h-4 w-4" /> Export
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuItem onClick={handleExportPdf}>
              <IconFileTypePdf className="mr-2 h-4 w-4" /> PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportHtml}>
              <IconHtml className="mr-2 h-4 w-4" /> HTML
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportMarkdown}>
              <IconMarkdown className="mr-2 h-4 w-4" /> Markdown
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyMarkdown}>
              <IconClipboard className="mr-2 h-4 w-4" /> Copy as Markdown
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={printDocument}>
          <IconPrinter className="mr-2 h-4 w-4" /> Print
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
