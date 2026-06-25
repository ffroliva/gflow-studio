import React, { useState, useEffect } from "react";
import { MessageSquare, Plus, Send, Volume2, User2, Trash2, Mic } from "lucide-react";
import { CharacterRecord } from "../../types/api";
import { mcpClientInstance } from "../../services/mcpClient";

const mockCharacters: CharacterRecord[] = [
  {
    id: "char-1",
    profile_name: "default",
    flow_project_id: "proj-1",
    flow_character_id: "char-wire-1",
    display_name: "Anya - Cyberpunk Ranger",
    voice: "Sulafat",
    personality: "Determined, analytical, speaks in tech jargon, dry humor.",
    created_at: new Date().toISOString(),
  },
  {
    id: "char-2",
    profile_name: "default",
    flow_project_id: "proj-1",
    flow_character_id: "char-wire-2",
    display_name: "Marcus - Ancient Scholar",
    voice: "Charon",
    personality: "Wise, slow-speaking, rich vocabulary, referencing ancient stars.",
    created_at: new Date().toISOString(),
  },
];

interface Message {
  sender: "user" | "character";
  text: string;
  timestamp: string;
  hasAudio?: boolean;
}

export const ChatPanel: React.FC = () => {
  const [characters, setCharacters] = useState<CharacterRecord[]>(mockCharacters);
  const [selectedChar, setSelectedChar] = useState<CharacterRecord>(mockCharacters[0]);

  // Load characters via FastMCP daemon if connected
  useEffect(() => {
    const fetchRealCharacters = async () => {
      try {
        const response = await mcpClientInstance.callTool("gflow_list_characters", {
          profile: "default"
        });
        if (response && response.status === "ok" && Array.isArray(response.characters) && response.characters.length > 0) {
          // Map to match character records
          const mapped: CharacterRecord[] = response.characters.map((c: any) => ({
            id: c.entity_id || `char-${Date.now()}`,
            profile_name: "default",
            flow_project_id: c.project_id || "default",
            flow_character_id: c.entity_id,
            display_name: c.display_name,
            voice: c.voice,
            personality: c.personality,
            created_at: new Date().toISOString()
          }));
          setCharacters(mapped);
          setSelectedChar(mapped[0]);
        }
      } catch (err) {
        console.warn("Failed to fetch characters via MCP daemon, using fallback templates:", err);
      }
    };

    fetchRealCharacters();
  }, []);
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    "char-1": [
      { sender: "character", text: "System diagnostics clear. Rangefinder operational. What coordinates are we scanning next?", timestamp: "12:04 PM" },
      { sender: "user", text: "Tell me about the sector we just entered.", timestamp: "12:05 PM" },
      { sender: "character", text: "High electromagnetic interference. Ruins of a pre-collapse server stack are located at heading 240. I advise caution.", timestamp: "12:05 PM", hasAudio: true },
    ],
    "char-2": [
      { sender: "character", text: "Salutations, traveler. The scrolls are laid out, and the ink is fresh. Which era shall we discuss?", timestamp: "Yesterday" },
    ],
  });
  
  const [inputVal, setInputVal] = useState("");
  const [newCharName, setNewCharName] = useState("");
  const [newCharVoice, setNewCharVoice] = useState("Sulafat");
  const [newCharPersonality, setNewCharPersonality] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const activeMessages = messages[selectedChar.id] || [];

  const handleSend = () => {
    if (!inputVal.trim()) return;
    const newMsg: Message = { sender: "user", text: inputVal, timestamp: "Just now" };
    
    setMessages(prev => ({
      ...prev,
      [selectedChar.id]: [...(prev[selectedChar.id] || []), newMsg]
    }));
    setInputVal("");

    // Simulate character response
    setTimeout(() => {
      const replies: Record<string, string> = {
        "char-1": "Understood. Adjusting telemetry. Sensors are locking onto your request.",
        "char-2": "Ah, that is a question of profound depths. Let us look to the stellar maps.",
      };
      
      const charReply: Message = {
        sender: "character",
        text: replies[selectedChar.id] || "I am parsing your input.",
        timestamp: "Just now",
        hasAudio: true
      };

      setMessages(prev => ({
        ...prev,
        [selectedChar.id]: [...(prev[selectedChar.id] || []), charReply]
      }));
    }, 1000);
  };

  const handleCreateCharacter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) return;

    const newChar: CharacterRecord = {
      id: `char-${Date.now()}`,
      profile_name: "default",
      flow_project_id: "proj-1",
      flow_character_id: `char-wire-${Date.now()}`,
      display_name: newCharName,
      voice: newCharVoice,
      personality: newCharPersonality,
      created_at: new Date().toISOString(),
    };

    setCharacters([...characters, newChar]);
    setSelectedChar(newChar);
    setMessages(prev => ({
      ...prev,
      [newChar.id]: [{ sender: "character", text: `Greetings! I am ${newCharName}. Ready to assist.`, timestamp: "Just now" }]
    }));

    setNewCharName("");
    setNewCharPersonality("");
    setIsCreating(false);
  };

  return (
    <div className="flex-1 flex min-w-0 bg-[#070709] h-full overflow-hidden">
      {/* Characters List Sidebar (Open-Poe style) */}
      <div className="w-72 border-r border-white/5 bg-app-bg flex flex-col shrink-0">
        <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#d9ff00]" />
            <span className="font-semibold text-sm">Flow Characters</span>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="h-7 w-7 rounded-lg bg-zinc-900 border border-white/10 hover:border-[#d9ff00]/40 flex items-center justify-center text-zinc-300 hover:text-white interactive cursor-pointer"
            title="Create Character"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {characters.map(char => {
            const isSelected = char.id === selectedChar.id;
            return (
              <button
                key={char.id}
                onClick={() => {
                  setSelectedChar(char);
                  setIsCreating(false);
                }}
                className={`w-full text-left p-3 rounded-xl transition-all border cursor-pointer ${
                  isSelected 
                    ? "bg-[#d9ff00]/5 border-[#d9ff00]/30 shadow-glow-accent" 
                    : "bg-transparent border-transparent hover:bg-zinc-900/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-[#d9ff00]/80">
                    <User2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm truncate text-zinc-200">{char.display_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Volume2 className="h-3 w-3 text-zinc-500" />
                      <span className="text-[10px] text-zinc-500 truncate font-mono">{char.voice || "No voice"}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main chat surface / creation screen */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#070709] h-full relative">
        {isCreating ? (
          <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
            <form onSubmit={handleCreateCharacter} className="w-full max-w-md glass-panel-elevated p-6 rounded-2xl shadow-premium relative">
              <h2 className="text-base font-bold mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                <Mic className="h-4 w-4 text-[#d9ff00]" />
                Forge Flow Character
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">CHARACTER NAME</label>
                  <input
                    type="text"
                    required
                    value={newCharName}
                    onChange={e => setNewCharName(e.target.value)}
                    placeholder="E.g. Anya - Cyberpunk Ranger"
                    className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#d9ff00]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">TTS VOICE</label>
                  <select
                    value={newCharVoice}
                    onChange={e => setNewCharVoice(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-[#d9ff00]"
                  >
                    <option value="Sulafat">Sulafat (Female, warm)</option>
                    <option value="Charon">Charon (Male, informative)</option>
                    <option value="Leda">Leda (Female, youthful)</option>
                    <option value="Zephyr">Zephyr (Female, bright)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">PERSONALITY PROTOCOL</label>
                  <textarea
                    rows={3}
                    value={newCharPersonality}
                    onChange={e => setNewCharPersonality(e.target.value)}
                    placeholder="Instructions guiding response style, accent, quirks..."
                    className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#d9ff00] resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 mt-6 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="bg-transparent border border-white/10 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 px-4 py-2 rounded-lg text-xs font-semibold interactive cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#d9ff00] hover:bg-primary-hover text-black px-4 py-2 rounded-lg text-xs font-bold interactive cursor-pointer shadow-glow"
                >
                  Synthesize Character
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Header info */}
            <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-app-bg/85 z-10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{selectedChar.display_name}</span>
                <span className="text-[10px] text-zinc-500 font-mono">({selectedChar.voice})</span>
              </div>
              <button 
                onClick={() => {
                  if (characters.length <= 1) return;
                  const remain = characters.filter(c => c.id !== selectedChar.id);
                  setCharacters(remain);
                  setSelectedChar(remain[0]);
                }}
                className="h-8 w-8 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 flex items-center justify-center interactive cursor-pointer"
                title="Delete Character"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Conversation Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="max-w-xl mx-auto space-y-4">
                {activeMessages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.sender === "user" 
                          ? "bg-zinc-800 text-zinc-100" 
                          : "bg-zinc-900/50 text-zinc-200 border border-white/5"
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                      
                      {msg.hasAudio && (
                        <div className="mt-2.5 flex items-center gap-2 border-t border-white/5 pt-2 text-[10px] text-zinc-400">
                          <button className="flex items-center gap-1 bg-[#d9ff00]/10 hover:bg-[#d9ff00]/20 text-[#d9ff00] border border-[#d9ff00]/30 rounded-full px-2 py-0.5 interactive cursor-pointer font-mono">
                            <Volume2 className="h-3 w-3" />
                            Listen TTS
                          </button>
                          <span>{selectedChar.voice}.wav</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-zinc-600 mt-1 px-1 font-mono">{msg.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Input Bar */}
            <div className="p-4 border-t border-white/5 bg-app-bg shrink-0">
              <div className="max-w-xl mx-auto flex gap-2">
                <input
                  type="text"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder={`Chat with ${selectedChar.display_name.split(" - ")[0]}...`}
                  className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#d9ff00]"
                />
                <button 
                  onClick={handleSend}
                  className="h-10 w-10 bg-[#d9ff00] hover:bg-primary-hover text-black rounded-xl flex items-center justify-center interactive cursor-pointer shadow-glow shrink-0"
                >
                  <Send className="h-4 w-4 fill-black" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
