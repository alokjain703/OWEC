/**
 * Import Tree Models
 * Mirrors the backend Pydantic models in import_tree_models.py
 */

export type ContentFormat = 'html' | 'markdown' | 'json' | 'plain';

export type NodeRole = 'book' | 'part' | 'chapter' | 'section' | 'scene' | 'unknown';

/** A node in the editable import preview tree. */
export interface ImportTreeNode {
  title: string;
  role: NodeRole;
  content: string;
  content_format: ContentFormat;
  children: ImportTreeNode[];
  /** Original page number in the PDF – shown as a hint in the UI. */
  page?: number;
}

/** Server response from POST /document-import/parse */
export interface ParseResponse {
  tree: ImportTreeNode[];
  warnings: string[];
}

/** Request body for POST /document-import/commit */
export interface CommitRequest {
  target_node_id: string;
  project_id: string;
  tree: ImportTreeNode[];
}

/** Server response from POST /document-import/commit */
export interface CommitResponse {
  created: number;
  root_node_ids: string[];
  warnings: string[];
}
