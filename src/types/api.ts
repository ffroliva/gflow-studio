export type AssetKind = "image" | "video" | "character" | "scene";

export interface AssetRecord {
  id: string;
  profile_name: string;
  flow_project_id?: string;
  flow_media_id: string;
  kind: AssetKind;
  status: string;
  model?: string;
  aspect_ratio?: string;
  width?: number;
  height?: number;
  duration_seconds?: number;
  seed?: number;
  created_at: string;
  metadata_json?: string;
}

export interface CharacterRecord {
  id: string;
  profile_name: string;
  flow_project_id: string;
  flow_character_id: string;
  display_name: string;
  voice?: string;
  personality?: string;
  thumbnail_media_id?: string;
  created_at: string;
}

export interface ProjectRecord {
  id: string;
  profile_name: string;
  flow_project_id: string;
  title: string;
  source: string;
  created_at: string;
}

export interface ProfileRecord {
  name: string;
  profile_dir: string;
  first_seen_at: string;
  last_used_at?: string;
}

export interface TaskRecord {
  id: string;
  profile_name: string;
  flow_project_id?: string;
  command?: string;
  mode: string;
  prompt?: string;
  model?: string;
  aspect_ratio?: string;
  status: "pending" | "running" | "completed" | "failed";
  started_at: string;
  completed_at?: string;
  error_type?: string;
  error_detail?: string;
  flow_operation_id?: string;
  flow_batch_id?: string;
}
