import { useNavigate } from "react-router-dom";
import { IconFile, IconClock, IconPlus } from "@tabler/icons-react";
import { Button, EmptyState } from "@rootcx/ui";
import type { Document } from "@/hooks/useDocuments";

interface HomePageProps {
  documents: Document[];
  onCreateDocument: () => void;
}

export function HomePage({ documents, onCreateDocument }: HomePageProps) {
  const navigate = useNavigate();
  const recentDocs = documents.slice(0, 12);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="mt-1 text-muted-foreground">Your recent documents</p>
        </div>
        <Button onClick={onCreateDocument}>
          <IconPlus className="mr-2 h-4 w-4" />
          New Page
        </Button>
      </div>

      {recentDocs.length === 0 ? (
        <EmptyState
          icon={<IconFile className="h-12 w-12" />}
          title="No documents yet"
          description="Create your first document to get started"
          action={
            <Button onClick={onCreateDocument}>
              <IconPlus className="mr-2 h-4 w-4" />
              Create Document
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recentDocs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => navigate(`/doc/${doc.id}`)}
              className="group flex flex-col items-start gap-2 rounded-lg border border-border p-4 text-left transition-all hover:border-primary/30 hover:bg-accent/30 hover:shadow-sm"
            >
              <div className="flex w-full items-center gap-2">
                <span className="text-lg">{doc.icon || "📄"}</span>
                <span className="flex-1 truncate text-sm font-medium">{doc.title}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <IconClock className="h-3 w-3" />
                <span>
                  {new Date(doc.updated_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
