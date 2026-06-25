import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "./stores/app";
import { useTimelineStore } from "./stores/timeline";
import { CanvasEditor } from "./components/layout/CanvasEditor";
import { ChatPanel } from "./components/layout/ChatPanel";
import { TimelineEditor } from "./components/layout/TimelineEditor";
import { StatusBar } from "./components/layout/StatusBar";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import { AssetRecord } from "./types/api";
import {
  Film,
  Image as ImageIcon,
  User,
  RefreshCw,
  FolderOpen,
  Play,
  Settings,
  Cpu,
  Monitor,
  Terminal,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { mcpClientInstance } from "./services/mcpClient";
import "./App.css";

function App() {
  const {
    activeTab,
    setActiveTab,
    setDaemonConnected,
    daemonUrl,
    activeProfile,
    dbPath,
    setDbPath,
  } = useAppStore();

  const { addClip } = useTimelineStore();

  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [filter, setFilter] = useState<"all" | "video" | "image" | "character">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<AssetRecord | null>(null);
  const [logs, setLogs] = useState<string[]>([
    "Gflow Studio Initialized.",
    "Scanning LOCALAPPDATA for gflow.db...",
  ]);

  const addLog = (msg: string) => {
    setLogs((prev) => [
      ...prev.slice(-49),
      `[${new Date().toLocaleTimeString()}] ${msg}`,
    ]);
  };

  // Try to resolve the default DB path on mount
  useEffect(() => {
    const resolvePath = async () => {
      try {
        const resolvedPath = await invoke<string>("resolve_default_db_path");
        setDbPath(resolvedPath);
        addLog(`Database path resolved dynamically: ${resolvedPath}`);
      } catch (e) {
        // Fallback for web target or direct browser runs
        const fallbackPath = `C:\\Users\\ffrol\\AppData\\Local\\ffroliva\\gflow-cli\\gflow.db`;
        setDbPath(fallbackPath);
        addLog(
          `Database path resolution failed or running in web, using fallback: ${fallbackPath}`,
        );
      }
    };
    resolvePath();
  }, [setDbPath]);

  // Load database assets
  const loadDbAssets = async () => {
    if (!dbPath) return;
    try {
      addLog("Querying assets from SQLite database...");
      const dbAssets = await invoke<AssetRecord[]>("fetch_assets", { dbPath });
      setAssets(dbAssets);
      addLog(`Successfully loaded ${dbAssets.length} assets from database.`);
      if (dbAssets.length > 0 && !selectedAsset) {
        setSelectedAsset(dbAssets[0]);
      }
    } catch (e) {
      addLog(`Database query failed: ${e}`);
    }
  };

  useEffect(() => {
    loadDbAssets();
  }, [dbPath]);

  // Daemon connection setup using standard MCP over SSE
  useEffect(() => {
    addLog(`Initiating MCP connection to SSE Daemon: ${daemonUrl}...`);
    mcpClientInstance.connect(daemonUrl, (connected) => {
      setDaemonConnected(connected);
      addLog(
        connected
          ? "SSE Daemon came online. Connected to FastMCP server."
          : "SSE Daemon connection lost or offline.",
      );
    });

    return () => {
      mcpClientInstance.disconnect();
    };
  }, [daemonUrl, setDaemonConnected]);

  // Filtering assets
  const filteredAssets = assets.filter((asset) => {
    const matchesFilter = filter === "all" || asset.kind === filter;
    const matchesSearch =
      asset.flow_media_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.model &&
        asset.model.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="h-screen w-screen flex flex-col bg-app-bg text-zinc-100 overflow-hidden font-sans select-none">
      {/* Title bar / Header */}
      <header className="h-14 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#d9ff00] to-purple-600 p-[1px]">
            <div className="h-full w-full bg-[#050505] rounded-lg flex items-center justify-center">
              <Film className="h-4.5 w-4.5 text-[#d9ff00]" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              GFLOW STUDIO
              <span className="text-[10px] text-[#d9ff00] font-mono border border-[#d9ff00]/30 rounded px-1 py-0.2">
                BETA
              </span>
            </h1>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-zinc-950 border border-white/5 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("canvas")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold interactive cursor-pointer transition-all ${
              activeTab === "canvas"
                ? "bg-[#d9ff00] text-black shadow-glow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            Visual Canvas
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold interactive cursor-pointer transition-all ${
              activeTab === "chat"
                ? "bg-[#d9ff00] text-black shadow-glow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Character Chat
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-900/50 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 font-mono">
            <Settings
              className="h-3.5 w-3.5 text-zinc-500 animate-spin"
              style={{ animationDuration: "12s" }}
            />
            Profile: <span className="text-zinc-200">{activeProfile}</span>
          </div>
        </div>
      </header>

      {/* Middle row container */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Sidebar: Asset Navigator */}
        <aside className="w-72 border-r border-white/5 bg-app-bg flex flex-col shrink-0">
          <div className="p-4 border-b border-white/5 flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs tracking-wider text-zinc-400 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-[#d9ff00]" />
                MEDIA CATALOG
              </span>
              <button
                onClick={loadDbAssets}
                className="h-6 w-6 rounded hover:bg-zinc-900 border border-transparent hover:border-white/10 flex items-center justify-center text-zinc-400 hover:text-white interactive cursor-pointer"
                title="Sync Database"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-white/5 hover:border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#d9ff00]"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-3 gap-1 bg-zinc-950 border border-white/5 rounded-lg p-0.5">
              <button
                onClick={() => setFilter("all")}
                className={`py-1 rounded text-[10px] font-bold text-center interactive cursor-pointer ${
                  filter === "all"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("video")}
                className={`py-1 rounded text-[10px] font-bold text-center interactive cursor-pointer ${
                  filter === "video"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Video
              </button>
              <button
                onClick={() => setFilter("image")}
                className={`py-1 rounded text-[10px] font-bold text-center interactive cursor-pointer ${
                  filter === "image"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Image
              </button>
            </div>
          </div>

          {/* Catalog Item list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredAssets.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-center p-4">
                <span className="text-xs text-zinc-600 font-medium">
                  No records found
                </span>
                <span className="text-[10px] text-zinc-700 font-mono mt-1">
                  Check gflow connection
                </span>
              </div>
            ) : (
              filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedAsset?.id === asset.id
                      ? "bg-zinc-900/60 border-zinc-700"
                      : "bg-transparent border-transparent hover:bg-zinc-900/30"
                  }`}
                >
                  <div className="flex gap-2.5">
                    {/* Media Type Icon indicator */}
                    <div className="h-10 w-12 rounded bg-zinc-950 border border-white/5 flex items-center justify-center shrink-0 text-zinc-500">
                      {asset.kind === "video" ? (
                        <Film className="h-4 w-4 text-[#d9ff00]" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-purple-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-zinc-200 truncate font-mono">
                        {asset.flow_media_id}
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[9px] text-zinc-500 font-mono">
                        <span>{asset.model || "veo"}</span>
                        <span>{asset.aspect_ratio || "16:9"}</span>
                      </div>
                    </div>
                  </div>
                  {/* Click/Action bar */}
                  {selectedAsset?.id === asset.id && (
                    <div className="mt-2 border-t border-white/5 pt-2 flex justify-end gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addClip("track-v1", asset, 0);
                          addLog(
                            `Added asset ${asset.flow_media_id.substring(0, 8)} to timeline.`,
                          );
                        }}
                        className="bg-[#d9ff00]/10 hover:bg-[#d9ff00]/25 text-[#d9ff00] border border-[#d9ff00]/30 rounded px-2 py-0.5 text-[9px] font-bold tracking-wide interactive cursor-pointer"
                      >
                        Add to Timeline
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Center Canvas / Chat router */}
        <div className="flex-1 flex min-w-0 relative h-full">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              {activeTab === "canvas" ? (
                <motion.div
                  key="canvas"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="w-full h-full flex flex-col"
                >
                  <CanvasEditor />
                </motion.div>
              ) : (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="w-full h-full flex flex-col"
                >
                  <ChatPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </ErrorBoundary>
        </div>

        {/* Right Sidebar: Preview Viewport & Console Logs */}
        <aside className="w-80 border-l border-white/5 bg-[#09090b]/40 backdrop-blur-md flex flex-col shrink-0 overflow-hidden z-25">
          {/* Viewport preview (Resolve-style) */}
          <div className="h-[220px] p-4 border-b border-white/5 flex flex-col shrink-0">
            <div className="flex items-center gap-2 mb-2 text-zinc-400">
              <Monitor className="h-4 w-4 text-[#d9ff00]" />
              <span className="font-bold text-[10px] tracking-wider">
                RESOLVE VIEWPORT
              </span>
            </div>

            <div className="flex-1 bg-black border border-white/5 rounded-lg flex flex-col items-center justify-center relative overflow-hidden group shadow-premium">
              {selectedAsset ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <Film className="h-8 w-8 text-zinc-700 mb-2 group-hover:scale-110 transition-all duration-300" />
                  <span className="text-[10px] font-mono text-zinc-400 text-center truncate w-full">
                    {selectedAsset.flow_media_id}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-600 mt-1 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5">
                    {selectedAsset.kind.toUpperCase()} |{" "}
                    {selectedAsset.width || 1280}x{selectedAsset.height || 720}
                  </span>

                  <button className="absolute bottom-3 bg-[#d9ff00] text-black h-8 w-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 interactive shadow-glow cursor-pointer">
                    <Play className="h-4 w-4 fill-black ml-0.5" />
                  </button>
                </div>
              ) : (
                <div className="text-center p-4">
                  <span className="text-xs text-zinc-600 font-semibold">
                    Select media preview
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Console logs drawer */}
          <div className="flex-1 flex flex-col min-h-0 bg-[#060608]/90">
            <div className="h-9 border-b border-white/5 flex items-center px-4 gap-2 text-zinc-400 shrink-0 bg-zinc-950/20">
              <Terminal className="h-4 w-4 text-purple-400" />
              <span className="font-bold text-[10px] tracking-wider">
                DAEMON LOGS
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] text-zinc-400 space-y-2 select-text">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="leading-relaxed break-all border-l-2 border-[#d9ff00]/10 pl-2"
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Timeline Section */}
      <ErrorBoundary>
        <TimelineEditor />
      </ErrorBoundary>

      {/* Bottom Status bar */}
      <StatusBar />
    </div>
  );
}

export default App;
