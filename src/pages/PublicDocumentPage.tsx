import { useEffect, useMemo, useState } from "react";
import { RuntimeClient } from "@rootcx/sdk";
import { IconFileText, IconLock, IconWorld } from "@tabler/icons-react";
import { Editor } from "@/components/Editor";
import { APP_ID } from "@/lib/utils";

interface PublicDoc {
  id: string;
  title: string;
  content: unknown;
  icon: string | null;
}

/**
 * Read-only document view shown at `/share/:token`.
 *
 * Builds its own RuntimeClient with `persist: false` so the share token is
 * held in memory only — never written to localStorage. This keeps a
 * signed-in user's session in another tab fully intact.
 */
export function PublicDocumentPage({ token }: { token: string }) {
  const client = useMemo(
    () => new RuntimeClient({ accessToken: token, persist: false, autoRefresh: false }),
    [token],
  );

  const [doc, setDoc] = useState<PublicDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const info = await client.getPublicShareInfo();
        if (info.appId !== APP_ID) {
          setError("This link belongs to another app.");
          return;
        }
        const documentId = (info.context as { document_id?: string })?.document_id;
        if (!documentId) {
          setError("This share link is malformed.");
          return;
        }
        const result = (await client.rpc(APP_ID, "get_public_document", { document_id: documentId })) as PublicDoc;
        setDoc(result);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
          setError("This share link has been revoked or doesn't exist.");
        } else {
          setError(`Failed to load: ${msg}`);
        }
      }
    })();
  }, [client]);

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <IconLock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-semibold mb-2">Link unavailable</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading shared document…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 h-12 border-b border-border bg-card">
        <IconFileText className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">Documents</span>
        <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
          <IconWorld className="h-3 w-3" />
          Public read-only
        </span>
      </header>

      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <div className="flex items-center gap-2 mb-4">
          {doc.icon && <span className="text-3xl">{doc.icon}</span>}
          <h1 className="text-3xl font-bold">{doc.title}</h1>
        </div>
        <Editor content={doc.content as Record<string, unknown> | null} onUpdate={() => {}} readOnly />
      </div>
    </div>
  );
}
