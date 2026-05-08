import { useParams, useNavigate } from "react-router-dom";
import { useAppRecord } from "@rootcx/sdk";
import { LoadingState, ErrorState } from "@rootcx/ui";
import { Editor } from "@/components/Editor";
import { DocumentTitle } from "@/components/DocumentTitle";
import { ExportMenu } from "@/components/ExportMenu";
import { APP_ID } from "@/lib/utils";
import type { Document } from "@/hooks/useDocuments";

export function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
        <ExportMenu
          title={doc.title}
          content={doc.content as Record<string, unknown> | null}
        />
      </div>
      <Editor content={doc.content} onUpdate={(content) => update({ content })} />
    </div>
  );
}
