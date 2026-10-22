/**
 * Tests for the ChatInput component.
 *
 * Verifies input behavior, character limits, suggestions,
 * send button states, and keyboard interactions.
 */
import { render, screen, fireEvent } from "@testing-library/react";

// Mock VoiceInput since it uses Web Speech API (browser-only)
jest.mock("@/components/ui/VoiceInput", () => {
  return function MockVoiceInput() {
    return <button data-testid="voice-input">Voice</button>;
  };
});

import ChatInput from "@/components/chat/ChatInput";

describe("ChatInput", () => {
  const defaultProps = {
    value: "",
    onChange: jest.fn(),
    onSend: jest.fn(),
    loading: false,
    suggestions: [],
    onSuggestionClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a textarea with placeholder", () => {
    render(<ChatInput {...defaultProps} />);
    expect(screen.getByPlaceholderText("Ask anything...")).toBeInTheDocument();
  });

  it("shows 'Thinking...' placeholder when loading", () => {
    render(<ChatInput {...defaultProps} loading={true} />);
    expect(screen.getByPlaceholderText("Thinking...")).toBeInTheDocument();
  });

  it("disables textarea when loading", () => {
    render(<ChatInput {...defaultProps} loading={true} />);
    expect(screen.getByPlaceholderText("Thinking...")).toBeDisabled();
  });

  it("calls onChange when typing (within 500 char limit)", () => {
    const onChange = jest.fn();
    render(<ChatInput {...defaultProps} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText("Ask anything..."), {
      target: { value: "Hello" },
    });
    expect(onChange).toHaveBeenCalledWith("Hello");
  });

  it("does NOT call onChange when input exceeds 500 characters", () => {
    const onChange = jest.fn();
    render(<ChatInput {...defaultProps} onChange={onChange} />);
    const longText = "x".repeat(501);
    fireEvent.change(screen.getByPlaceholderText("Ask anything..."), {
      target: { value: longText },
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls onSend when Enter is pressed (with text)", () => {
    const onSend = jest.fn();
    render(<ChatInput {...defaultProps} value="Hello" onSend={onSend} />);
    fireEvent.keyDown(screen.getByPlaceholderText("Ask anything..."), {
      key: "Enter",
      shiftKey: false,
    });
    expect(onSend).toHaveBeenCalled();
  });

  it("does NOT call onSend when Shift+Enter is pressed", () => {
    const onSend = jest.fn();
    render(<ChatInput {...defaultProps} value="Hello" onSend={onSend} />);
    fireEvent.keyDown(screen.getByPlaceholderText("Ask anything..."), {
      key: "Enter",
      shiftKey: true,
    });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("does NOT call onSend on Enter when value is empty", () => {
    const onSend = jest.fn();
    render(<ChatInput {...defaultProps} value="" onSend={onSend} />);
    fireEvent.keyDown(screen.getByPlaceholderText("Ask anything..."), {
      key: "Enter",
      shiftKey: false,
    });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("does NOT call onSend on Enter when loading", () => {
    const onSend = jest.fn();
    render(<ChatInput {...defaultProps} value="Hello" loading={true} onSend={onSend} />);
    fireEvent.keyDown(screen.getByPlaceholderText("Thinking..."), {
      key: "Enter",
      shiftKey: false,
    });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("renders suggestion chips when provided", () => {
    render(
      <ChatInput
        {...defaultProps}
        suggestions={["What is my risk score?", "Explain telematics"]}
      />
    );
    expect(screen.getByText("What is my risk score?")).toBeInTheDocument();
    expect(screen.getByText("Explain telematics")).toBeInTheDocument();
  });

  it("calls onSuggestionClick when a chip is clicked", () => {
    const onSuggestionClick = jest.fn();
    render(
      <ChatInput
        {...defaultProps}
        suggestions={["What is my risk score?"]}
        onSuggestionClick={onSuggestionClick}
      />
    );
    fireEvent.click(screen.getByText("What is my risk score?"));
    expect(onSuggestionClick).toHaveBeenCalledWith("What is my risk score?");
  });

  it("does not render suggestion chips when list is empty", () => {
    const { container } = render(<ChatInput {...defaultProps} suggestions={[]} />);
    // No chip buttons should be rendered (only send + voice buttons exist)
    const buttons = container.querySelectorAll("button");
    // Voice mock + send button = 2
    expect(buttons.length).toBe(2);
  });

  it("shows character count when value exceeds 400 characters", () => {
    const text = "x".repeat(420);
    render(<ChatInput {...defaultProps} value={text} />);
    expect(screen.getByText("420/500")).toBeInTheDocument();
  });

  it("does NOT show character count when value is under 400", () => {
    render(<ChatInput {...defaultProps} value="short text" />);
    expect(screen.queryByText(/\/500/)).not.toBeInTheDocument();
  });

  it("renders the voice input component", () => {
    render(<ChatInput {...defaultProps} />);
    expect(screen.getByTestId("voice-input")).toBeInTheDocument();
  });
});
