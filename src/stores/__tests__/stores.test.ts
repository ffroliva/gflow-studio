import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "../app";
import { useTimelineStore } from "../timeline";
import { AssetRecord } from "../../types/api";

describe("useAppStore", () => {
  beforeEach(() => {
    // Reset to defaults manually or using initial values
    const store = useAppStore.getState();
    store.setTheme("dark");
    store.setSidebarOpen(true);
    store.setActiveProfile("default");
    store.setDaemonConnected(false);
    store.setDaemonUrl("http://127.0.0.1:8000");
    store.setActiveTab("canvas");
    store.setDbPath("");
  });

  it("should have initial default values", () => {
    const state = useAppStore.getState();
    expect(state.theme).toBe("dark");
    expect(state.sidebarOpen).toBe(true);
    expect(state.activeProfile).toBe("default");
    expect(state.daemonConnected).toBe(false);
    expect(state.daemonUrl).toBe("http://127.0.0.1:8000");
    expect(state.activeTab).toBe("canvas");
  });

  it("should update theme, sidebarOpen, and other settings", () => {
    const store = useAppStore.getState();

    store.setTheme("light");
    expect(useAppStore.getState().theme).toBe("light");

    store.setSidebarOpen(false);
    expect(useAppStore.getState().sidebarOpen).toBe(false);

    store.setActiveTab("chat");
    expect(useAppStore.getState().activeTab).toBe("chat");

    store.setDaemonConnected(true);
    expect(useAppStore.getState().daemonConnected).toBe(true);

    store.setDaemonUrl("http://localhost:9000");
    expect(useAppStore.getState().daemonUrl).toBe("http://localhost:9000");
  });
});

describe("useTimelineStore", () => {
  beforeEach(() => {
    useTimelineStore.getState().resetTimeline();
  });

  it("should have default tracks loaded initially", () => {
    const state = useTimelineStore.getState();
    expect(state.tracks).toHaveLength(2);
    expect(state.tracks[0].id).toBe("track-v1");
    expect(state.tracks[1].id).toBe("track-a1");
    expect(state.playheadMs).toBe(0);
    expect(state.isPlaying).toBe(false);
  });

  it("should allow adding and removing tracks", () => {
    const store = useTimelineStore.getState();

    store.addTrack("Video 2", "video");
    let state = useTimelineStore.getState();
    expect(state.tracks).toHaveLength(3);
    const addedTrack = state.tracks[2];
    expect(addedTrack.name).toBe("Video 2");
    expect(addedTrack.kind).toBe("video");

    store.removeTrack(addedTrack.id);
    state = useTimelineStore.getState();
    expect(state.tracks).toHaveLength(2);
  });

  it("should allow adding, moving, and removing clips", () => {
    const store = useTimelineStore.getState();
    const mockAsset: AssetRecord = {
      id: "asset-test-1",
      profile_name: "default",
      flow_media_id: "media-flow-xyz",
      kind: "video",
      status: "completed",
      created_at: new Date().toISOString(),
      duration_seconds: 5,
    };

    // Add clip to the default track-v1
    store.addClip("track-v1", mockAsset, 1000);
    let state = useTimelineStore.getState();
    const trackV1 = state.tracks.find((t) => t.id === "track-v1");
    expect(trackV1?.clips).toHaveLength(1);
    const clip = trackV1!.clips[0];
    expect(clip.assetId).toBe("asset-test-1");
    expect(clip.startTimeMs).toBe(1000);
    expect(clip.durationMs).toBe(5000); // 5 seconds * 1000

    // Move the clip to a new start time
    store.moveClip(clip.id, 3500);
    state = useTimelineStore.getState();
    const updatedClip = useTimelineStore
      .getState()
      .tracks.find((t) => t.id === "track-v1")!.clips[0];
    expect(updatedClip.startTimeMs).toBe(3500);

    // Set selected clip id
    store.setSelectedClipId(clip.id);
    expect(useTimelineStore.getState().selectedClipId).toBe(clip.id);

    // Remove the clip
    store.removeClip(clip.id);
    state = useTimelineStore.getState();
    expect(state.tracks.find((t) => t.id === "track-v1")!.clips).toHaveLength(
      0,
    );
    expect(state.selectedClipId).toBeNull();
  });

  it("should support playhead, zoom, and player actions", () => {
    const store = useTimelineStore.getState();

    store.setPlayheadMs(5000);
    expect(useTimelineStore.getState().playheadMs).toBe(5000);

    // Playhead cannot go below 0
    store.setPlayheadMs(-100);
    expect(useTimelineStore.getState().playheadMs).toBe(0);

    store.setIsPlaying(true);
    expect(useTimelineStore.getState().isPlaying).toBe(true);

    store.setZoomLevel(80);
    expect(useTimelineStore.getState().zoomLevel).toBe(80);

    // Zoom level has boundaries [10, 200]
    store.setZoomLevel(5);
    expect(useTimelineStore.getState().zoomLevel).toBe(10);
    store.setZoomLevel(300);
    expect(useTimelineStore.getState().zoomLevel).toBe(200);
  });
});
