import { useLocation, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthGate } from "@rootcx/sdk";
import {
  AppShell,
  AppShellSidebar,
  AppShellMain,
  AppShellHeader,
  SidebarTrigger,
  Button,
  Toaster,
} from "@rootcx/ui";
import { useTheme } from "@rootcx/ui";
import { IconLogout, IconSun, IconMoon } from "@tabler/icons-react";
import { useFolders, useAllDocuments } from "@/hooks/useDocuments";
import { DocumentSidebar } from "@/components/DocumentSidebar";
import { DocumentPage } from "@/pages/DocumentPage";
import { HomePage } from "@/pages/HomePage";
import { withToast } from "@/lib/utils";

export default function App() {
  return (
    <AuthGate appTitle="Documents">
      {({ user, logout }) => <AppContent user={user} logout={logout} />}
    </AuthGate>
  );
}

function AppContent({ user, logout }: { user: { email: string }; logout: () => void }) {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const {
    data: folders,
    create: createFolder,
    update: updateFolder,
    remove: removeFolder,
  } = useFolders();

  const {
    data: documents,
    create: createDocument,
    update: updateDocument,
    remove: removeDocument,
  } = useAllDocuments();

  const handleCreateFolder = (parentId?: string | null) =>
    withToast(
      () => createFolder({ title: "New Folder", parent_id: parentId || null, position: folders.length, icon: null }),
      "Failed to create folder"
    );

  const handleCreateDocument = async (folderId?: string | null) => {
    const doc = await withToast(
      () => createDocument({ title: "Untitled", content: null, folder_id: folderId || null, position: documents.length, icon: null, is_favorite: false }),
      "Failed to create document"
    );
    if (doc) navigate(`/doc/${doc.id}`);
  };

  const handleRenameFolder = (id: string, title: string) =>
    withToast(() => updateFolder(id, { title }), "Failed to rename folder");

  const handleRenameDocument = (id: string, title: string) =>
    withToast(() => updateDocument(id, { title }), "Failed to rename document");

  const handleDeleteFolder = (id: string) =>
    withToast(() => removeFolder(id), "Failed to delete folder", "Folder deleted");

  const handleDeleteDocument = async (id: string) => {
    await withToast(() => removeDocument(id), "Failed to delete document", "Document deleted");
    if (pathname.includes(id)) navigate("/");
  };

  const handleToggleFavorite = (id: string, current: boolean) =>
    withToast(() => updateDocument(id, { is_favorite: !current }), "Failed to update document");

  const handleMoveDocument = (id: string, folderId: string | null) =>
    withToast(() => updateDocument(id, { folder_id: folderId }), "Failed to move document");

  return (
    <AppShell>
      <AppShellSidebar>
        <DocumentSidebar
          folders={folders}
          documents={documents}
          onCreateFolder={handleCreateFolder}
          onCreateDocument={handleCreateDocument}
          onRenameFolder={handleRenameFolder}
          onRenameDocument={handleRenameDocument}
          onDeleteFolder={handleDeleteFolder}
          onDeleteDocument={handleDeleteDocument}
          onToggleFavorite={handleToggleFavorite}
          onMoveDocument={handleMoveDocument}
        />
        <div className="border-t border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <IconSun className="h-3.5 w-3.5" /> : <IconMoon className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => logout()}
                aria-label="Sign out"
              >
                <IconLogout className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </AppShellSidebar>
      <AppShellMain>
        <AppShellHeader>
          <SidebarTrigger />
        </AppShellHeader>
        <Routes>
          <Route path="/" element={<HomePage documents={documents} onCreateDocument={() => handleCreateDocument(null)} />} />
          <Route path="/doc/:id" element={<DocumentPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShellMain>
      <Toaster />
    </AppShell>
  );
}
