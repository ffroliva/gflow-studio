import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full w-full items-center justify-center p-6 bg-app-bg text-[#f4f4f6]">
          <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-red-500/30 bg-card-bg p-6 shadow-premium">
            {/* Ambient background glow */}
            <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full bg-red-500/10 blur-3xl" />
            
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-red-400">
                Studio Component Crashed
              </h2>
              <p className="mt-2 text-sm text-[#a1a1aa] line-clamp-3">
                {this.state.error?.message || "An unexpected rendering error occurred inside Gflow Studio."}
              </p>
              
              <button
                onClick={this.handleReset}
                className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-4 py-2 text-sm font-medium transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Studio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
