import React from "react";
import { useAppStore } from "../../stores/app";
import { Database, Server, User, Cpu, Film } from "lucide-react";

export const StatusBar: React.FC = () => {
  const { daemonConnected, daemonUrl, activeProfile, dbPath, activeTab } = useAppStore();

  return (
    <footer className="h-8 glass-panel border-t border-white/5 flex items-center justify-between px-4 text-[11px] text-zinc-400 select-none shrink-0 z-50">
      {/* Left side: status details */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Server className="h-3.5 w-3.5 text-zinc-500" />
          <span>Daemon:</span>
          <span className="font-mono text-zinc-300">{daemonUrl}</span>
          <div
            className={`h-1.5 w-1.5 rounded-full ${
              daemonConnected ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500 shadow-[0_0_8px_#ef4444]"
            }`}
          />
          <span className={daemonConnected ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>
            {daemonConnected ? "Connected" : "Offline"}
          </span>
        </div>

        <div className="h-3.5 w-px bg-zinc-800" />

        <div className="flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5 text-zinc-500" />
          <span>Database:</span>
          <span className="font-mono text-zinc-300 truncate max-w-[200px]" title={dbPath || "gflow.db (default)"}>
            {dbPath ? dbPath.split(/[/\\]/).pop() : "gflow.db (default)"}
          </span>
        </div>
      </div>

      {/* Center status: Active context indicator */}
      <div className="flex items-center gap-1.5 text-zinc-500">
        <Cpu className="h-3.5 w-3.5" />
        <span>Context:</span>
        <span className="capitalize text-[#d9ff00] font-medium tracking-wide font-mono">
          {activeTab} view
        </span>
      </div>

      {/* Right side: user profile & app info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-zinc-500" />
          <span>Profile:</span>
          <span className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 font-mono text-zinc-200">
            {activeProfile || "None"}
          </span>
        </div>

        <div className="h-3.5 w-px bg-zinc-800" />

        <div className="flex items-center gap-1">
          <Film className="h-3.5 w-3.5 text-[#d9ff00]/60 animate-pulse" />
          <span>Gflow Studio v0.1.0</span>
        </div>
      </div>
    </footer>
  );
};
