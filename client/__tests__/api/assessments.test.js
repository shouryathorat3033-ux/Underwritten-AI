/**
 * @jest-environment node
 */
/**
 * Tests for the assessments API route (POST handler).
 *
 * Verifies authentication and input validation:
 *   - POST without auth returns 401
 *   - POST with missing applicant name returns 400
 *   - POST with missing policyType returns 400
 */

// Mock @/lib/auth
const mockAuth = jest.fn();
jest.mock("@/lib/auth", () => ({
  auth: (...args) => mockAuth(...args),
}));

// Mock @/lib/mongodb
jest.mock("@/lib/mongodb", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true),
}));

// Mock @/lib/models/Assessment
const mockCreate = jest.fn();
jest.mock("@/lib/models/Assessment", () => ({
  __esModule: true,
  default: {
    create: (...args) => mockCreate(...args),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

import { POST } from "@/app/api/assessments/route";

/**
 * Helper to build a mock Next.js Request object with a JSON body.
 */
function createMockRequest(body) {
  return {
    json: () => Promise.resolve(body),
  };
}

describe("POST /api/assessments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const req = createMockRequest({
      policyType: "health",
      applicant: { name: "Test User" },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toMatch(/sign up/i);
  });

  it("returns 400 when applicant name is missing", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user123", role: "applicant" },
    });

    const req = createMockRequest({
      policyType: "health",
      applicant: { name: "" },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/name/i);
  });

  it("returns 400 when applicant object has no name property", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user123", role: "applicant" },
    });

    const req = createMockRequest({
      policyType: "health",
      applicant: {},
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/name/i);
  });

  it("returns 400 when policyType is missing", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user123", role: "applicant" },
    });

    const req = createMockRequest({
      applicant: { name: "Test User" },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/policy type/i);
  });

  it("returns 201 and the assessment when all fields are valid", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user123", role: "applicant" },
    });

    const mockAssessment = {
      _id: "assess123",
      policyType: "health",
      applicant: { name: "Priya Sharma" },
      status: "draft",
    };
    mockCreate.mockResolvedValue(mockAssessment);

    const req = createMockRequest({
      policyType: "health",
      applicant: { name: "Priya Sharma" },
      traditionalData: { income: 1200000 },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.assessment).toBeDefined();
    expect(data.assessment.policyType).toBe("health");
  });

  it("passes the authenticated user ID to Assessment.create", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user456", role: "underwriter" },
    });

    mockCreate.mockResolvedValue({ _id: "a1", status: "draft" });

    const req = createMockRequest({
      policyType: "auto",
      applicant: { name: "Arjun Patel" },
    });

    await POST(req);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user456",
        policyType: "auto",
      })
    );
  });
});
