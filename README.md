# 🎨 Gflow Studio

Gflow Studio is a state-of-the-art desktop filmmaking client for Google Flow (Veo/Imagen). It provides a visual and interactive timeline compositor, character management systems, and workflow configurations to drive generations.

## Tech Stack & Architecture

- **Shell**: Tauri 2 (Rust)
- **Frontend**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand 5 + TanStack Query 5
- **Visual Nodes Canvas**: `@xyflow/react` (ComfyUI inspired)
- **Chat Interface**: Custom Persona & TTS generator (Open-Poe-AI inspired)
- **Local Cache & Storage**: SQLite database (via `rusqlite` WAL mode) reading from `gflow-cli`

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust & Cargo](https://rustup.rs/) (v1.75+)
- [gflow-cli](https://github.com/ffroliva/gflow-cli) (installed and authorized)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the Tauri development environment:
   ```bash
   npm run tauri dev
   ```

3. Build production bundle:
   ```bash
   npm run tauri build
   ```

## Integration with gflow-cli

Gflow Studio reads generations, assets, and character metadata directly from the local SQLite database (`gflow.db`) created by `gflow-cli`. It interacts with the live REST API via the `gflow-cli` FastMCP/SSE daemon connection.
