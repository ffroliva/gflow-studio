import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { ErrorBoundary } from "../ErrorBoundary";

const ThrowComponent = () => {
  throw new Error("Test Component Crash");
};

describe("ErrorBoundary", () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Suppress console.error output during throwing component tests
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should render children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Happy Component</div>
      </ErrorBoundary>,
    );

    expect(screen.getByTestId("child")).toHaveTextContent("Happy Component");
  });

  it("should render fallback prop when error is caught", () => {
    render(
      <ErrorBoundary
        fallback={<div data-testid="fallback">Custom Fallback</div>}
      >
        <ThrowComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId("fallback")).toHaveTextContent("Custom Fallback");
  });

  it("should render default crash page with error message when no fallback prop is provided", () => {
    render(
      <ErrorBoundary>
        <ThrowComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Studio Component Crashed")).toBeInTheDocument();
    expect(screen.getByText("Test Component Crash")).toBeInTheDocument();
  });

  it("should attempt to reload location when reload button is clicked", () => {
    // Mock window.location.reload
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: reloadMock },
    });

    render(
      <ErrorBoundary>
        <ThrowComponent />
      </ErrorBoundary>,
    );

    const button = screen.getByRole("button", { name: /reload studio/i });
    fireEvent.click(button);

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});
