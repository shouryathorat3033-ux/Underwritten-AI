/**
 * Tests for the RiskGauge component.
 *
 * Verifies that the gauge renders correctly for different risk levels,
 * displays the right label, and handles edge cases.
 */
import { render, screen } from "@testing-library/react";
import RiskGauge from "@/components/ui/RiskGauge";

// Mock requestAnimationFrame to resolve immediately for testing
beforeEach(() => {
  let id = 0;
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    id++;
    // Call with a large timestamp so animation completes instantly
    cb(performance.now() + 2000);
    return id;
  });
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
});

afterEach(() => {
  window.requestAnimationFrame.mockRestore();
  window.cancelAnimationFrame.mockRestore();
});

describe("RiskGauge", () => {
  it("renders an SVG element", () => {
    const { container } = render(<RiskGauge score={50} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("displays the score text in the gauge", () => {
    const { container } = render(<RiskGauge score={42} />);
    const texts = container.querySelectorAll("text");
    const scoreTexts = Array.from(texts).map((t) => t.textContent);
    // The animated score should reach 42
    expect(scoreTexts).toContain("42");
  });

  it("shows 'LOW RISK' label for scores <= 35", () => {
    const { container } = render(<RiskGauge score={20} />);
    const texts = Array.from(container.querySelectorAll("text")).map((t) => t.textContent);
    expect(texts).toContain("LOW RISK");
  });

  it("shows 'MODERATE' label for scores 36-55", () => {
    const { container } = render(<RiskGauge score={45} />);
    const texts = Array.from(container.querySelectorAll("text")).map((t) => t.textContent);
    expect(texts).toContain("MODERATE");
  });

  it("shows 'HIGH RISK' label for scores 56-75", () => {
    const { container } = render(<RiskGauge score={65} />);
    const texts = Array.from(container.querySelectorAll("text")).map((t) => t.textContent);
    expect(texts).toContain("HIGH RISK");
  });

  it("shows 'CRITICAL' label for scores > 75", () => {
    const { container } = render(<RiskGauge score={90} />);
    const texts = Array.from(container.querySelectorAll("text")).map((t) => t.textContent);
    expect(texts).toContain("CRITICAL");
  });

  it("renders tick marks at 0, 25, 50, 75, 100", () => {
    const { container } = render(<RiskGauge score={50} />);
    const texts = Array.from(container.querySelectorAll("text")).map((t) => t.textContent);
    expect(texts).toContain("0");
    expect(texts).toContain("25");
    expect(texts).toContain("50");
    expect(texts).toContain("75");
    expect(texts).toContain("100");
  });

  it("renders with a custom size", () => {
    const { container } = render(<RiskGauge score={50} size={300} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "300");
  });

  it("renders the needle polygon", () => {
    const { container } = render(<RiskGauge score={50} />);
    expect(container.querySelector("polygon")).toBeInTheDocument();
  });

  it("renders the center hub circle", () => {
    const { container } = render(<RiskGauge score={50} />);
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBeGreaterThan(0);
  });

  it("handles a score of 0", () => {
    const { container } = render(<RiskGauge score={0} />);
    const texts = Array.from(container.querySelectorAll("text")).map((t) => t.textContent);
    expect(texts).toContain("0");
    expect(texts).toContain("LOW RISK");
  });

  it("handles a score of 100", () => {
    const { container } = render(<RiskGauge score={100} />);
    const texts = Array.from(container.querySelectorAll("text")).map((t) => t.textContent);
    expect(texts).toContain("100");
    expect(texts).toContain("CRITICAL");
  });
});
