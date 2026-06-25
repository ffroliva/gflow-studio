import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { CanvasEditor } from "../CanvasEditor";
import { mcpClientInstance } from "../../../services/mcpClient";

describe("CanvasEditor", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should render action buttons, headers, and quick parameters", () => {
    render(<CanvasEditor />);

    expect(screen.getByText("Visual Workflow Canvas")).toBeInTheDocument();
    expect(screen.getByText("ComfyUI-Style")).toBeInTheDocument();
    expect(screen.getByText("Reset Canvas")).toBeInTheDocument();
    expect(screen.getByText("Queue Generation")).toBeInTheDocument();
    expect(screen.getByText("Quick Parameters")).toBeInTheDocument();
  });

  it("should toggle output kind when clicked", () => {
    render(<CanvasEditor />);

    const imageBtn = screen.getByRole("button", { name: /image/i });
    const videoBtn = screen.getByRole("button", { name: /video/i });

    // Click Video button
    fireEvent.click(videoBtn);
    expect(videoBtn).toHaveClass("bg-[#d9ff00]/10");
    expect(imageBtn).not.toHaveClass("bg-[#d9ff00]/10");

    // Click Image button
    fireEvent.click(imageBtn);
    expect(imageBtn).toHaveClass("bg-[#d9ff00]/10");
    expect(videoBtn).not.toHaveClass("bg-[#d9ff00]/10");
  });

  it("should trigger gflow_generate_image via MCP client when Queue Generation is clicked for image", async () => {
    const generateSpy = vi
      .spyOn(mcpClientInstance, "callTool")
      .mockResolvedValue({
        status: "ok",
        flow_media_id: "imagen-media-xyz",
      });

    render(<CanvasEditor />);

    // Click Queue Generation
    const queueBtn = screen.getByRole("button", { name: /queue generation/i });
    fireEvent.click(queueBtn);

    // Should call mcp generate image
    expect(generateSpy).toHaveBeenCalledWith("gflow_generate_image", {
      prompt:
        "A cinematic shot of a red spaceship landing on a desert planet at sunset, photorealistic, 8k, highly detailed",
      model: "nano2",
      aspect: "16:9",
      count: 1,
    });

    // Check status panel text
    await waitFor(() => {
      expect(
        screen.getByText(/Image generated successfully/i),
      ).toBeInTheDocument();
    });
  });

  it("should trigger gflow_generate_video via MCP client when Queue Generation is clicked for video", async () => {
    const generateSpy = vi
      .spyOn(mcpClientInstance, "callTool")
      .mockResolvedValue({
        status: "ok",
        flow_media_id: "veo-media-xyz",
      });

    render(<CanvasEditor />);

    // Switch to video
    const videoBtn = screen.getByRole("button", { name: /video/i });
    fireEvent.click(videoBtn);

    // Click Queue Generation
    const queueBtn = screen.getByRole("button", { name: /queue generation/i });
    fireEvent.click(queueBtn);

    // Should call mcp generate video
    expect(generateSpy).toHaveBeenCalledWith("gflow_generate_video", {
      prompt:
        "A cinematic shot of a red spaceship landing on a desert planet at sunset, photorealistic, 8k, highly detailed",
      mode: "t2v",
      aspect: "16:9",
    });

    // Check status panel text
    await waitFor(() => {
      expect(
        screen.getByText(/Video generated successfully/i),
      ).toBeInTheDocument();
    });
  });

  it("should display error message on generation failure", async () => {
    vi.spyOn(mcpClientInstance, "callTool").mockRejectedValue(
      new Error("Quota Exceeded"),
    );

    render(<CanvasEditor />);

    const queueBtn = screen.getByRole("button", { name: /queue generation/i });
    fireEvent.click(queueBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Generation failed: Quota Exceeded/i),
      ).toBeInTheDocument();
    });
  });
});
