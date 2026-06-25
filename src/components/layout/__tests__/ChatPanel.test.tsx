import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { ChatPanel } from "../ChatPanel";
import { mcpClientInstance } from "../../../services/mcpClient";

describe("ChatPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should load mock characters by default and fetch characters from the daemon", async () => {
    const listCharactersSpy = vi
      .spyOn(mcpClientInstance, "callTool")
      .mockResolvedValue({
        status: "ok",
        characters: [
          {
            entity_id: "daemon-char-1",
            display_name: "Daemon Character",
            voice: "Zephyr",
            personality: "Friendly companion",
          },
        ],
      });

    render(<ChatPanel />);

    // Check that daemon character was fetched and rendered
    await waitFor(() => {
      expect(listCharactersSpy).toHaveBeenCalledWith("gflow_list_characters", {
        profile: "default",
      });
      expect(screen.getAllByText("Daemon Character")[0]).toBeInTheDocument();
    });
  });

  it("should fall back to local templates if daemon call fails", async () => {
    vi.spyOn(mcpClientInstance, "callTool").mockRejectedValue(
      new Error("Daemon Offline"),
    );

    render(<ChatPanel />);

    // Should render mock characters from fallback list
    await waitFor(() => {
      expect(
        screen.getAllByText("Anya - Cyberpunk Ranger")[0],
      ).toBeInTheDocument();
      expect(
        screen.getAllByText("Marcus - Ancient Scholar")[0],
      ).toBeInTheDocument();
    });
  });

  it("should allow selecting different characters and viewing respective conversation logs", async () => {
    vi.spyOn(mcpClientInstance, "callTool").mockRejectedValue(
      new Error("Offline"),
    );
    render(<ChatPanel />);

    await waitFor(() => {
      expect(
        screen.getAllByText("Anya - Cyberpunk Ranger")[0],
      ).toBeInTheDocument();
    });

    // Default character conversation messages
    expect(
      screen.getByText(
        "System diagnostics clear. Rangefinder operational. What coordinates are we scanning next?",
      ),
    ).toBeInTheDocument();

    // Click on Marcus character
    const marcusBtn = screen.getByRole("button", {
      name: /Marcus - Ancient Scholar/i,
    });
    fireEvent.click(marcusBtn);

    // Conversation log shifts to Marcus
    expect(
      screen.getByText(
        "Salutations, traveler. The scrolls are laid out, and the ink is fresh. Which era shall we discuss?",
      ),
    ).toBeInTheDocument();
  });

  it("should send a user message and receive simulated character reply", async () => {
    render(<ChatPanel />);

    await waitFor(() => {
      expect(
        screen.getAllByText("Anya - Cyberpunk Ranger")[0],
      ).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/chat with Anya/i);
    const sendBtn = screen.getByRole("button", { name: "" }); // send icon button

    fireEvent.change(input, { target: { value: "Hello Anya" } });

    vi.useFakeTimers();
    fireEvent.click(sendBtn);

    expect(screen.getByText("Hello Anya")).toBeInTheDocument();

    // Fast-forward simulated reply timer
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(
      screen.getByText(
        "Understood. Adjusting telemetry. Sensors are locking onto your request.",
      ),
    ).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("should forge a new character locally using form integration", async () => {
    vi.spyOn(mcpClientInstance, "callTool").mockRejectedValue(
      new Error("Offline"),
    );
    render(<ChatPanel />);

    await waitFor(() => {
      expect(
        screen.getAllByText("Anya - Cyberpunk Ranger")[0],
      ).toBeInTheDocument();
    });

    // Click forge button "+"
    const forgeBtn = screen.getByTitle("Create Character");
    fireEvent.click(forgeBtn);

    // Form inputs should be visible
    const nameInput = screen.getByLabelText(/character name/i);
    const voiceSelect = screen.getByLabelText(/tts voice/i);
    const personalityInput = screen.getByLabelText(/personality protocol/i);
    const submitBtn = screen.getByRole("button", {
      name: /synthesize character/i,
    });

    fireEvent.change(nameInput, { target: { value: "Neo AI" } });
    fireEvent.change(voiceSelect, { target: { value: "Zephyr" } });
    fireEvent.change(personalityInput, { target: { value: "Mysterious" } });
    fireEvent.submit(submitBtn);

    // The new character should be selected
    expect(screen.getAllByText("Neo AI")[0]).toBeInTheDocument();
    expect(
      screen.getByText("Greetings! I am Neo AI. Ready to assist."),
    ).toBeInTheDocument();
  });

  it("should delete selected character and switch to remaining", async () => {
    vi.spyOn(mcpClientInstance, "callTool").mockRejectedValue(
      new Error("Offline"),
    );
    render(<ChatPanel />);

    await waitFor(() => {
      expect(
        screen.getAllByText("Anya - Cyberpunk Ranger")[0],
      ).toBeInTheDocument();
    });

    // Delete character
    const deleteBtn = screen.getByTitle("Delete Character");
    fireEvent.click(deleteBtn);

    // Anya should be deleted, so Marcus becomes active
    expect(screen.queryByText("Anya - Cyberpunk Ranger")).toBeNull();
    expect(
      screen.getAllByText("Marcus - Ancient Scholar")[0],
    ).toBeInTheDocument();
  });
});
