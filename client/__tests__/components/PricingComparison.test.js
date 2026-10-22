/**
 * Tests for the PricingComparison component.
 *
 * Verifies that traditional vs AI pricing is displayed correctly,
 * including savings messaging for low-risk applicants and higher-premium
 * messaging for high-risk applicants.
 */
import { render, screen } from "@testing-library/react";
import PricingComparison from "@/components/ui/PricingComparison";

describe("PricingComparison", () => {
  it("returns null when premium is missing", () => {
    const { container } = render(
      <PricingComparison riskScore={30} decision="approved" premium={null} policyType="health" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("returns null when riskScore is missing", () => {
    const { container } = render(
      <PricingComparison riskScore={null} decision="approved" premium={{ min: 5000, max: 8000 }} policyType="health" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders both traditional and AI pricing sections", () => {
    render(
      <PricingComparison
        riskScore={25}
        decision="approved"
        premium={{ min: 5000, max: 8000 }}
        policyType="health"
      />
    );

    expect(screen.getByText("Traditional Flat Rate")).toBeInTheDocument();
    expect(screen.getByText("AI Personalized")).toBeInTheDocument();
  });

  it("renders the section heading", () => {
    render(
      <PricingComparison
        riskScore={25}
        decision="approved"
        premium={{ min: 5000, max: 8000 }}
        policyType="health"
      />
    );

    expect(screen.getByText(/Premium: Traditional vs AI Pricing/)).toBeInTheDocument();
  });

  it("shows savings message for low-risk applicants (AI premium < traditional)", () => {
    // Health flat rate: low=12000, high=25000 => mid=18500
    // AI premium: min=5000, max=8000 => mid=6500
    // savings = 18500 - 6500 = 12000 > 0, so isOverpriced = true => savings message
    render(
      <PricingComparison
        riskScore={25}
        decision="approved"
        premium={{ min: 5000, max: 8000 }}
        policyType="health"
      />
    );

    expect(screen.getByText(/save money/i)).toBeInTheDocument();
    expect(screen.getByText(/saved/i)).toBeInTheDocument();
    expect(screen.getByText(/overcharged/i)).toBeInTheDocument();
  });

  it("shows higher premium message for high-risk applicants (AI premium > traditional)", () => {
    // Health flat rate: low=12000, high=25000 => mid=18500
    // AI premium: min=22000, max=35000 => mid=28500
    // savings = 18500 - 28500 = -10000 < 0, so isOverpriced = false => higher premium message
    render(
      <PricingComparison
        riskScore={85}
        decision="review"
        premium={{ min: 22000, max: 35000 }}
        policyType="health"
      />
    );

    expect(screen.getByText(/accurate premiums/i)).toBeInTheDocument();
    expect(screen.getByText(/more/i)).toBeInTheDocument();
    expect(screen.getByText(/underpriced/i)).toBeInTheDocument();
  });

  it("displays the risk score in the AI pricing section", () => {
    render(
      <PricingComparison
        riskScore={42}
        decision="approved"
        premium={{ min: 8000, max: 12000 }}
        policyType="health"
      />
    );

    expect(screen.getByText(/42\/100/)).toBeInTheDocument();
  });

  it("displays the correct traditional range for auto policy type", () => {
    // Auto flat rate: low=15000, high=35000
    render(
      <PricingComparison
        riskScore={30}
        decision="approved"
        premium={{ min: 8000, max: 12000 }}
        policyType="auto"
      />
    );

    // The traditional rate range for auto is 15,000-35,000
    expect(screen.getAllByText(/15,000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/35,000/).length).toBeGreaterThan(0);
  });

  it("displays the correct traditional range for life policy type", () => {
    // Life flat rate: low=10000, high=22000
    render(
      <PricingComparison
        riskScore={30}
        decision="approved"
        premium={{ min: 5000, max: 8000 }}
        policyType="life"
      />
    );

    expect(screen.getByText(/10,000/)).toBeInTheDocument();
    expect(screen.getByText(/22,000/)).toBeInTheDocument();
  });

  it("displays the correct traditional range for property policy type", () => {
    // Property flat rate: low=8000, high=20000
    render(
      <PricingComparison
        riskScore={30}
        decision="approved"
        premium={{ min: 4000, max: 7000 }}
        policyType="property"
      />
    );

    expect(screen.getByText(/8,000/)).toBeInTheDocument();
    expect(screen.getByText(/20,000/)).toBeInTheDocument();
  });

  it("falls back to health rates for an unknown policy type", () => {
    render(
      <PricingComparison
        riskScore={30}
        decision="approved"
        premium={{ min: 5000, max: 8000 }}
        policyType="unknown"
      />
    );

    // Falls back to health: low=12000, high=25000
    expect(screen.getAllByText(/12,000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/25,000/).length).toBeGreaterThan(0);
  });

  it("shows '15 features analyzed' in the AI pricing section", () => {
    render(
      <PricingComparison
        riskScore={50}
        decision="approved"
        premium={{ min: 10000, max: 15000 }}
        policyType="health"
      />
    );

    expect(screen.getByText("15 features analyzed")).toBeInTheDocument();
  });
});
