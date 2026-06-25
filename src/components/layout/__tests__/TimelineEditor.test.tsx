import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimelineEditor } from "../TimelineEditor";
import { useTimelineStore } from "../../../stores/timeline";
import { AssetRecord } from "../../../types/api";

describe("TimelineEditor", () => {
  beforeEach(() => {
    useTimelineStore.getState().resetTimeline();
  });

  it("should render tracks and correct initial playhead time", () => {
    render(<TimelineEditor />);

    expect(screen.getByText("Video Track 1")).toBeInTheDocument();
    expect(screen.getByText("Audio Track 1")).toBeInTheDocument();
    expect(screen.getByText("00:00.00")).toBeInTheDocument();
  });

  it("should toggle play state when clicking play/pause button", () => {
    render(<TimelineEditor />);

    const playStateBefore = useTimelineStore.getState().isPlaying;
    expect(playStateBefore).toBe(false);

    // Grab play button by aria-label
    const playBtn = screen.getByRole("button", { name: /play/i });
    fireEvent.click(playBtn);

    expect(useTimelineStore.getState().isPlaying).toBe(true);

    // Grab pause button by updated aria-label
    const pauseBtn = screen.getByRole("button", { name: /pause/i });
    fireEvent.click(pauseBtn);
    expect(useTimelineStore.getState().isPlaying).toBe(false);
  });

  it("should change zoom level when clicking zoom buttons", () => {
    render(<TimelineEditor />);
    const initialZoom = useTimelineStore.getState().zoomLevel; // 50

    // Zoom in / out buttons by aria-label
    const zoomInBtn = screen.getByRole("button", { name: /zoom in/i });
    const zoomOutBtn = screen.getByRole("button", { name: /zoom out/i });

    // Zoom level display is present
    expect(screen.getByText("50px/s")).toBeInTheDocument();

    fireEvent.click(zoomInBtn);
    expect(useTimelineStore.getState().zoomLevel).toBe(initialZoom + 10);
    expect(screen.getByText(`${initialZoom + 10}px/s`)).toBeInTheDocument();

    fireEvent.click(zoomOutBtn); // back to initialZoom
    fireEvent.click(zoomOutBtn); // to initialZoom - 10
    expect(useTimelineStore.getState().zoomLevel).toBe(initialZoom - 10);
    expect(screen.getByText(`${initialZoom - 10}px/s`)).toBeInTheDocument();
  });

  it("should show remove button when clip is selected and trigger removeClip", () => {
    const store = useTimelineStore.getState();
    const mockAsset: AssetRecord = {
      id: "asset-1",
      profile_name: "default",
      flow_media_id: "media-abc", // Name is substring(0, 8) which is "media-ab"
      kind: "video",
      status: "completed",
      created_at: new Date().toISOString(),
      duration_seconds: 4,
    };

    store.addClip("track-v1", mockAsset, 2000);
    const addedClip = useTimelineStore.getState().tracks[0].clips[0];

    render(<TimelineEditor />);

    // Select the clip using substring name
    const clipElem = screen.getByText("media-ab");
    expect(clipElem).toBeInTheDocument();
    fireEvent.click(clipElem);

    expect(useTimelineStore.getState().selectedClipId).toBe(addedClip.id);

    // The "Remove Selected" button should now be visible
    const removeBtn = screen.getByRole("button", { name: /remove selected/i });
    expect(removeBtn).toBeInTheDocument();

    fireEvent.click(removeBtn);
    expect(useTimelineStore.getState().tracks[0].clips).toHaveLength(0);
    expect(useTimelineStore.getState().selectedClipId).toBeNull();
  });
});
