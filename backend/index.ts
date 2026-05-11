// Documents backend worker.
//
// Public RPC `get_public_document` is declared in manifest.json with
// `scope: ["document_id"]`. The core verifies the request matches the
// share-token context BEFORE this handler runs.

declare const serve: (cfg: {
  rpc: Record<string, (params: any, caller: any, ctx: any) => unknown | Promise<unknown>>;
}) => void;

interface DocumentRow {
  id: string;
  title: string;
  content: unknown;
  icon: string | null;
}

serve({
  rpc: {
    ping: () => ({ pong: true }),
    echo: (params: any) => params,
    whoami: (_: any, caller: any) => caller,

    get_public_document: async (params: { document_id: string }, _caller: unknown, ctx: any) => {
      const documentId = params?.document_id;
      if (!documentId) throw new Error("document_id required");

      const doc: DocumentRow | null = await ctx.collection("documents").findOne({ id: documentId });
      if (!doc) throw new Error("document not found");

      return {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        icon: doc.icon,
      };
    },
  },
});
