import React, { useRef, useEffect } from "react";
import { useTimelineStore } from "../../stores/timeline";
import {
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Film,
  Trash2,
  Music,
} from "lucide-react";

export const TimelineEditor: React.FC = () => {
  const {
    tracks,
    playheadMs,
    isPlaying,
    zoomLevel,
    selectedClipId,
    setIsPlaying,
    setPlayheadMs,
    setZoomLevel,
    removeClip,
    setSelectedClipId,
  } = useTimelineStore();

  const timelineRef = useRef<HTMLDivElement>(null);

  // Time format helper: ms -> MM:SS.SS
  const formatTime = (ms: number) => {
    const totalSec = ms / 1000;
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toFixed(2).padStart(5, "0")}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + timelineRef.current.scrollLeft;
    // Calculate ms based on zoomLevel (pixels per second)
    const clickedSec = clickX / zoomLevel;
    setPlayheadMs(clickedSec * 1000);
  };

  // Auto scroll playhead into view when playing
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setPlayheadMs(playheadMs + 100);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying, playheadMs, setPlayheadMs]);

  // Total duration representation
  const maxDurationMs = 30000; // 30 seconds limit

  return (
    <div className="h-[220px] glass-panel border-t border-white/5 flex flex-col shrink-0 overflow-hidden bg-app-bg select-none z-20">
      {/* Timeline Controls Header */}
      <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-zinc-950/40 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? "Pause" : "Play"}
              className={`h-7 w-7 rounded-lg flex items-center justify-center interactive cursor-pointer ${
                isPlaying
                  ? "bg-[#d9ff00] text-black"
                  : "bg-zinc-900 text-zinc-300 border border-white/10"
              }`}
            >
              {isPlaying ? (
                <Pause className="h-4.5 w-4.5 fill-black" />
              ) : (
                <Play className="h-4.5 w-4.5 fill-zinc-300 ml-0.5" />
              )}
            </button>
            <span className="font-mono text-xs text-zinc-300 w-24 text-center">
              {formatTime(playheadMs)}
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-800" />

          {selectedClipId && (
            <button
              onClick={() => removeClip(selectedClipId)}
              className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg text-[11px] interactive cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove Selected
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomLevel(zoomLevel - 10)}
            aria-label="Zoom Out"
            className="h-7 w-7 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center interactive cursor-pointer"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] text-zinc-500 font-mono w-10 text-center">
            {zoomLevel}px/s
          </span>
          <button
            onClick={() => setZoomLevel(zoomLevel + 10)}
            aria-label="Zoom In"
            className="h-7 w-7 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center interactive cursor-pointer"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tracks & Ruler Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers (Left sidebar of timeline) */}
        <div className="w-48 border-r border-white/5 bg-zinc-950/20 flex flex-col shrink-0">
          <div className="h-6 border-b border-white/5 flex items-center px-3 text-[10px] text-zinc-500 font-bold font-mono">
            TRACK NAMES
          </div>
          <div className="flex-1 flex flex-col justify-stretch">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="flex-1 border-b border-white/5 flex items-center justify-between px-3 text-xs bg-zinc-900/10"
              >
                <div className="flex items-center gap-2">
                  {track.kind === "video" ? (
                    <Film className="h-3.5 w-3.5 text-[#d9ff00]/70" />
                  ) : (
                    <Music className="h-3.5 w-3.5 text-cyan-400/70" />
                  )}
                  <span className="font-medium text-zinc-300 truncate w-24">
                    {track.name}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <span className="text-[9px] font-mono text-zinc-500 capitalize bg-zinc-900 px-1 py-0.2 rounded border border-white/5">
                    {track.kind}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tracks Timeline Area (Right scrolling surface) */}
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          className="flex-1 overflow-x-auto overflow-y-hidden flex flex-col relative bg-zinc-950/5 select-none"
        >
          {/* Ruler (Time stamps) */}
          <div className="h-6 border-b border-white/5 bg-zinc-950/30 flex relative shrink-0">
            {Array.from({ length: Math.ceil(maxDurationMs / 1000) }).map(
              (_, i) => {
                const leftPos = (i * 1000 * zoomLevel) / 1000;
                return (
                  <div
                    key={i}
                    className="absolute border-l border-white/5 h-full pl-1 text-[9px] text-zinc-600 font-mono flex items-end pb-0.5"
                    style={{ left: `${leftPos}px` }}
                  >
                    {i}s
                  </div>
                );
              },
            )}
          </div>

          {/* Track lanes */}
          <div className="flex-1 flex flex-col justify-stretch relative">
            {/* Playhead indicator bar */}
            <div
              className="absolute top-0 bottom-0 w-px bg-[#d9ff00] z-10 pointer-events-none transition-all duration-75"
              style={{
                left: `${(playheadMs * zoomLevel) / 1000}px`,
                boxShadow: "0 0 8px #d9ff00",
              }}
            >
              <div className="absolute -top-1 -left-1.5 h-3 w-3 bg-[#d9ff00] rotate-45 border border-black" />
            </div>

            {tracks.map((track) => (
              <div
                key={track.id}
                className="flex-1 border-b border-white/5 relative bg-zinc-950/10 flex items-center"
              >
                {track.clips.map((clip) => {
                  const width = (clip.durationMs * zoomLevel) / 1000;
                  const left = (clip.startTimeMs * zoomLevel) / 1000;
                  const isSelected = clip.id === selectedClipId;

                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClipId(isSelected ? null : clip.id);
                      }}
                      className={`absolute h-4/5 rounded-lg flex items-center px-3 text-[11px] truncate select-none border transition-all cursor-pointer font-mono ${
                        isSelected
                          ? "bg-[#d9ff00]/10 border-[#d9ff00] text-[#d9ff00] shadow-glow"
                          : "bg-zinc-900 border-white/10 text-zinc-300 hover:border-zinc-700"
                      }`}
                      style={{
                        left: `${left}px`,
                        width: `${width}px`,
                      }}
                    >
                      <Film className="h-3 w-3 mr-1.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{clip.name}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
