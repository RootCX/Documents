import { useAppCollection } from "@rootcx/sdk";
import { APP_ID } from "@/lib/utils";

export interface Folder {
  id: string;
  title: string;
  parent_id: string | null;
  position: number;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  title: string;
  content: Record<string, unknown> | null;
  folder_id: string | null;
  position: number;
  icon: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export function useFolders() {
  return useAppCollection<Folder>(APP_ID, "folders", {
    orderBy: "position",
    order: "asc",
  });
}

export function useAllDocuments() {
  return useAppCollection<Document>(APP_ID, "documents", {
    orderBy: "updated_at",
    order: "desc",
  });
}
