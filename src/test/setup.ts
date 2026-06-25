import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Tauri's API core module so tests do not try to access native systems
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(async (cmd, _args) => {
    if (cmd === "fetch_assets") {
      return [
        {
          id: "asset-1",
          profile_name: "default",
          flow_media_id: "media-mock-1",
          kind: "video",
          status: "completed",
          created_at: new Date().toISOString(),
        },
      ];
    }
    if (cmd === "fetch_characters") {
      return [];
    }
    if (cmd === "get_daemon_status") {
      return "online";
    }
    if (cmd === "resolve_default_db_path") {
      return "C:\\mock\\gflow.db";
    }
    return null;
  }),
}));

// Mock EventSource for MCP Client
class MockEventSource {
  public url: string;
  private listeners: Record<string, Function[]> = {};

  constructor(url: string) {
    this.url = url;
    // Simulate connection event
    setTimeout(() => {
      this.trigger("connect", { data: "/message?session=1" });
    }, 10);
  }

  public addEventListener(type: string, listener: Function) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  public close() {}

  private trigger(type: string, data: any) {
    const list = this.listeners[type] || [];
    for (const f of list) {
      f(data);
    }
  }
}

global.EventSource = MockEventSource as any;

// Stub window properties for responsive grids / media query tests
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for React Flow / XYFlow layouts
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver;
