# Gemma 4 E4B Integration Guide for UnderwriteAI

This document details the local integration of Google's **Gemma 4 E4B** model into **UnderwriteAI** via Ollama for evidence-based underwriting reasoning, factor-contribution explanations, and compliance checklists.

---

## 1. Architecture Overview

```
                                ┌───────────────────────────┐
                                │   Client UI (Next.js)     │
                                │   GemmaReasoningCard.js   │
                                └─────────────┬─────────────┘
                                              │ /api/assessments/[id]/reasoning
                                              │ (MongoDB Caching & Deduping)
                                              ▼
                                ┌───────────────────────────┐
                                │   Next.js API Gateway     │
                                └─────────────┬─────────────┘
                                              │ POST /api/reasoning/*
                                              ▼
                                ┌───────────────────────────┐
                                │    Python FastAPI Engine  │
                                │    (Calculates ML Scores  │
                                │     & Actuarial Premiums) │
                                └─────────────┬─────────────┘
                                              │ Grounded Prompt + JSON Schema
                                              │ (Temp 0.2, Strict Grounding)
                                              ▼
                                ┌───────────────────────────┐
                                │   Local Ollama Runtime    │
                                │   Model: `gemma4:e4b`     │
                                └───────────────────────────┘
```

### Key Architectural Tenets
1. **Separation of Computation and Explanation**: The validated Stacked Ensemble ML model and GLM actuarial logic remain the sole sources of mathematical truth. Gemma 4 E4B explains these verified numbers; it is constrained from fabricating or altering risk scores, factor weights, or premiums.
2. **Backend-Confined Inference**: Ollama runs entirely on the internal backend network. No Ollama endpoints or credentials are exposed to the client.
3. **Prompt Injection Defense**: Applicant profile inputs and OCR text are treated as untrusted data and strictly sanitized before prompt interpolation.
4. **Deterministic Fallback**: If Ollama is offline or uninstalled, the system automatically falls back to deterministic rule-based explanations without crashing or interrupting assessment workflows.

---

## 2. Environment Variables

### Python Backend (`python/.env`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Base URL of the Ollama HTTP API |
| `OLLAMA_MODEL` | `gemma4:e4b` | Exact Ollama model tag to invoke |
| `OLLAMA_TIMEOUT` | `90.0` | Timeout in seconds for local model inference |

### Next.js Client (`client/.env.local`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PYTHON_BACKEND_URL` | `http://127.0.0.1:8000` | URL of the internal Python FastAPI backend |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/underwriteai` | MongoDB connection string for reasoning persistence |

---

## 3. Local Setup Instructions

### Step 1: Install and Verify Ollama
1. Download and install Ollama from [ollama.ai](https://ollama.ai).
2. Pull and test the `gemma4:e4b` model:
   ```bash
   ollama pull gemma4:e4b
   ollama list
   ```
3. Verify the local Ollama API is listening:
   ```bash
   curl http://127.0.0.1:11434/api/tags
   ```

### Step 2: Configure Python Backend
1. In `python/.env`, ensure the following lines are present:
   ```env
   OLLAMA_BASE_URL=http://127.0.0.1:11434
   OLLAMA_MODEL=gemma4:e4b
   OLLAMA_TIMEOUT=90.0
   ```
2. Activate virtual environment and run the backend:
   ```bash
   cd python
   .\venv\Scripts\activate
   uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```

### Step 3: Run Next.js Client
```bash
cd client
npm run dev
```

---

## 4. Structured Reasoning Output Schema

When an assessment finishes, Gemma receives ground-truth calculations and returns structured JSON with the following 8 core explanation sections + verification triad:

1. `executive_summary`: High-level underwriter assessment summary.
2. `influential_factors`: List of top influential drivers with risk impact and why they matter.
3. `factor_contributions`: Factor breakdown with exact calculated points and units.
4. `factor_interactions`: Interactions between factors that are strictly supported by evidence.
5. `supporting_evidence`: Verifiable data points from application and documents supporting the decision.
6. `missing_info_and_uncertainty`: Explicit flags for unverified documents, missing lab results, or limitations.
7. `underwriter_checks`: Actionable verification checklist for human underwriters.
8. `concise_dashboard_summary`: 1-2 sentence executive summary for compact dashboard display.
9. `verified_facts`: List of factual data points from official records/documents.
10. `calculated_results`: Mirror of mathematical outputs (risk score, premium, decision).
11. `ai_interpretations`: Clear separation of AI inferences from hard facts.

---

## 5. UI Features in `GemmaReasoningCard`

- **Interactive Tabbed Interface**:
  - *Summary*: Executive reasoning and model status.
  - *Factor Contributions*: Bar cards showing mathematical point contributions.
  - *Interactions & Evidence*: Correlated factors and supporting records.
  - *Underwriter Checklist*: Interactive checklist items.
  - *Fact Verification Triad*: Three-column comparison of Verified Facts, Calculated Results, and AI Interpretations.
- **Model Status Badge**: Shows live model status (`gemma4:e4b` Live vs Offline).
- **Offline Resilience Banner**: If Ollama is offline, displays an amber status banner with quick retry button without crashing the assessment view.
- **Persistent Caching**: Reasoning is cached in MongoDB (`assessment.result.gemmaReasoning`). Re-visiting the page loads instantly without invoking the model again.
- **Re-evaluate Action**: Dedicated button allows the underwriter to re-run reasoning on demand.

---

## 6. Deployment Considerations (Laptop Localhost vs. Cloud)

The model is installed locally on your laptop:

### Why Vercel Cannot Directly Access `http://localhost:11434`
- Web hosting services like Vercel, Netlify, or AWS Lambda run in isolated cloud containers. To them, `localhost` refers to their own container, not your physical laptop.
- Local loopback IP `127.0.0.1` is not publicly routeable over the Internet.

### Production Deployment Options
1. **Option A: Secure Encrypted Tunnel (Testing Deployed Frontend with Local Laptop Model)**
   - Use Cloudflare Tunnel or Tailscale to securely expose your laptop's backend without opening open firewall ports:
     ```bash
     cloudflared tunnel --url http://127.0.0.1:8000
     ```
   - Set `PYTHON_BACKEND_URL` in your Vercel project settings to your Cloudflare Tunnel URL.
2. **Option B: Dedicated Cloud Ollama Instance (Recommended for Team/Production)**
   - Deploy Ollama on a GPU cloud VM (e.g., RunPod, Modal, GCP Compute Engine with T4/L4 GPU).
   - Configure `OLLAMA_BASE_URL` in your backend environment to point to the secure cloud endpoint.
3. **Option C: Hybrid Graceful Fallback**
   - The current implementation automatically falls back to deterministic rule-based reasoning if Ollama is unreachable, ensuring zero downtime for cloud users even when your laptop is offline.
