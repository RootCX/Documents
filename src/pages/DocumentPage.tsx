import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppRecord } from "@rootcx/sdk";
import { Button, LoadingState, ErrorState } from "@rootcx/ui";
import { IconShare } from "@tabler/icons-react";
import { Editor } from "@/components/Editor";
import { DocumentTitle } from "@/components/DocumentTitle";
import { ExportMenu } from "@/components/ExportMenu";
import { ShareModal } from "@/components/ShareModal";
import { APP_ID } from "@/lib/utils";
import type { Document } from "@/hooks/useDocuments";

export function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shareOpen, setShareOpen] = useState(false);
  const { data: doc, loading, error, update } = useAppRecord<Document>(
    APP_ID,
    "documents",
    id ?? null
  );

  if (loading) return <LoadingState variant="skeleton" />;
  if (error || !doc) {
    return (
      <ErrorState
        message="Document not found"
        onRetry={() => navigate("/")}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <div className="flex items-start justify-between">
        <DocumentTitle
          title={doc.title}
          icon={doc.icon}
          onChange={(title) => update({ title })}
          onIconChange={(icon) => update({ icon })}
        />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShareOpen(true)} title="Share document">
            <IconShare className="h-3.5 w-3.5 mr-1" />
            Share
          </Button>
          <ExportMenu
            title={doc.title}
            content={doc.content as Record<string, unknown> | null}
          />
        </div>
      </div>
      <Editor content={doc.content} onUpdate={(content) => update({ content })} />
      {shareOpen && doc.id && <ShareModal documentId={doc.id} onClose={() => setShareOpen(false)} />}
    </div>
  );
}
