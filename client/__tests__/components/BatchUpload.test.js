/**
 * Tests for the BatchUpload component.
 *
 * Verifies CSV parsing, file selection UI, progress tracking,
 * and result table rendering for batch underwriting.
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));

// Mock next-auth/react (BatchUpload doesn't use it, but parent might)
jest.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { name: "Test", role: "admin" } }, status: "authenticated" }),
}));

import BatchUpload from "@/components/ui/BatchUpload";
import toast from "react-hot-toast";

/**
 * Helper: create a File with a working .text() method for jsdom.
 */
function createCSVFile(content, name = "test.csv") {
  const file = new File([content], name, { type: "text/csv" });
  file.text = () => Promise.resolve(content);
  return file;
}

describe("BatchUpload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("renders the component heading", () => {
    render(<BatchUpload />);
    expect(screen.getByText("Batch Assessment Upload")).toBeInTheDocument();
  });

  it("renders the CSV format instructions", () => {
    render(<BatchUpload />);
    expect(screen.getByText(/Upload a CSV with columns/)).toBeInTheDocument();
  });

  it("renders the Select CSV File button", () => {
    render(<BatchUpload />);
    expect(screen.getByText("Select CSV File")).toBeInTheDocument();
  });

  it("renders the sample CSV format section", () => {
    render(<BatchUpload />);
    expect(screen.getByText("Sample CSV Format")).toBeInTheDocument();
    expect(screen.getByText(/Priya Sharma/)).toBeInTheDocument();
  });

  it("shows file name after selecting a file", () => {
    render(<BatchUpload />);
    const input = document.querySelector('input[type="file"]');
    const csvFile = createCSVFile(
      "name,email,age,gender,income,creditScore,policyType\nTest,test@test.com,30,male,800000,700,health",
      "applicants.csv"
    );
    fireEvent.change(input, { target: { files: [csvFile] } });
    expect(screen.getByText("applicants.csv")).toBeInTheDocument();
  });

  it("shows the Process button after file selection", () => {
    render(<BatchUpload />);
    const input = document.querySelector('input[type="file"]');
    const csvFile = createCSVFile("header\nrow", "batch.csv");
    fireEvent.change(input, { target: { files: [csvFile] } });
    expect(screen.getByText(/Process batch.csv/)).toBeInTheDocument();
  });

  it("shows error toast for empty CSV", async () => {
    render(<BatchUpload />);
    const input = document.querySelector('input[type="file"]');

    const emptyCSV = createCSVFile("header", "empty.csv");
    fireEvent.change(input, { target: { files: [emptyCSV] } });
    fireEvent.click(screen.getByText(/Process empty.csv/));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("No valid rows found in CSV");
    });
  });

  it("shows error toast when CSV exceeds 50 rows", async () => {
    render(<BatchUpload />);
    const input = document.querySelector('input[type="file"]');

    let rows = "name,policyType\n";
    for (let i = 0; i < 51; i++) rows += `User${i},health\n`;
    const bigCSV = createCSVFile(rows, "big.csv");
    fireEvent.change(input, { target: { files: [bigCSV] } });
    fireEvent.click(screen.getByText(/Process big.csv/));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Maximum 50 applicants per batch");
    });
  });

  it("processes CSV and displays results table", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ assessment: { _id: "a1" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: { riskScore: 32, decision: "approve" } }),
      });

    render(<BatchUpload />);
    const input = document.querySelector('input[type="file"]');

    const csv = createCSVFile(
      "name,email,age,gender,income,creditScore,policyType\nPriya,priya@test.com,28,female,1200000,780,health",
      "test.csv"
    );
    fireEvent.change(input, { target: { files: [csv] } });
    fireEvent.click(screen.getByText(/Process test.csv/));

    await waitFor(() => {
      expect(screen.getByText("1 applicants processed")).toBeInTheDocument();
    });

    expect(screen.getByText("Priya")).toBeInTheDocument();
    expect(screen.getByText("32")).toBeInTheDocument();
    expect(screen.getByText("approve")).toBeInTheDocument();
  });

  it("shows New Batch button after processing", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ assessment: { _id: "a1" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: { riskScore: 45, decision: "approve" } }),
      });

    render(<BatchUpload />);
    const input = document.querySelector('input[type="file"]');
    const csv = createCSVFile("name,policyType\nTest,health", "test.csv");
    fireEvent.change(input, { target: { files: [csv] } });
    fireEvent.click(screen.getByText(/Process test.csv/));

    await waitFor(() => {
      expect(screen.getByText("New Batch")).toBeInTheDocument();
    });
  });
});
