import { create } from "zustand";
import { Track, TimelineClip, TrackKind } from "../types/timeline";
import { AssetRecord } from "../types/api";

interface TimelineState {
  tracks: Track[];
  playheadMs: number;
  isPlaying: boolean;
  zoomLevel: number; // Pixels per second
  selectedClipId: string | null;
  setTracks: (tracks: Track[]) => void;
  addTrack: (name: string, kind: TrackKind) => void;
  removeTrack: (trackId: string) => void;
  addClip: (trackId: string, asset: AssetRecord, startTimeMs: number) => void;
  removeClip: (clipId: string) => void;
  moveClip: (clipId: string, newStartTimeMs: number) => void;
  setPlayheadMs: (ms: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setZoomLevel: (zoom: number) => void;
  setSelectedClipId: (clipId: string | null) => void;
  resetTimeline: () => void;
}

const defaultTracks = (): Track[] => [
  {
    id: "track-v1",
    name: "Video Track 1",
    kind: "video",
    muted: false,
    locked: false,
    clips: [],
  },
  {
    id: "track-a1",
    name: "Audio Track 1",
    kind: "audio",
    muted: false,
    locked: false,
    clips: [],
  },
];

export const useTimelineStore = create<TimelineState>((set) => ({
  tracks: defaultTracks(),
  playheadMs: 0,
  isPlaying: false,
  zoomLevel: 50,
  selectedClipId: null,
  setTracks: (tracks) => set({ tracks }),
  addTrack: (name, kind) =>
    set((state) => ({
      tracks: [
        ...state.tracks,
        {
          id: `track-${kind}-${Date.now()}`,
          name,
          kind,
          muted: false,
          locked: false,
          clips: [],
        },
      ],
    })),
  removeTrack: (trackId) =>
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== trackId),
    })),
  addClip: (trackId, asset, startTimeMs) =>
    set((state) => {
      const durationMs = (asset.duration_seconds || 5) * 1000;
      const newClip: TimelineClip = {
        id: `clip-${Date.now()}`,
        trackId,
        assetId: asset.id,
        asset,
        name: asset.flow_media_id.substring(0, 8) || "New Clip",
        startTimeMs,
        durationMs,
        cutStartMs: 0,
        speed: 1,
        zIndex: 1,
      };

      return {
        tracks: state.tracks.map((track) => {
          if (track.id !== trackId) return track;
          return {
            ...track,
            clips: [...track.clips, newClip],
          };
        }),
      };
    }),
  removeClip: (clipId) =>
    set((state) => ({
      tracks: state.tracks.map((track) => ({
        ...track,
        clips: track.clips.filter((c) => c.id !== clipId),
      })),
      selectedClipId:
        state.selectedClipId === clipId ? null : state.selectedClipId,
    })),
  moveClip: (clipId, newStartTimeMs) =>
    set((state) => ({
      tracks: state.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) => {
          if (clip.id !== clipId) return clip;
          return { ...clip, startTimeMs: Math.max(0, newStartTimeMs) };
        }),
      })),
    })),
  setPlayheadMs: (playheadMs) => set({ playheadMs: Math.max(0, playheadMs) }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setZoomLevel: (zoomLevel) =>
    set({ zoomLevel: Math.max(10, Math.min(200, zoomLevel)) }),
  setSelectedClipId: (selectedClipId) => set({ selectedClipId }),
  resetTimeline: () =>
    set({
      tracks: defaultTracks(),
      playheadMs: 0,
      isPlaying: false,
      selectedClipId: null,
    }),
}));
