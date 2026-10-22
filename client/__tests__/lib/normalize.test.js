/**
 * Tests for normalization utility functions.
 *
 * These functions mirror the logic used within the application for
 * normalizing Indian-market insurance data (income, CIBIL scores, etc.).
 * They are tested here as pure functions to verify correctness.
 */

/**
 * Normalizes annual income to a 0-1 scale for the Indian market.
 * The range is based on Indian income tax brackets and insurance industry norms:
 *   - 0 (zero income) maps to 0
 *   - 25,00,000 (25 lakh) and above maps to 1
 */
function normalizeIncome(income) {
  const MIN = 0;
  const MAX = 2500000; // 25 lakh upper bound
  if (typeof income !== "number" || isNaN(income)) return 0;
  if (income <= MIN) return 0;
  if (income >= MAX) return 1;
  return (income - MIN) / (MAX - MIN);
}

/**
 * Normalizes CIBIL credit score to a 0-1 scale.
 * CIBIL scores in India range from 300 to 900.
 *   - 300 (minimum) maps to 0
 *   - 900 (maximum) maps to 1
 */
function normalizeCIBIL(score) {
  const MIN = 300;
  const MAX = 900;
  if (typeof score !== "number" || isNaN(score)) return 0;
  if (score <= MIN) return 0;
  if (score >= MAX) return 1;
  return (score - MIN) / (MAX - MIN);
}

describe("normalizeIncome (Indian market)", () => {
  it("returns 0 for zero income", () => {
    expect(normalizeIncome(0)).toBe(0);
  });

  it("returns 0 for negative income", () => {
    expect(normalizeIncome(-50000)).toBe(0);
  });

  it("returns 1 for income at or above 25 lakh", () => {
    expect(normalizeIncome(2500000)).toBe(1);
    expect(normalizeIncome(5000000)).toBe(1);
  });

  it("returns 0.5 for income of 12.5 lakh (midpoint)", () => {
    expect(normalizeIncome(1250000)).toBeCloseTo(0.5, 5);
  });

  it("correctly normalizes 8 lakh (a common Indian middle-class income)", () => {
    // 800000 / 2500000 = 0.32
    expect(normalizeIncome(800000)).toBeCloseTo(0.32, 2);
  });

  it("correctly normalizes 12 lakh annual income", () => {
    // 1200000 / 2500000 = 0.48
    expect(normalizeIncome(1200000)).toBeCloseTo(0.48, 2);
  });

  it("returns 0 for non-numeric input", () => {
    expect(normalizeIncome("abc")).toBe(0);
    expect(normalizeIncome(undefined)).toBe(0);
    expect(normalizeIncome(null)).toBe(0);
    expect(normalizeIncome(NaN)).toBe(0);
  });
});

describe("normalizeCIBIL (credit score 300-900)", () => {
  it("returns 0 for the minimum score of 300", () => {
    expect(normalizeCIBIL(300)).toBe(0);
  });

  it("returns 1 for the maximum score of 900", () => {
    expect(normalizeCIBIL(900)).toBe(1);
  });

  it("returns 0 for scores below the minimum", () => {
    expect(normalizeCIBIL(100)).toBe(0);
    expect(normalizeCIBIL(0)).toBe(0);
    expect(normalizeCIBIL(-50)).toBe(0);
  });

  it("returns 1 for scores above the maximum", () => {
    expect(normalizeCIBIL(950)).toBe(1);
  });

  it("correctly normalizes 600 (midpoint of 300-900 range)", () => {
    // (600 - 300) / (900 - 300) = 300/600 = 0.5
    expect(normalizeCIBIL(600)).toBeCloseTo(0.5, 5);
  });

  it("correctly normalizes 750 (good CIBIL score)", () => {
    // (750 - 300) / (900 - 300) = 450/600 = 0.75
    expect(normalizeCIBIL(750)).toBeCloseTo(0.75, 5);
  });

  it("correctly normalizes 780 (very good CIBIL score)", () => {
    // (780 - 300) / (900 - 300) = 480/600 = 0.8
    expect(normalizeCIBIL(780)).toBeCloseTo(0.8, 5);
  });

  it("returns 0 for non-numeric input", () => {
    expect(normalizeCIBIL("abc")).toBe(0);
    expect(normalizeCIBIL(undefined)).toBe(0);
    expect(normalizeCIBIL(null)).toBe(0);
    expect(normalizeCIBIL(NaN)).toBe(0);
  });
});
