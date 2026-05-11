import { useState, useMemo, useRef, useEffect, useCallback, createContext, useContext } from "react";
import { NavLink, useParams } from "react-router-dom";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { attachInstruction, extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import {
  IconFile,
  IconFolder,
  IconFolderOpen,
  IconChevronRight,
  IconPlus,
  IconDots,
  IconTrash,
  IconEdit,
  IconStar,
  IconStarFilled,
  IconFilePlus,
  IconFolderPlus,
  IconArrowMoveRight,
  IconHome,
} from "@tabler/icons-react";
import {
  Sidebar,
  SidebarSection,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  Input,
  ScrollArea,
  ConfirmDialog,
} from "@rootcx/ui";
import { cn, useLatestRef } from "@/lib/utils";
import type { Folder, Document } from "@/hooks/useDocuments";

type DocumentDragData = Record<string, unknown> & {
  type: "document";
  id: string;
  folderId: string | null;
};

function isDocumentDrag(data: Record<string, unknown>): data is DocumentDragData {
  return data.type === "document" && typeof data.id === "string";
}

interface SidebarActions {
  onCreateFolder: (parentId?: string | null) => void;
  onCreateDocument: (folderId?: string | null) => void;
  onRenameFolder: (id: string, title: string) => void;
  onRenameDocument: (id: string, title: string) => void;
  onDeleteFolder: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onMoveDocument: (id: string, folderId: string | null) => void;
}

interface TreeState {
  expandedFolders: Set<string>;
  toggleFolder: (id: string) => void;
  expandFolder: (id: string) => void;
  renamingId: string | null;
  renameValue: string;
  setRenameValue: (v: string) => void;
  startRename: (id: string, title: string) => void;
  submitRename: (id: string, isFolder: boolean) => void;
  activeDocId?: string;
  foldersByParent: Map<string | null, Folder[]>;
  docsByFolder: Map<string | null, Document[]>;
  folders: Folder[];
}

const SidebarContext = createContext<(SidebarActions & TreeState) | null>(null);

function useSidebarContext() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("Missing SidebarContext");
  return ctx;
}

const INDENT_BASE = 8;
const INDENT_PER_LEVEL = 16;

function indentStyle(level: number) {
  return { paddingLeft: `${INDENT_BASE + level * INDENT_PER_LEVEL}px` };
}

interface DocumentSidebarProps extends SidebarActions {
  folders: Folder[];
  documents: Document[];
}

export function DocumentSidebar({
  folders,
  documents,
  ...actions
}: DocumentSidebarProps) {
  const { id: activeDocId } = useParams();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const favorites = useMemo(() => documents.filter((d) => d.is_favorite), [documents]);

  const foldersByParent = useMemo(() => {
    const map = new Map<string | null, Folder[]>();
    for (const f of folders) {
      const list = map.get(f.parent_id) ?? [];
      list.push(f);
      map.set(f.parent_id, list);
    }
    return map;
  }, [folders]);

  const docsByFolder = useMemo(() => {
    const map = new Map<string | null, Document[]>();
    for (const d of documents) {
      const list = map.get(d.folder_id) ?? [];
      list.push(d);
      map.set(d.folder_id, list);
    }
    return map;
  }, [documents]);

  const toggleFolder = useCallback((id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandFolder = useCallback((id: string) => {
    setExpandedFolders((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const renameValueRef = useLatestRef(renameValue);
  const actionsRef = useLatestRef(actions);

  const startRename = useCallback((id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameValue(currentTitle);
  }, []);

  const submitRename = useCallback((id: string, isFolder: boolean) => {
    const val = renameValueRef.current.trim();
    if (val) {
      if (isFolder) actionsRef.current.onRenameFolder(id, val);
      else actionsRef.current.onRenameDocument(id, val);
    }
    setRenamingId(null);
  }, [renameValueRef, actionsRef]);

  const ctx = useMemo<SidebarActions & TreeState>(() => ({
    ...actions,
    expandedFolders,
    toggleFolder,
    expandFolder,
    renamingId,
    renameValue,
    setRenameValue,
    startRename,
    submitRename,
    activeDocId,
    foldersByParent,
    docsByFolder,
    folders,
  }), [
    actions, expandedFolders, toggleFolder, expandFolder,
    renamingId, renameValue, startRename, submitRename,
    activeDocId, foldersByParent, docsByFolder, folders,
  ]);

  const rootFolders = foldersByParent.get(null) ?? [];
  const rootDocuments = docsByFolder.get(null) ?? [];

  return (
    <SidebarContext.Provider value={ctx}>
      <Sidebar
        header={
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Documents</span>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => actions.onCreateDocument(null)}
                aria-label="New document"
              >
                <IconFilePlus className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => actions.onCreateFolder(null)}
                aria-label="New folder"
              >
                <IconFolderPlus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        }
      >
        <ScrollArea className="flex-1 overflow-x-hidden">
          {favorites.length > 0 && (
            <SidebarSection title="Favorites" collapsible defaultOpen>
              {favorites.map((doc) => (
                <DocumentItem key={doc.id} doc={doc} level={0} />
              ))}
            </SidebarSection>
          )}
          <SidebarSection title="Pages" collapsible defaultOpen>
            {rootFolders.map((folder) => (
              <FolderItem key={folder.id} folder={folder} level={0} />
            ))}
            {rootDocuments.map((doc) => (
              <DocumentItem key={doc.id} doc={doc} level={0} />
            ))}
          </SidebarSection>
        </ScrollArea>
      </Sidebar>
    </SidebarContext.Provider>
  );
}

function InlineRenameInput({ id, isFolder }: { id: string; isFolder: boolean }) {
  const { renameValue, setRenameValue, submitRename } = useSidebarContext();
  return (
    <Input
      value={renameValue}
      onChange={(e) => setRenameValue(e.target.value)}
      onBlur={() => submitRename(id, isFolder)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "Escape") submitRename(id, isFolder);
      }}
      className="h-6 flex-1 text-sm"
      autoFocus
    />
  );
}

function MoveToSubmenu({ docId, currentFolderId }: { docId: string; currentFolderId: string | null }) {
  const { folders, onMoveDocument } = useSidebarContext();
  const availableFolders = folders.filter((f) => f.id !== currentFolderId);

  if (availableFolders.length === 0 && !currentFolderId) return null;

  return (
    <>
      {currentFolderId && (
        <DropdownMenuItem onClick={() => onMoveDocument(docId, null)}>
          <IconHome className="mr-2 h-4 w-4" /> Move to root
        </DropdownMenuItem>
      )}
      {availableFolders.map((folder) => (
        <DropdownMenuItem key={folder.id} onClick={() => onMoveDocument(docId, folder.id)}>
          <IconFolder className="mr-2 h-4 w-4" />
          <span className="truncate">{folder.icon ? `${folder.icon} ` : ""}{folder.title}</span>
        </DropdownMenuItem>
      ))}
    </>
  );
}

function stopDrag(e: React.MouseEvent | React.PointerEvent) {
  e.stopPropagation();
}

function countDocsInFolder(
  folderId: string,
  docsByFolder: Map<string | null, Document[]>,
  foldersByParent: Map<string | null, Folder[]>
): number {
  let count = (docsByFolder.get(folderId) ?? []).length;
  for (const child of foldersByParent.get(folderId) ?? []) {
    count += countDocsInFolder(child.id, docsByFolder, foldersByParent);
  }
  return count;
}

function folderDeleteDescription(
  folder: Folder,
  docsByFolder: Map<string | null, Document[]>,
  foldersByParent: Map<string | null, Folder[]>
): string {
  const count = countDocsInFolder(folder.id, docsByFolder, foldersByParent);
  if (count === 0) return `"${folder.title}" will be permanently deleted.`;
  return `"${folder.title}" and ${count} document${count > 1 ? "s" : ""} inside will be permanently deleted.`;
}

function DocumentItem({ doc, level }: { doc: Document; level: number }) {
  const {
    activeDocId,
    renamingId,
    startRename,
    onDeleteDocument,
    onToggleFavorite,
  } = useSidebarContext();
  const isActive = activeDocId === doc.id;
  const isRenaming = renamingId === doc.id;
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const docRef = useLatestRef(doc);

  useEffect(() => {
    const el = ref.current;
    if (!el || isRenaming) return;

    return draggable({
      element: el,
      getInitialData: (): DocumentDragData => ({
        type: "document",
        id: docRef.current.id,
        folderId: docRef.current.folder_id,
      }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });
  }, [doc.id, isRenaming, docRef]);

  return (
    <div
      ref={ref}
      className={cn(
        "group flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors cursor-grab active:cursor-grabbing",
        isActive ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50",
        isDragging && "opacity-40"
      )}
      style={indentStyle(level)}
    >
      <span className="shrink-0" draggable={false}><IconFile className="h-4 w-4 text-muted-foreground" /></span>
      {isRenaming ? (
        <InlineRenameInput id={doc.id} isFolder={false} />
      ) : (
        <NavLink to={`/doc/${doc.id}`} className="min-w-0 flex-1 truncate" draggable={false}>
          {doc.icon ? `${doc.icon} ` : ""}{doc.title}
        </NavLink>
      )}
      <div
        className="flex shrink-0 items-center"
        onMouseDown={stopDrag}
        onPointerDown={stopDrag}
        draggable={false}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-accent transition-opacity">
              <IconDots className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => startRename(doc.id, doc.title)}>
              <IconEdit className="mr-2 h-4 w-4" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleFavorite(doc.id, doc.is_favorite)}>
              {doc.is_favorite ? (
                <><IconStarFilled className="mr-2 h-4 w-4" /> Unfavorite</>
              ) : (
                <><IconStar className="mr-2 h-4 w-4" /> Favorite</>
              )}
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <IconArrowMoveRight className="mr-2 h-4 w-4" /> Move to...
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-44 max-h-60 overflow-y-auto">
                <MoveToSubmenu docId={doc.id} currentFolderId={doc.folder_id} />
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-destructive">
              <IconTrash className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete document"
        description={`"${doc.title}" will be permanently deleted.`}
        onConfirm={() => onDeleteDocument(doc.id)}
        destructive
      />
    </div>
  );
}

function FolderItem({ folder, level }: { folder: Folder; level: number }) {
  const {
    expandedFolders,
    toggleFolder,
    expandFolder,
    renamingId,
    startRename,
    onDeleteFolder,
    onCreateDocument,
    onCreateFolder,
    onMoveDocument,
    foldersByParent,
    docsByFolder,
  } = useSidebarContext();

  const isExpanded = expandedFolders.has(folder.id);
  const isRenaming = renamingId === folder.id;
  const childFolders = foldersByParent.get(folder.id) ?? [];
  const childDocuments = docsByFolder.get(folder.id) ?? [];
  const ref = useRef<HTMLDivElement>(null);
  const [dropState, setDropState] = useState<"idle" | "make-child">("idle");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const autoExpandTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dropStateRef = useLatestRef(dropState);
  const isExpandedRef = useLatestRef(isExpanded);
  const onMoveRef = useLatestRef(onMoveDocument);
  const expandRef = useLatestRef(expandFolder);

  const resetDrop = useCallback(() => {
    setDropState("idle");
    if (autoExpandTimer.current) clearTimeout(autoExpandTimer.current);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const cleanup = combine(
      dropTargetForElements({
        element: el,
        getData: ({ input, element }) => {
          return attachInstruction(
            { type: "folder", id: folder.id },
            {
              input,
              element,
              currentLevel: level,
              indentPerLevel: INDENT_PER_LEVEL,
              mode: isExpandedRef.current ? "expanded" : "standard",
              block: [],
            }
          );
        },
        canDrop: ({ source }) => {
          return isDocumentDrag(source.data) && source.data.id !== folder.id;
        },
        onDragEnter: () => {
          setDropState("make-child");
          autoExpandTimer.current = setTimeout(() => {
            expandRef.current(folder.id);
          }, 800);
        },
        onDrag: ({ self }) => {
          const instruction = extractInstruction(self.data);
          const newState = instruction?.type === "make-child" ? "make-child" : "idle";
          if (dropStateRef.current !== newState) {
            setDropState(newState as "idle" | "make-child");
          }
        },
        onDragLeave: resetDrop,
        onDrop: ({ source }) => {
          resetDrop();
          if (isDocumentDrag(source.data) && source.data.folderId !== folder.id) {
            onMoveRef.current(source.data.id, folder.id);
            expandRef.current(folder.id);
          }
        },
      })
    );

    return () => {
      cleanup();
      if (autoExpandTimer.current) clearTimeout(autoExpandTimer.current);
    };
  }, [folder.id, level, resetDrop, isExpandedRef, dropStateRef, onMoveRef, expandRef]);

  return (
    <div className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "group flex w-full items-center gap-1 rounded-md px-2 py-1 text-sm text-foreground transition-all hover:bg-accent/50",
          dropState === "make-child" && "bg-primary/10 ring-1 ring-inset ring-primary/50"
        )}
        style={indentStyle(level)}
      >
        <button onClick={() => toggleFolder(folder.id)} className="shrink-0 rounded p-0.5 hover:bg-accent">
          <IconChevronRight
            className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-90")}
          />
        </button>
        {isExpanded ? (
          <IconFolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <IconFolder className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        {isRenaming ? (
          <InlineRenameInput id={folder.id} isFolder />
        ) : (
          <span className="min-w-0 flex-1 cursor-pointer truncate" onClick={() => toggleFolder(folder.id)}>
            {folder.icon ? `${folder.icon} ` : ""}{folder.title}
          </span>
        )}
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={() => onCreateDocument(folder.id)}
            className="rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-accent transition-opacity"
            title="New page"
          >
            <IconPlus className="h-3.5 w-3.5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-accent transition-opacity">
                <IconDots className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onCreateDocument(folder.id)}>
                <IconFilePlus className="mr-2 h-4 w-4" /> New page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateFolder(folder.id)}>
                <IconFolderPlus className="mr-2 h-4 w-4" /> New subfolder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => startRename(folder.id, folder.title)}>
                <IconEdit className="mr-2 h-4 w-4" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-destructive">
                <IconTrash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          open
          onOpenChange={setConfirmDelete}
          title="Delete folder"
          description={folderDeleteDescription(folder, docsByFolder, foldersByParent)}
          onConfirm={() => onDeleteFolder(folder.id)}
          destructive
        />
      )}

      {isExpanded && (
        <div>
          {childFolders.map((child) => (
            <FolderItem key={child.id} folder={child} level={level + 1} />
          ))}
          {childDocuments.map((doc) => (
            <DocumentItem key={doc.id} doc={doc} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
