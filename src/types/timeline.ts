import { AssetRecord } from "./api";

export type TrackKind = "video" | "audio" | "text";

export interface TimelineClip {
  id: string;
  trackId: string;
  assetId: string;
  asset?: AssetRecord;
  name: string;
  startTimeMs: number;
  durationMs: number;
  cutStartMs: number;
  speed: number;
  zIndex: number;
}

export interface Track {
  id: string;
  name: string;
  kind: TrackKind;
  muted: boolean;
  locked: boolean;
  clips: TimelineClip[];
}
