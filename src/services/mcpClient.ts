
interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: any;
  id: number;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: number;
}

class McpClient {
  private eventSource: EventSource | null = null;
  private postUrl: string | null = null;
  private nextId = 1;
  private pendingRequests = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();
  private onStatusChange: ((connected: boolean) => void) | null = null;

  constructor() {}

  public connect(url: string, onStatus: (connected: boolean) => void) {
    this.onStatusChange = onStatus;
    this.disconnect();

    try {
      // Connect to the SSE endpoint (e.g., http://127.0.0.1:8000/sse)
      const sseUrl = url.endsWith("/sse") ? url : `${url}/sse`;
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.addEventListener("connect", (event: MessageEvent) => {
        // The connect event contains the URL endpoint for sending client messages
        const relativePath = event.data;
        // Construct full post URL
        const base = url.endsWith("/") ? url.slice(0, -1) : url;
        this.postUrl = relativePath.startsWith("http") ? relativePath : `${base}${relativePath}`;
        this.onStatusChange?.(true);
      });

      this.eventSource.addEventListener("message", (event: MessageEvent) => {
        try {
          const response = JSON.parse(event.data) as JsonRpcResponse;
          if (response.id !== undefined) {
            const pending = this.pendingRequests.get(response.id);
            if (pending) {
              this.pendingRequests.delete(response.id);
              if (response.error) {
                pending.reject(new Error(response.error.message));
              } else {
                pending.resolve(response.result);
              }
            }
          }
        } catch (e) {
          console.error("Failed to parse message event:", e);
        }
      });

      this.eventSource.onerror = (e) => {
        console.error("MCP EventSource error:", e);
        this.disconnect();
      };
    } catch (e) {
      console.error("MCP connection failed:", e);
      this.onStatusChange?.(false);
    }
  }

  public disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.postUrl = null;
    this.onStatusChange?.(false);

    // Reject all pending requests
    for (const [, pending] of this.pendingRequests.entries()) {
      pending.reject(new Error("Connection disconnected"));
    }
    this.pendingRequests.clear();
  }

  public async callTool(name: string, args: any = {}): Promise<any> {
    if (!this.postUrl) {
      throw new Error("MCP client is not connected");
    }

    const id = this.nextId++;
    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name,
        arguments: args,
      },
      id,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      fetch(this.postUrl!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }).catch((err) => {
        this.pendingRequests.delete(id);
        reject(err);
      });
    });
  }

  public async listTools(): Promise<any> {
    if (!this.postUrl) {
      throw new Error("MCP client is not connected");
    }

    const id = this.nextId++;
    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      method: "tools/list",
      id,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      fetch(this.postUrl!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }).catch((err) => {
        this.pendingRequests.delete(id);
        reject(err);
      });
    });
  }
}

export const mcpClientInstance = new McpClient();
