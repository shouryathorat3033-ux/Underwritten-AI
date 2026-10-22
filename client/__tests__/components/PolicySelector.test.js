/**
 * Tests for the PolicySelector component.
 * Renders 4 policy type cards and demo scenario buttons.
 */
import { render, screen, fireEvent } from "@testing-library/react";

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { name: "Test User", email: "test@test.com" } }, status: "authenticated" }),
}));

// Mock routes helper
jest.mock("@/lib/routes", () => ({
  useDashboardBase: () => "/applicant/dashboard",
}));

import PolicySelector from "@/components/assess/PolicySelector";

const policyTypes = [
  { id: "health", label: "Health", full: "Health Insurance", desc: "Medical data", icon: null, color: "#10b981", gradient: "linear-gradient(135deg, #10b981, #059669)" },
  { id: "auto", label: "Auto", full: "Auto Insurance", desc: "Vehicle data", icon: null, color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
  { id: "life", label: "Life", full: "Life Insurance", desc: "Life data", icon: null, color: "#ef4444", gradient: "linear-gradient(135deg, #ef4444, #dc2626)" },
  { id: "property", label: "Property", full: "Property Insurance", desc: "Property data", icon: null, color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
];

describe("PolicySelector", () => {
  const mockSelect = jest.fn();
  const mockDemo = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all 4 policy type cards", () => {
    render(<PolicySelector policyTypes={policyTypes} onSelectPolicy={mockSelect} onDemoScenario={mockDemo} />);
    expect(screen.getByText("Health Insurance")).toBeInTheDocument();
    expect(screen.getByText("Auto Insurance")).toBeInTheDocument();
    expect(screen.getByText("Life Insurance")).toBeInTheDocument();
    expect(screen.getByText("Property Insurance")).toBeInTheDocument();
  });

  it("renders 4 Start Assessment CTAs", () => {
    render(<PolicySelector policyTypes={policyTypes} onSelectPolicy={mockSelect} onDemoScenario={mockDemo} />);
    const ctas = screen.getAllByText(/Start Assessment/);
    expect(ctas).toHaveLength(4);
  });

  it("calls onSelectPolicy with correct id when clicked", () => {
    render(<PolicySelector policyTypes={policyTypes} onSelectPolicy={mockSelect} onDemoScenario={mockDemo} />);
    fireEvent.click(screen.getByText("Health Insurance"));
    expect(mockSelect).toHaveBeenCalledWith("health");
  });

  it("renders all 4 demo scenario buttons", () => {
    render(<PolicySelector policyTypes={policyTypes} onSelectPolicy={mockSelect} onDemoScenario={mockDemo} />);
    expect(screen.getByText("Low Risk (Health)")).toBeInTheDocument();
    expect(screen.getByText("High Risk (Health)")).toBeInTheDocument();
    expect(screen.getByText("Young Driver (Auto)")).toBeInTheDocument();
    expect(screen.getByText("Safe Driver (Auto)")).toBeInTheDocument();
  });

  it("calls onDemoScenario when demo button is clicked", () => {
    render(<PolicySelector policyTypes={policyTypes} onSelectPolicy={mockSelect} onDemoScenario={mockDemo} />);
    fireEvent.click(screen.getByText("Low Risk (Health)"));
    expect(mockDemo).toHaveBeenCalledWith("health", expect.any(Object));
  });

  it("greets the user by first name", () => {
    render(<PolicySelector policyTypes={policyTypes} onSelectPolicy={mockSelect} onDemoScenario={mockDemo} />);
    expect(screen.getByText(/Test\?$/)).toBeInTheDocument();
  });

  it("shows trust signals", () => {
    render(<PolicySelector policyTypes={policyTypes} onSelectPolicy={mockSelect} onDemoScenario={mockDemo} />);
    expect(screen.getByText("AI-Powered Scoring")).toBeInTheDocument();
    expect(screen.getByText("Results in Seconds")).toBeInTheDocument();
  });
});
