import React, { useCallback, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection as FlowConnection,
  Edge,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Play, RotateCcw, Settings2, Sliders, FileVideo, Image as ImageIcon, Loader2 } from "lucide-react";
import { mcpClientInstance } from "../../services/mcpClient";

const initialNodes: Node[] = [
  {
    id: "node-1",
    type: "input",
    data: { label: "Prompt: 'A cinematic shot of a red spaceship landing on a desert planet at sunset, photorealistic, 8k, highly detailed'" },
    position: { x: 50, y: 100 },
    style: { width: 280, borderColor: "#a855f7" },
  },
  {
    id: "node-2",
    data: { label: "Model: Imagen 3 (Default)" },
    position: { x: 380, y: 50 },
    style: { width: 220, borderColor: "#3b82f6" },
  },
  {
    id: "node-3",
    data: { label: "Settings: 16:9 | Active Workflow" },
    position: { x: 380, y: 180 },
    style: { width: 220, borderColor: "#10b981" },
  },
  {
    id: "node-4",
    type: "output",
    data: { label: "Gflow Compiler (Active Batch)" },
    position: { x: 680, y: 110 },
    style: { width: 240, borderColor: "#d9ff00", fontWeight: "bold" },
  },
];

const initialEdges: Edge[] = [
  { id: "e1-4", source: "node-1", target: "node-4", animated: true },
  { id: "e2-4", source: "node-2", target: "node-4" },
  { id: "e3-4", source: "node-3", target: "node-4" },
];

export const CanvasEditor: React.FC = () => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [outputKind, setOutputKind] = useState<"image" | "video">("image");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [quality, setQuality] = useState(30);
  const [generating, setGenerating] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  const onConnect = useCallback(
    (params: FlowConnection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleQueueGeneration = async () => {
    // Extract prompt from node-1
    const promptNode = nodes.find((n) => n.id === "node-1");
    const label = promptNode?.data.label as string;
    const prompt = label ? label.replace("Prompt: '", "").replace(/'$/, "") : "A beautiful sunset";

    setGenerating(true);
    setStatusText(`Compiling parameters...`);

    try {
      if (outputKind === "image") {
        setStatusText("Dispatching gflow_generate_image tool via SSE...");
        const result = await mcpClientInstance.callTool("gflow_generate_image", {
          prompt,
          model: "nano2",
          aspect: aspectRatio,
          count: 1,
        });
        console.log("Image generation response:", result);
        setStatusText(`Image generated successfully: ${JSON.stringify(result)}`);
      } else {
        setStatusText("Dispatching gflow_generate_video tool via SSE...");
        const result = await mcpClientInstance.callTool("gflow_generate_video", {
          prompt,
          mode: "t2v",
          aspect: aspectRatio,
        });
        console.log("Video generation response:", result);
        setStatusText(`Video generated successfully: ${JSON.stringify(result)}`);
      }
    } catch (e: any) {
      console.error(e);
      setStatusText(`Generation failed: ${e.message || e}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#070709] relative h-full">
      {/* Top action bar */}
      <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-app-bg/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-[#d9ff00]" />
          <span className="font-semibold text-sm">Visual Workflow Canvas</span>
          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
            ComfyUI-Style
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 bg-zinc-950 border border-white/10 hover:border-[#d9ff00]/40 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium interactive cursor-pointer">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Canvas
          </button>
          <button
            onClick={handleQueueGeneration}
            disabled={generating}
            className="flex items-center gap-1.5 bg-[#d9ff00] hover:bg-primary-hover text-black px-4 py-1.5 rounded-lg text-xs font-bold interactive cursor-pointer shadow-glow disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-black" />
            )}
            {generating ? "Generating..." : "Queue Generation"}
          </button>
        </div>
      </div>

      {/* React Flow node canvas */}
      <div className="flex-1 min-h-0 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          className="bg-zinc-950/20"
        >
          <Background color="#27272a" gap={16} size={1} />
          <Controls className="!bg-zinc-900 !border-white/10 !text-white [&>button]:!border-white/10 [&>button]:!bg-transparent hover:[&>button]:!bg-zinc-800" />
          <MiniMap
            bgColor="#0c0c0e"
            nodeColor={(node) => {
              if (node.type === "input") return "#a855f7";
              if (node.type === "output") return "#d9ff00";
              return "#3b82f6";
            }}
            maskColor="rgba(5, 5, 5, 0.6)"
            className="!border-white/10 !bg-zinc-900/80"
          />
        </ReactFlow>

        {/* Status indicator popup */}
        {statusText && (
          <div className="absolute bottom-4 left-4 z-10 glass-panel p-3 rounded-lg max-w-sm text-xs font-mono text-zinc-300 shadow-premium border border-[#d9ff00]/10">
            <span className="text-[#d9ff00] block mb-1">Status Report:</span>
            {statusText}
          </div>
        )}

        {/* Floating Quick Settings Panel */}
        <div className="absolute top-4 right-4 z-10 glass-panel-elevated p-4 rounded-xl w-64 shadow-premium">
          <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
            <Settings2 className="h-4 w-4 text-[#d9ff00]" />
            <h3 className="text-xs font-bold text-zinc-300">Quick Parameters</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">OUTPUT KINDS</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setOutputKind("image")}
                  className={`flex items-center justify-center gap-1.5 rounded py-1.5 text-xs font-medium cursor-pointer interactive ${
                    outputKind === "image"
                      ? "bg-[#d9ff00]/10 border border-[#d9ff00]/30 text-[#d9ff00]"
                      : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400"
                  }`}
                >
                  <ImageIcon className="h-3 w-3" />
                  Image
                </button>
                <button
                  onClick={() => setOutputKind("video")}
                  className={`flex items-center justify-center gap-1.5 rounded py-1.5 text-xs font-medium cursor-pointer interactive ${
                    outputKind === "video"
                      ? "bg-[#d9ff00]/10 border border-[#d9ff00]/30 text-[#d9ff00]"
                      : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400"
                  }`}
                >
                  <FileVideo className="h-3 w-3" />
                  Video
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">ASPECT RATIO</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-[#d9ff00]"
              >
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Portrait)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="4:3">4:3 (Traditional)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">STEPS / QUALITY</label>
              <input
                type="range"
                min="10"
                max="50"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-[#d9ff00]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
