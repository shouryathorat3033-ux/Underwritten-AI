# UnderwriteAI — Complete Technical & Presentation Reference

> AI-powered insurance underwriting platform using Stacked Ensemble ML, RAG-augmented decisions, actuarial premium pricing, and fairness-first design for the Indian market.

---

## Table of Contents

1. [For Non-Technical Audience](#1-for-non-technical-audience)
2. [System Architecture](#2-system-architecture)
3. [ML Model Architecture](#3-ml-model-architecture)
4. [Feature Engineering](#4-feature-engineering)
5. [Synthetic Training Data — Base Risk Formulas](#5-synthetic-training-data--base-risk-formulas)
6. [Risk Weight Configuration](#6-risk-weight-configuration)
7. [RAG (Retrieval-Augmented Generation)](#7-rag-retrieval-augmented-generation)
8. [Premium Calculation Engine (INR)](#8-premium-calculation-engine-inr)
9. [Fraud Detection Engine](#9-fraud-detection-engine)
10. [STP (Straight-Through Processing)](#10-stp-straight-through-processing)
11. [Document Forensics](#11-document-forensics)
12. [Alternative Data Scoring](#12-alternative-data-scoring)
13. [Fairness Audit](#13-fairness-audit)
14. [API Reference](#14-api-reference)
15. [Model Performance](#15-model-performance)
16. [Demo Script](#16-demo-script)

---

## 1. For Non-Technical Audience

### What Does UnderwriteAI Do?

Traditional insurance companies decide whether to insure you based on just **3-4 data points** — your age, income, credit score, and medical history. This is unfair to millions of people who are healthy, drive safely, and pay their bills on time — but simply lack a paper trail.

**UnderwriteAI solves this** by analyzing **12+ data sources** including:

| Traditional Data | Alternative Data (New) |
|---|---|
| Age, Gender, Occupation | Telematics (driving safety from phone sensors) |
| Income, Credit Score (CIBIL) | Behavioral Analytics (payment history, savings rate) |
| Medical History, BMI | Lifestyle Data (exercise, sleep, diet from wearables) |
| Driving Record, Property Details | Digital Footprint (social media risk indicators) |

### How Does the AI Decide?

```
Step 1: You upload documents (Aadhaar, PAN, salary slip, etc.)
        → AI extracts all data automatically using vision models

Step 2: AI checks if documents are real
        → Pixel-level forensic analysis (tampering detection)

Step 3: ML model calculates your Risk Score (0-100)
        → Lower score = safer = cheaper premium
        → Uses ALL 12+ data sources, not just traditional ones

Step 4: Actuarial engine calculates your Premium in ₹
        → Based on Indian mortality tables (IALM 2012-14) & IRDAI tariffs
        → Fair, formula-driven pricing — no hidden markups

Step 5: AI explains the decision in plain language
        → Backed by regulatory knowledge base (RAG)
        → If declined: legally required reasons + what you can improve

Step 6: Human underwriter makes final call
        → AI advises, human decides — always
```

### Key Numbers

| Metric | Value | What It Means |
|---|---|---|
| Risk Score Range | 0-100 | Lower is better for you |
| Approve Threshold | ≤ 55 | You get insured at good rates |
| Refer Threshold | 56-75 | Manual review by underwriter |
| Decline Threshold | > 75 | Too risky; reasons provided |
| ML Accuracy (R²) | 96-98% | Model explains almost all variance |
| ML Error (MAE) | 2.5-3 points | Average prediction error on 0-100 scale |
| Prediction Speed | ~50ms | Nearly instant |
| Data Sources | 12-16 features | vs. industry standard 3-4 |
| Fairness Tests | All 4 models pass | Gender, age, income bias tested |

### How Alternative Data Helps You

**Example — Young Healthy Driver:**
- Traditional score (age + income only): **52** (borderline, high premium)
- AI-enhanced score (+ telematics 85, behavioral 78, lifestyle 82): **34** (approved, low premium)
- **Savings: ₹8,000-₹15,000/year** just by sharing safe driving + fitness data

**Example — Senior with Good Habits:**
- Traditional score (age 62 alone): **72** (likely referred)
- AI-enhanced score (+ excellent wearable data, no smoking, active): **55** (approved at standard rates)
- **Result: Approved instead of referred**

### What Happens When You're Declined?

By law (IRDAI regulations), you receive:
1. **Specific reasons** — "Elevated BMI", "Current smoker", etc.
2. **Key factors** — Which data points hurt your score most
3. **Improvement path** — Exact steps to improve (quit smoking = -15 to -25 points)
4. **Reconsideration rights** — You can reapply after improvements
5. **Appeal process** — Request human review

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        UNDERWRITE AI PLATFORM                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────┐   ┌──────────┐ │
│  │ Document  │   │   Feature    │   │  ML Engine   │   │ Premium  │ │
│  │ AI + OCR  │──>│ Engineering  │──>│  Stacked     │──>│ Actuarial│ │
│  │ (Groq)    │   │ (16 features)│   │  Ensemble    │   │ Engine   │ │
│  │           │   │ + RAG Smart  │   │  GBR+RF→Ridge│   │ IALM 2014│ │
│  │ Forensics │   │   Defaults   │   │              │   │ IRDAI    │ │
│  └──────────┘   └──────────────┘   └──────┬───────┘   └──────────┘ │
│                                            │                        │
│  ┌──────────┐   ┌──────────────┐   ┌──────┴───────┐   ┌──────────┐ │
│  │ Fraud    │   │ RAG Knowledge│   │  Explanation  │   │ Fairness │ │
│  │ Detection│   │ Base (100+   │   │  LLM (Groq)  │   │ Audit    │ │
│  │ (5 checks│   │ documents)   │   │  + Citations  │   │ (3 tests │ │
│  │ 0-100)   │   │ TF-IDF search│   │  + Adverse    │   │ x 4 types│ │
│  └──────────┘   └──────────────┘   └──────────────┘   └──────────┘ │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Frontend: Next.js 16 + React 19    Backend: FastAPI + scikit-learn │
│  Database: MongoDB (Mongoose/Motor)  LLM: Groq (Llama 3.3 70B)     │
│  Auth: NextAuth v5                   Storage: Cloudinary            │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User uploads documents
       │
       ▼
Document AI (Groq Llama 4 Scout 17B vision) ──→ Auto-fill form fields
       │
       ▼
Document Forensics (4 pixel-level checks) ──→ Authenticity verdict
       │
       ▼
Feature Engineering (16 normalized features)
  + RAG Smart Defaults (population averages by demographic bracket)
       │
       ▼
Stacked Ensemble ML (GBR + RF → Ridge meta-learner)
  ├── Risk Score (0-100)
  ├── Decision (approve/refer/decline)
  ├── Confidence (50-98%, from tree variance)
  └── Factor Contributions (SHAP-like marginal analysis)
       │
       ▼
Premium Calculation (GLM-style actuarial engine)
  ├── IALM 2012-14 Indian mortality tables
  ├── IRDAI published tariff rates
  ├── Risk loading from ML score
  └── Min/Max premium range in ₹
       │
       ▼
RAG-Augmented Explanation
  ├── TF-IDF retrieval over 100+ domain documents
  ├── Regulatory citations (IRDAI, Insurance Act 1938)
  ├── Similar case retrieval from MongoDB
  └── LLM explanation anchored to ML score (±5 points)
       │
       ▼
Fairness Audit (gender, age, income disparity tests)
       │
       ▼
Human Underwriter makes final decision
```

---

## 3. ML Model Architecture

### Stacked Ensemble (per policy type — 4 separate models)

```
Input: 16 normalized features
           │
     ┌─────┴──────┐
     ▼             ▼
┌─────────┐  ┌──────────┐
│   GBR   │  │    RF    │    BASE LEARNERS (diverse algorithms)
│ 300 trees│  │200 trees │
│ depth=5  │  │ depth=8  │
│ lr=0.08  │  │          │
│ sub=0.85 │  │ leaf≥5   │
└────┬─────┘  └─────┬────┘
     │              │
     ▼              ▼
     ┌──────────────┐
     │  5-Fold CV   │        CROSS-VALIDATION (prevents overfitting)
     │  Predictions │
     └──────┬───────┘
            ▼
     ┌──────────────┐
     │    Ridge     │        META-LEARNER (combines base predictions)
     │  alpha=1.0   │
     └──────┬───────┘
            ▼
     Risk Score (0-100)      OUTPUT (continuous, then thresholded)
```

### Why Stacked Ensemble?

| Component | Role | Why |
|---|---|---|
| GradientBoosting (300 trees) | Sequential error correction | Captures complex non-linear patterns (interactions) |
| RandomForest (200 trees) | Parallel bagging | Reduces variance, handles noisy features |
| Ridge meta-learner | Weighted combination | Learns optimal blending of both models |
| 5-fold CV | Generates meta-features | Prevents overfitting in stacking |

### Decision Thresholds

| Score Range | Decision | Description | Premium Impact |
|---|---|---|---|
| 0-30 | **APPROVE** (Preferred) | Very low risk | Best rates (0.7-0.85x loading) |
| 31-55 | **APPROVE** (Standard) | Moderate risk | Standard rates (1.0-1.5x) |
| 56-75 | **REFER** | Elevated risk | Higher rates (1.5-2.3x), needs review |
| 76-100 | **DECLINE** | Critical risk | Adverse action notice generated |

### Confidence Calculation

```
predictions = [tree.predict(features) for tree in all_trees_in_ensemble]
std_deviation = std(predictions)
confidence = max(50, min(98, 100 - std_deviation × 3))
```

Higher tree agreement = higher confidence. Minimum 50%, maximum 98%.

### Feature Contribution (SHAP-like Marginal Analysis)

For each feature, the model computes its individual impact:

```
baseline_score = predict(all_features)

For each feature_i:
    perturbed = copy(all_features)
    perturbed[i] = neutral_baseline_value   # e.g., age=35, income=0.5
    perturbed_score = predict(perturbed)
    contribution[i] = baseline_score - perturbed_score
```

**Neutral Baseline Values:**
| Feature | Baseline | Rationale |
|---|---|---|
| age | 35 | Prime insurance age |
| income_normalized | 0.5 | Median income |
| credit_score_normalized | 0.5 | Median CIBIL |
| bmi | 25 | Normal BMI boundary |
| smoking_encoded | 0 | Non-smoker |
| telematics/behavioral/lifestyle | 0.5 | Average score |
| accidents_last_5 | 0 | Clean record |
| all others | 0.5 or 0.0 | Feature-specific neutral |

---

## 4. Feature Engineering

### 16 Features Per Policy Type

#### Common Features (all 4 policy types)

| # | Feature | Normalization | Missing Default | Risk Direction |
|---|---|---|---|---|
| 1 | `age` | Raw years (18-80) | 45 (risky) | Higher = higher risk |
| 2 | `gender_encoded` | male=0, female=1, unknown=0.5 | 0.5 (neutral) | Minimal (<0.5pt) |
| 3 | `income_normalized` | `min(1.0, income / 25,00,000)` | **0.0 (max risk)** | Higher = lower risk |
| 4 | `credit_score_normalized` | `(CIBIL - 300) / 600` → [0,1] | **0.0 (max risk)** | Higher = lower risk |
| 5 | `existing_policies` | Raw count (0-8) | 0 | Neutral |
| 11 | `telematics_score_norm` | `score / 100` → [0,1] | 0.3 (below avg) | Higher = lower risk |
| 12 | `behavioral_score_norm` | `score / 100` → [0,1] | 0.3 (below avg) | Higher = lower risk |
| 13 | `lifestyle_score_norm` | `score / 100` → [0,1] | 0.3 (below avg) | Higher = lower risk |
| 14 | `social_media_risk_encoded` | low=0, medium=1, high=2 | 1.5 (elevated) | Higher = higher risk |
| 15 | `job_stability_norm` | [0,1] | 0.3 (below avg) | Higher = lower risk |
| 16 | `data_completeness` | % fields filled [0.1,1.0] | Computed | Lower = higher risk |

#### Policy-Specific Features (slots 6-10)

**Health:**
| # | Feature | Normalization | Missing Default |
|---|---|---|---|
| 6 | `bmi` | Raw value (15-50) | 28 (overweight) |
| 7 | `smoking_encoded` | never=0, former=1, current=2 | 1 (former) |
| 8 | `exercise_freq` | Days/week (0-7) | 1 (sedentary) |
| 9 | `medical_conditions_count` | Count (0-6) | 0 |
| 10 | `family_history_count` | Count (0-4) | 0 |

**Auto:**
| # | Feature | Normalization | Missing Default |
|---|---|---|---|
| 6 | `driving_years` | Years (0-50+) | 2 (new driver) |
| 7 | `accidents_last_5` | Count (0-6) | 1 (assume 1) |
| 8 | `traffic_violations` | Count (0-8) | 1 (assume 1) |
| 9 | `vehicle_age` | Years (0-25) | 5 |
| 10 | `daily_commute` | km (1-120) | 30 |

**Life:**
| # | Feature | Normalization | Missing Default |
|---|---|---|---|
| 6 | `smoking_encoded` | never=0, former=1, current=2 | 1 |
| 7 | `exercise_freq` | Days/week (0-7) | 1 |
| 8 | `bmi` | Raw value | 28 |
| 9 | `dependents` | Count (0-6) | 1 |
| 10 | `family_history_count` | Count (0-5) | 0 |

**Property:**
| # | Feature | Normalization | Missing Default |
|---|---|---|---|
| 6 | `property_age` | Years (0-100) | 25 (old) |
| 7 | `property_value_normalized` | `value / 3,00,00,000` (₹3Cr) | 0.3 |
| 8 | `square_footage_normalized` | `sqft / 3000` | 0.3 |
| 9 | `construction_type_encoded` | concrete=0, brick=1, wood=2 | 1 |
| 10 | `flood_zone_encoded` | none=0, low=1, moderate=2, high=3 | 2 |
| (extra) | `security_encoded` | none=0, basic=1, comprehensive=2 | 0 |

### Design Principle: Missing Data = Risk

| Missing Field | Normalized Value | Risk Impact | Why |
|---|---|---|---|
| Income = ₹0 | 0.0 | +15-20 points | Cannot verify financial stability |
| CIBIL = 0 | 0.0 | +12-18 points | No credit history to assess |
| Alt data missing | 0.3 | +3-5 points | Below-average assumed |
| Low completeness | Penalty applied | Up to +12 points | Incomplete applications are riskier |

### Missing Data → Training Data Means (Not Guesses)

When a field is missing, the system uses **training data means** — the average value of that feature across 10,000 training samples. This is the model's own definition of "average person", not a demographic guess.

**Why training data means (not population averages by age)?**
- Age alone can't predict BMI — a 25-year-old could have BMI 18 or 40
- Guessing "BMI = 23 because you're 25" is fabricating data
- Training data mean makes the feature contribute **~0 to the score** (neutral)
- The `data_completeness` penalty (+12 points max) handles the punishment

**Why not worst-case for everything?**
- Income/Credit: YES worst-case (0.0) — mandatory fields, hiding = adverse selection
- BMI/Exercise/etc: NO — using worst-case + completeness penalty = double punishment

| Missing Field | Fill Value | Score Impact | Rationale |
|---|---|---|---|
| **Income** | 0.0 (worst) | +15-20 pts | Mandatory — hiding = risk signal |
| **Credit (CIBIL)** | 0.0 (worst) | +12-18 pts | Mandatory — hiding = risk signal |
| **BMI** | Training mean (~27) | ~0 pts (neutral) | Completeness penalty handles it |
| **Exercise** | Training mean (~2.2) | ~0 pts (neutral) | Completeness penalty handles it |
| **Driving years** | Training mean (~8) | ~0 pts (neutral) | Completeness penalty handles it |
| **Alt data** | 0.3 (below avg) | +3-5 pts | Haven't opted in — slight penalty |
| **Completeness** | Computed | Up to +12 pts | The universal "you didn't provide data" penalty |

This creates a clean separation: **each feature affects the score only if we actually have data for it.** Missing data punishment comes exclusively from the completeness score.

### Feature Interactions (Learned from Training Data)

| Interaction | Extra Risk | Rationale |
|---|---|---|
| Age > 50 + Current Smoker | +8-12 pts | Compounding mortality risk |
| BMI > 30 + Low Exercise | +6 pts | Sedentary obesity |
| Age < 25 + 2+ Accidents | +15 pts | Young reckless driver |
| High Commute + Violations | +8 pts | Exposure × behavior |
| Family History + Obesity | +7 pts | Genetic × lifestyle |
| Old Property + Flood Zone | +10 pts | Structural vulnerability |
| No Security + High Value | +8 pts | Target risk |
| Wood Construction + Old | +6 pts | Fire + deterioration risk |

---

## 5. Synthetic Training Data — Base Risk Formulas

Each policy type has **10,000 training samples** generated from actuarially-grounded formulas. The ML model learns to approximate these formulas, then generalizes to new data.

### Why Synthetic Data?

1. **Real insurance data is proprietary** — insurers don't share claims data
2. **PII regulations** — HIPAA/GDPR prevent public datasets with health/financial info
3. **Cold-start problem** — new insurers have no historical data
4. **Actuarially grounded** — formulas based on published mortality tables + industry loadings

### Health Risk Formula

```
base_risk = 35

 + Age Component:
   │  < 30:   -3
   │  30-40:  +2
   │  40-50:  +8
   │  50-60:  +16
   │  60-70:  +25
   │  70+:    +32

 + BMI Component:
   │  < 18.5 (underweight): +10
   │  18.5-25 (normal):     -3
   │  25-30 (overweight):   +6
   │  30-35 (obese):        +14
   │  > 35 (severely obese): +22

 + Smoking:   smoking_code × 13     (never=0 → +0, former=1 → +13, current=2 → +26)
 + Exercise:  -min(frequency × 2.5, 12)   (max benefit: -12 points)
 + Medical:   conditions_count × 7   (diabetes +7, hypertension +7, heart +7, etc.)
 + Family Hx: family_count × 5       (cancer +5, stroke +5, etc.)

 + Interaction: age > 50 AND current smoker → +8
 + Interaction: BMI > 30 AND exercise < 2 → +6

 + Income Risk:
   │  ≤ ₹25K/year:     +20   (effectively zero income)
   │  ₹25K - ₹3.75L:   +12   (low income)
   │  ₹3.75L - ₹7.5L:  +6    (lower-middle)
   │  > ₹20L:           -8    (high income benefit)
   │  Otherwise:         -2

 + Credit Risk (CIBIL):
   │  ≤ 300:            +18   (no credit history)
   │  300-450:          +12   (poor)
   │  450-570:          +5    (fair)
   │  > 840:            -8    (excellent benefit)
   │  Otherwise:         -2

 + Alternative Data Risk:
   │  -(telematics - 0.5) × 18     [higher telematics = lower risk]
   │  -(behavioral - 0.5) × 14     [higher behavioral = lower risk]
   │  -(lifestyle - 0.5) × 16      [higher lifestyle = lower risk]
   │  + social_media_risk × 5      [higher social risk = higher risk]

 + Data Completeness: (1 - completeness) × 12    [max penalty: +12]
 + Job Stability:     -(stability - 0.5) × 8     [stable job = lower risk]
 + Noise:             normal(0, 2.5)              [natural variance]

 final_risk = clip(sum_of_all, 2, 98)
```

### Auto Risk Formula

```
base_risk = 30

 + Age:         <20: +28 | 20-23: +18 | 23-26: +10 | 65-70: +6 | >70: +10
 + Experience:  -min(driving_years × 0.6, 12)
 + Accidents:   accidents_last_5 × 14
 + Violations:  traffic_violations × 9
 + Vehicle Age: <2yr: +4 (new car theft risk) | >15yr: +5 (old car reliability)
 + Commute:     >60km: +14 | 35-60km: +7 | <10km: -3

 + Interaction: age < 25 AND accidents ≥ 2 → +15  (young reckless)
 + Interaction: commute > 40km AND violations ≥ 2 → +8

 + Income:      same bands as health (max +15 for auto)
 + Credit:      same as health
 + Alt Data:    telematics_weight=22, behavioral=14, lifestyle=10
 + Completeness: (1 - completeness) × 10
 + Job Stability: -(stability - 0.5) × 6
 + Noise:       normal(0, 2.5)

 final_risk = clip(sum, 2, 98)
```

### Life Risk Formula

```
base_risk = 25

 + Age:         <30: -2 | 30-40: +5 | 40-50: +14 | 50-60: +24 | 60-70: +36 | 70+: +48
 + Smoking:     smoking_code × 15     (current smoker = +30)
 + Exercise:    -min(freq × 2.5, 12)
 + BMI:         <25: -2 | 25-30: +4 | 30-35: +12 | >35: +22
 + Family Hx:   family_count × 6

 + Interaction: age > 55 AND current smoker → +12
 + Interaction: family ≥ 2 AND BMI > 30 → +7

 + Alt Data:    telematics=10, behavioral=14, lifestyle=18
 + Income/Credit/Completeness/Stability: same structure as health

 final_risk = clip(sum, 2, 98)
```

### Property Risk Formula

```
base_risk = 30

 + Property Age:    <5yr: -5 | 5-15: 0 | 15-30: +8 | 30-50: +16 | >50: +26
 + Construction:    type_code × 5      (concrete=0, brick=1×5=+5, wood=2×5=+10)
 + Flood Zone:      zone_code × 9      (none=0, low=+9, moderate=+18, high=+27)
 + Security:        -security_code × 7  (comprehensive=2×7=-14 benefit)
 + Property Value:  normalized_value × 8

 + Interaction: property_age > 30 AND flood ≥ moderate → +10
 + Interaction: no security AND high value → +8
 + Interaction: wood construction AND property_age > 30 → +6

 + Alt Data:    telematics=10, behavioral=12, lifestyle=10
 + Income/Credit/Completeness/Stability: same structure

 final_risk = clip(sum, 2, 98)
```

### Training Data Distributions (Indian Market Calibrated)

| Feature | Distribution | Parameters | Indian Context |
|---|---|---|---|
| Income | Lognormal | μ=13.1, σ=0.8, clipped 0-₹50L | 8% missing (set to 0) |
| Credit (CIBIL) | Normal | μ=720, σ=80, clipped 300-900 | 6% missing |
| BMI | Normal | μ=27, σ=5.5, clipped 15-50 | Indian population avg |
| Telematics | Normal | μ=0.6, σ=0.2 | 12% missing (set to 0.3) |
| Behavioral | Normal | μ=0.6, σ=0.18 | 12% missing |
| Lifestyle | Normal | μ=0.55, σ=0.22 | 12% missing |
| Age (Health) | Uniform | 18-80 | Full adult range |
| Age (Auto) | Uniform | 17-75 | Driving age |
| Smoking | Categorical | P(never)=0.50, P(former)=0.20, P(current)=0.30 | Indian rates |

---

## 6. Risk Weight Configuration

### Default Weights (must sum to 100)

| Factor | Health | Auto | Life | Property |
|---|---|---|---|---|
| Age | 20 | 15 | **30** | — |
| Smoking | 20 | — | 22 | — |
| BMI | 12 | — | 8 | — |
| Income | 10 | 8 | 8 | 12 |
| Credit (CIBIL) | 8 | 8 | 5 | 10 |
| Medical History | 10 | — | — | — |
| Family History | 5 | — | 7 | — |
| Exercise | — | — | 5 | — |
| Accidents | — | **20** | — | — |
| Violations | — | 15 | — | — |
| Driving Experience | — | 10 | — | — |
| Commute Distance | — | 5 | — | — |
| Flood Zone | — | — | — | **22** |
| Property Age | — | — | — | 20 |
| Security System | — | — | — | 10 |
| Property Value | — | — | — | 8 |
| Telematics | 3 | **10** | 2 | 3 |
| Behavioral | 4 | 4 | 5 | 5 |
| Lifestyle | 5 | 2 | 5 | 5 |
| Data Completeness | 3 | 3 | 3 | 5 |
| **Total** | **100** | **100** | **100** | **100** |

### Custom Weight Adjustment Formula

Underwriters can customize weights. The system adjusts the ML base score:

```
For each weight category:
    deviation = (custom_weight% - default_weight%)

    if |deviation| < 0.5%: skip (trivial change)

    normalized_value = normalize_feature(raw_value)  →  [0, 1]

    if POSITIVE feature (income, credit, telematics, behavioral, lifestyle, exercise, driving_years, security, completeness):
        contribution = (0.5 - normalized_value) × deviation × 40

    if NEGATIVE feature (age, smoking, BMI, accidents, violations, flood_zone, medical_history, etc.):
        contribution = (normalized_value - 0.5) × deviation × 40

total_adjustment = clip(Σ contributions, -15, +15)    ← capped at ±15 points
final_score = clip(base_ML_score + total_adjustment, 2, 98)
```

**Key constraint:** Custom weights can shift the score by **at most ±15 points** from the ML base prediction. This prevents gaming while allowing meaningful customization.

### Weight Insight Classification

| Strategy | Criteria | Description |
|---|---|---|
| Tech-Forward / Data-Driven | Alternative data weight ≥ 30% | Emphasizes telematics + behavioral + lifestyle |
| Traditional / Conservative | Alternative data weight ≤ 5% | Relies mostly on age, income, credit |
| Balanced / Hybrid | Between 5-30% | Mix of traditional and alternative |

### Risk Warnings Generated

- **Concentration Risk:** Any single factor > 35% of total weight
- **Economic Bias:** Income > 25% creates potential for income-based discrimination
- **Blind Spots:** Any category at 0 weight creates unmonitored risk
- **Large Deviation:** Any factor shifted > 10 points from default

---

## 7. RAG (Retrieval-Augmented Generation)

### Architecture

```
User Question / Risk Decision
         │
         ▼
  TF-IDF Vectorizer               100+ Domain Documents
  (unigrams + bigrams,      ──→   (7 categories)
   5000 max features,
   sublinear TF scaling)
         │
         ▼
  Cosine Similarity Search         Top-K results (threshold > 0.06)
         │
         ▼
  Injected into LLM Prompt   ──→  Grounded, cited response
```

### Knowledge Base (100+ Documents, 7 Categories)

| Category | Count | Content |
|---|---|---|
| **regulation** | 10 | IRDAI laws, Insurance Act 1938, §45 contestability, adverse action requirements, AI bias warnings |
| **guideline** | 5 | UnderwriteAI scoring guidelines per policy type, alternative data rules |
| **actuarial** | 7 | Indian mortality tables (LICI), premium benchmarks, claim ratios, flood damage stats |
| **adverse** | 3 | Adverse action notice templates, 4/5 rule compliance, factor-specific reason templates |
| **platform** | 4 | ML pipeline specs, decision thresholds, fairness tests, custom weights documentation |
| **product** | 8 | Term Life, Health, Motor, Property, ULIP, Critical Illness, Travel, Pension product details |
| **faq** | 4 | Why declined, how to improve, alternative data explanation, fairness methodology |

### RAG Use Cases

| Endpoint | RAG Query Strategy | Purpose |
|---|---|---|
| **Scoring** (adverse actions) | `"{policy} adverse action decline {factors} IRDAI"` | Regulatory citations for decline reasons |
| **Scoring** (explanation) | `"{policy} risk score {score} {decision} actuarial"` | Grounded LLM explanation |
| **Chat** | `"{message} {page_context} {role} insurance"` | Context-aware chat responses |
| **Chat** (assessment pages) | Similar case retrieval from MongoDB | Historical comparison |

### Smart Defaults (RAG-Enhanced Feature Engineering)

When feature data is missing, the system queries MongoDB for population averages matching the applicant's demographic bracket (age ±10, same gender, same policy type). If ≥3 historical cases exist, averages are computed; otherwise, hardcoded Indian market defaults are used.

**Cache:** LRU cache (max 50 entries) keyed by `{policy_type}_{age_bracket}_{gender}`.

### Similar Case Retrieval

For chat and explanation, the system finds past assessments matching:
- Same policy type
- Similar age (±10 years)
- Similar income (±50%)
- Same gender (if provided)
- Status: completed/accepted/rejected/referred

Returns top 5 most recent with: risk score, decision, premium range, top 3 factors.

---

## 8. Premium Calculation Engine (INR)

### Indian Actuarial Mortality Table (IALM 2012-14)

*Deaths per 1,000 lives per year:*

| Age | Male | Female |
|---|---|---|
| 18 | 0.73 | 0.42 |
| 25 | 0.88 | 0.51 |
| 30 | 1.02 | 0.61 |
| 35 | 1.35 | 0.82 |
| 40 | 2.02 | 1.21 |
| 45 | 3.18 | 1.85 |
| 50 | 5.10 | 2.92 |
| 55 | 8.15 | 4.65 |
| 60 | 13.5 | 7.80 |
| 65 | 22.5 | 13.2 |
| 70 | 38.5 | 23.0 |
| 75 | 62.0 | 38.5 |

Ages between table entries are linearly interpolated.

---

### 8.1 Health Insurance Premium

```
                ┌──────────────────────────────────────────┐
                │        HEALTH PREMIUM FORMULA             │
                │                                          │
                │  Net = ₹8,000 (base rate)                │
                │      × Age Factor                        │
                │      × Sum Insured Factor                │
                │      × Risk Loading (from ML score)      │
                │      × Smoking Surcharge                 │
                │      × BMI Loading                       │
                │      × Morbidity Ratio (age band)        │
                │      × NCB Discount                      │
                │      × Wellness Discount                 │
                │      × 1.28 (expense margin)             │
                │                                          │
                │  Gross = Net × 1.18 (18% GST)            │
                │  Range = [85% of Gross, 115% of Gross]   │
                │  Floor = ₹3,000/year                     │
                └──────────────────────────────────────────┘
```

**Component Details:**

| Component | Formula | Range |
|---|---|---|
| **Base Rate** | ₹8,000 (for ₹5L SI, age 25-35) | Fixed |
| **Age Factor** | mortality(age, gender) / 1.02 | 0.4x — 60x |
| **Sum Insured Factor** | requested_SI / ₹5,00,000 | Linear scale |
| **Risk Loading** | Score ≤30: 0.7+(score/30)×0.3 | 0.70x — 1.00x |
| | Score 31-55: 1.0+((score-30)/25)×0.5 | 1.00x — 1.50x |
| | Score 56-75: 1.5+((score-55)/20)×0.8 | 1.50x — 2.30x |
| | Score >75: 2.3+((score-75)/25)×0.7 | 2.30x — 3.00x |
| **Smoking** | current: 1.40x, former: 1.15x, never: 1.00x | IRDAI allows up to 50% |
| **BMI** | >35: 1.30x, 30-35: 1.15x, <18.5: 1.10x, normal: 1.00x | |
| **Morbidity** | 18-25: 0.35x, 26-35: 0.45x, 36-45: 0.62x, 46-55: 0.85x, 56-65: 1.15x, 66+: 1.55x | Expected claims ratio |
| **NCB Discount** | max(0.85, 1.0 - existing_policies × 0.05) | 0% — 15% discount |
| **Wellness** | lifestyle>80: 0.92x (8% off), >60: 0.96x (4% off) | Wearable data benefit |
| **Expense Margin** | 1.28 (28%) | Admin + commission + underwriting |
| **GST** | 18% | Standard health insurance GST |

**Example — Low Risk (28F Engineer, BMI 22, non-smoker, score 18):**
```
₹8,000 × 0.93(age 28) × 1.0(₹5L SI) × 0.82(score 18) × 1.0(never) × 1.0(normal BMI)
× 0.45(morbidity 26-35) × 0.95(1 policy NCB) × 0.96(lifestyle 82) × 1.28(expense)
= ₹3,130 → ₹3,693 (with GST) → Range: ₹3,139 — ₹4,247/year
```

**Example — High Risk (62M, BMI 36, smoker, score 88):**
```
₹8,000 × 16.47(age 62) × 1.0 × 2.66(score 88) × 1.40(smoker) × 1.30(BMI 36)
× 1.15(morbidity 56-65) × 1.0(no NCB) × 1.0 × 1.28
= ₹8,27,000+ → ₹9,76,000 (with GST) → Range: ₹8,30,000 — ₹11,22,000/year
```

---

### 8.2 Auto Insurance Premium

```
┌──────────────────────────────────────────────────────────┐
│              AUTO PREMIUM FORMULA                         │
│                                                          │
│  Step 1: IDV = Vehicle Value × (1 - Depreciation Rate)   │
│  Step 2: OD Premium = IDV × OD Rate (by vehicle age)     │
│  Step 3: Adjusted OD = OD × Risk Factor × (1-NCB)        │
│                          × Telematics Discount           │
│  Step 4: Total = (Adjusted OD + TP Premium + PA Cover)   │
│                  × 1.12 (expense) × 1.18 (GST)          │
│  Floor = ₹3,000/year                                    │
└──────────────────────────────────────────────────────────┘
```

**IDV Depreciation (IRDAI schedule):**

| Vehicle Age | Depreciation | Example (₹8L car) |
|---|---|---|
| 0 years (new) | 0% | IDV = ₹8,00,000 |
| 1 year | 15% | IDV = ₹6,80,000 |
| 2 years | 20% | IDV = ₹6,40,000 |
| 3 years | 30% | IDV = ₹5,60,000 |
| 4 years | 40% | IDV = ₹4,80,000 |
| 5+ years | 50% | IDV = ₹4,00,000 |

**OD Rates (% of IDV, IRDAI tariff bands):**

| Vehicle Age Band | OD Rate |
|---|---|
| 0-1 years | 3.20% |
| 1-3 years | 3.40% |
| 3-5 years | 3.60% |
| 5-7 years | 3.80% |
| 7-10 years | 4.10% |
| 10+ years | 4.50% |

**Risk Factor (from ML score):**

| Score | Risk Factor | Meaning |
|---|---|---|
| ≤ 30 | 0.85x | Preferred — discount on OD |
| 31-55 | 1.0 + (score-30)/50 | Standard — 1.0x to 1.5x |
| > 55 | 1.5 + (score-55)/30 | High risk — up to 3.0x+ |

**NCB (No-Claim Bonus, only if 0 accidents in last 5 years):**

| Prior Policies | NCB Discount |
|---|---|
| 0 | 0% |
| 1 | 20% |
| 2 | 25% |
| 3 | 35% |
| 4 | 45% |
| 5+ | 50% |

**Third-Party Liability (IRDAI fixed rates, FY 2024-25):**

| Vehicle Type | Annual TP Premium |
|---|---|
| Motorcycle | ₹1,850 |
| Sedan | ₹2,094 |
| SUV | ₹2,094 |
| Truck | ₹15,746 |
| Van | ₹7,897 |
| Sports Car | ₹2,094 |

**PA Cover:** ₹750/year (mandatory ₹15L owner-driver cover)

**Example — Safe Driver (38F, Maruti Swift ₹8L, 3yr old, score 20):**
```
IDV = ₹8,00,000 × 0.70 = ₹5,60,000
OD = ₹5,60,000 × 3.60% = ₹20,160
Risk = 0.85x → ₹17,136
NCB = 25% off (2 policies) → ₹12,852
Telematics = 0.94x (score 70) → ₹12,081
+ ₹2,094 (TP) + ₹750 (PA) = ₹14,925
× 1.12 × 1.18 = ₹19,720/year
Range: ₹17,748 — ₹21,692
```

---

### 8.3 Life Insurance Premium

```
┌──────────────────────────────────────────────────────────┐
│              LIFE PREMIUM FORMULA                         │
│                                                          │
│  For each year t = 1 to policy_term:                     │
│    qx = mortality(age + t, gender) / 1000                │
│    discount = 1 / (1.065)^t    [6.5% G-Sec rate]        │
│    year_cost = qx × Sum Assured × discount               │
│                                                          │
│  Annual Mortality = Σ(year_costs) / policy_term          │
│                                                          │
│  Net = Annual Mortality × Risk Loading × Smoking Load    │
│        × Over-Insurance Load × 1.22 (expense)           │
│                                                          │
│  Gross = Net × 1.12 (blended GST)                       │
│  Range = [85% of Gross, 115% of Gross]                   │
│  Floor = ₹2,500/year                                    │
└──────────────────────────────────────────────────────────┘
```

**Specific Loadings:**

| Component | Value | Notes |
|---|---|---|
| Risk Loading (≤30) | 0.80x | Best rates |
| Risk Loading (31-55) | 1.0 + (score-30)/50 | Standard |
| Risk Loading (56-75) | 1.5 + (score-55)/25 | Elevated |
| Risk Loading (>75) | 2.3 + (score-75)/30 | Critical |
| Smoking (current) | **2.0x** | Higher than health — mortality impact |
| Smoking (former) | 1.35x | |
| Over-Insurance | 1.15x if SA/Income > 20x | Anti-fraud loading |
| Discount Rate | 6.5% | Indian G-Sec benchmark |
| Expense Ratio | 1.22 (22% blended) | Over term duration |
| GST | 12% blended | 18% year 1, 4.5% renewals |

**Example — 30M Non-smoker, ₹1Cr SA, 20yr term, score 30:**
```
Annual mortality cost (discounted over 20yr) ≈ ₹14,500
× 1.0 (risk score 30 → 0.80-1.0 range) × 1.0 (non-smoker)
× 1.0 (SA/Income = 8.3x, OK) × 1.22 (expense) × 1.12 (GST) ≈ ₹19,400/year
Range: ₹16,490 — ₹22,310
```

---

### 8.4 Property Insurance Premium

```
┌──────────────────────────────────────────────────────────┐
│           PROPERTY PREMIUM FORMULA                        │
│                                                          │
│  Base = Property Value × 0.15%  (burning cost rate)      │
│                                                          │
│  Net = Base × Construction × Flood Zone × Property Age   │
│            × Security × Risk Factor × IoT Discount       │
│            × 1.25 (expense margin)                       │
│                                                          │
│  Gross = Net × 1.18 (18% GST)                           │
│  Range = [85% of Gross, 115% of Gross]                   │
│  Floor = ₹2,000/year                                    │
└──────────────────────────────────────────────────────────┘
```

| Component | Values |
|---|---|
| **Construction** | Concrete/RCC: 0.85x, Steel: 0.90x, Brick: 1.00x, Wood/Timber: 1.60x |
| **Flood Zone** | None: 0.90x, Low: 1.00x, Moderate: 1.35x, High: 1.80x |
| **Property Age** | ≤10yr: 1.00x, 10-20yr: 1.08x, 20-30yr: 1.20x, >30yr: 1.35x |
| **Security** | Comprehensive: 0.82x, Basic: 0.92x, None: 1.00x |
| **Risk Factor** | ≤30: 0.75x, 31-55: 1.0+(score-30)/50, >55: 1.5+(score-55)/30 |
| **IoT Discount** | Behavioral>80: 0.90x, >60: 0.95x, else: 1.00x |

**Example — ₹80L RCC flat, 5yr, no flood, basic security, score 28:**
```
₹80,00,000 × 0.15% = ₹12,000
× 0.85(RCC) × 0.90(no flood) × 1.0(≤10yr) × 0.92(basic security)
× 0.75(score 28) × 0.95(IoT 65) × 1.25(expense) × 1.18(GST) ≈ ₹8,450/year
Range: ₹7,183 — ₹9,718
```

---

## 9. Fraud Detection Engine

### 5-Component Scoring System (0-100 total)

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Amount Anomaly   │  │  Frequency      │  │  Duplicates     │
│    (0-25 pts)    │  │   (0-25 pts)    │  │   (0-25 pts)    │
└────────┬─────────┘  └────────┬────────┘  └────────┬────────┘
         │                     │                     │
┌────────┴─────────┐  ┌───────┴─────────┐           │
│ Timing Anomaly   │  │ Document Check  │           │
│    (0-15 pts)    │  │   (0-10 pts)    │           │
└────────┬─────────┘  └────────┬────────┘           │
         └────────────┬────────┘─────────────────────┘
                      ▼
              Fraud Score (0-100)
                      │
         ┌────────────┴────────────┐
         │                         │
    < 40: Auto-Approve     40-60: Manual Review
                           60-80: Investigate
                           ≥ 80: Reject
```

### Component 1: Amount Anomaly (0-25 pts)

Compares claim amount to policy-type average:

| Policy Type | Average Claim Amount | Threshold |
|---|---|---|
| Health | ₹75,000 | |
| Auto | ₹1,50,000 | |
| Life | ₹5,00,000 | |
| Property | ₹3,00,000 | |

| Ratio to Average | Points | Severity |
|---|---|---|
| > 3.0x | 25 | Critical |
| > 2.0x | 15 | Warning |
| > 1.5x | 8 | Info |
| ≤ 1.5x | 0 | Clean |

### Component 2: Frequency Check (0-25 pts)

Claims filed in last 180 days:

| Claims Count | Points | Severity |
|---|---|---|
| 4+ | 25 | Critical |
| 3 | 15 | Warning |
| 2 | 5 | Info |
| 0-1 | 0 | Clean |

### Component 3: Duplicate Detection (0-25 pts)

Looks for claims with: same policy type + similar amount (±20%) + within 90 days.

| Per Duplicate Found | Points |
|---|---|
| Each match | +12 (capped at 25) |
| Similarity score | `1 - amount_difference_ratio` |

### Component 4: Timing Anomaly (0-15 pts)

| Anomaly | Points | Severity |
|---|---|---|
| Claim filed ≤30 days after policy purchase | +10 | Warning |
| Incident ≤30 days after policy purchase | +10 | Warning |
| Incident on weekend or Indian holiday | +3 | Info |
| Claim filed >30 days after incident | +5 | Info |

*18 Indian holidays tracked (2026): Republic Day, Holi, Eid, Independence Day, Diwali, Christmas, etc.*

### Component 5: Document Adequacy (0-10 pts)

| Documents Submitted | Points | Severity |
|---|---|---|
| 0 documents | 8 | Warning |
| 1 document | 3 | Info |
| 2+ documents | 0 | Clean |

### Fraud Level Classification

| Score | Level | Recommendation | Action |
|---|---|---|---|
| 0-19 | Clean | auto_approve | No intervention needed |
| 20-39 | Low | auto_approve | Log only |
| 40-59 | Medium | manual_review | Manual review queue |
| 60-79 | High | investigate | Investigation required |
| 80-100 | Critical | reject | Automatic rejection |

---

## 10. STP (Straight-Through Processing)

### Complexity Score (0-100)

| Factor | Points | Condition |
|---|---|---|
| Claim amount < ₹50K | +20 | Low-value claim |
| Claim amount ₹50K-₹2L | +50 | Mid-value claim |
| Claim amount > ₹2L | +75 | High-value claim |
| Verified documents present | -10 | Supporting evidence |
| Policy active > 6 months | -10 | Established relationship |
| First claim ever | -10 | No pattern risk |
| Medical/accident type with docs | -5 | Well-documented incident |
| No prior fraud flags | -15 | Clean history |

### Classification

| Complexity Score | Level | STP Eligible? |
|---|---|---|
| < 30 | Low | Yes (if amount < ₹1,00,000) |
| 30-60 | Medium | No — manual review |
| ≥ 60 | High | No — manual review |

**Auto-Approved** = STP eligible AND amount < ₹1L AND fraud score < 40

---

## 11. Document Forensics

### 4-Layer Pixel-Level Verification

| Check | Method | Pass Criteria | Fail Criteria |
|---|---|---|---|
| **EXIF Metadata** | Extract camera make/model | Camera info present | Photoshop/GIMP/AI tools detected |
| **Error Level Analysis** | JPEG recompression difference | Variance ≤ 25 (uniform) | Variance > 50 (tampering patches) |
| **Noise Consistency** | Block-wise Laplacian filtering | Uniformity > 0.7 | Uniformity ≤ 0.4 (patchy = edited) |
| **Statistical Analysis** | Entropy + edge + color correlation | Entropy > 4, natural edges, correlated colors | 2+ anomaly flags |

### Verdict Calculation

| Condition | Verdict | Confidence |
|---|---|---|
| ≥ 2 checks failed | `likely_fake` | 60 + (fails × 15)%, max 95% |
| 1 check failed | `suspicious` | 55 + (passes × 10)% |
| ≥ 3 checks passed | `authentic` | 50 + (passes × 15)%, max 95% |
| Otherwise | Context-dependent | 50 + (passes × 10)% |

### Suspicious Software Detection

Flags: Photoshop, GIMP, Affinity, Canva, Figma, Illustrator, Midjourney, DALL-E, Stable Diffusion, AI-generated markers.

---

## 12. Alternative Data Scoring

### Driving Telematics (30-day period)

| Metric | Range | Risk Triggers |
|---|---|---|
| Overall Safety Score | 55-95 | < 60 = high risk |
| Harsh Braking Events | 0-12/week | > 8 = "Frequent harsh braking" |
| Speeding Events | 0-8/week | > 5 = "Speeding above threshold" |
| Night Driving | 5-35% | > 25% = "High night driving" |
| Phone Usage While Driving | 0-5 incidents | > 0 = flagged |
| Eco Score | 60-95 | < 70 = poor fuel efficiency |

### Health Wearable Score (90-day average)

```
Lifestyle Score = sum of:
  Steps > 7K/day:       30 pts  (else 15)
  Resting HR < 70 bpm:  25 pts  (else 10)
  Sleep > 7 hours:       20 pts  (else 8)
  Active > 30 min/day:   20 pts  (else 8)
  Stress < 40:           10 pts  (else 3)

Maximum: 105 → capped at 100
```

### Behavioral Analytics Score (12-month history)

```
Behavioral Score = sum of:
  Payment consistency > 85%:    35 pts  (else 20)
  Credit utilization < 30%:     25 pts  (else 10)
  Savings rate > 15%:           20 pts  (else 8)
  Job changes ≤ 1 in 12 months: 15 pts  (else 5)
  Current tenure > 3 years:     10 pts  (else 3)

Maximum: 105 → capped at 100
```

### Geographic Risk Assessment

```
Flood Risk Score = based on 7-day precipitation forecast:
  > 100mm:  0.85-1.0 (high)
  50-100mm: 0.5-0.85 (moderate)
  20-50mm:  0.2-0.5 (low)
  < 20mm:   < 0.2 (minimal)

Wind Risk Score = based on max wind speed:
  > 60 km/h:  0.8-1.0 (high)
  40-60 km/h: 0.45-0.8 (moderate)
  20-40 km/h: 0.2-0.45 (low)
  < 20 km/h:  < 0.2 (minimal)

Overall Geo Risk = flood × 0.65 + wind × 0.35
```

---

## 13. Fairness Audit

### Three Tests × Four Policy Types

#### Test 1: Gender Disparity

*"If we change ONLY gender and keep everything else identical, does the score change significantly?"*

| Threshold | Criteria |
|---|---|
| Score difference | < 5 points |
| Disparate impact ratio | > 0.8 (80% rule) |

**Formula:** `ratio = min(male_approval_rate, female_approval_rate) / max(...)`

**Results (all pass):**

| Policy | Male Mean | Female Mean | Diff | Impact Ratio |
|---|---|---|---|---|
| Health | 62.02 | 62.05 | 0.03 | 0.994 |
| Auto | 76.16 | 76.52 | 0.36 | 1.000 |
| Life | 46.82 | 46.84 | 0.02 | 0.992 |
| Property | N/A | N/A | N/A | N/A |

#### Test 2: Age Fairness

*"Is the age-risk curve smooth without extreme jumps?"*

| Threshold | Criteria |
|---|---|
| Max single jump | < 25 points |
| Minimum age effect | > 5 points total (except property) |

**Results (all pass):**

| Policy | Age 25 | 35 | 45 | 55 | 65 | 75 | Max Jump |
|---|---|---|---|---|---|---|---|
| Health | 44.0 | 48.0 | 54.6 | 62.1 | 68.3 | 77.7 | 9.4 |
| Auto | 41.1 | 27.2 | 27.1 | 27.1 | 27.2 | 33.5 | 13.9 |
| Life | 19.3 | 24.9 | 33.7 | 42.5 | 55.1 | 69.8 | 14.7 |
| Property | 34.4 | 34.4 | 34.6 | 34.6 | 34.9 | 35.0 | 0.3 |

#### Test 3: Income Disparity

*"Does income alone dominate the score unfairly?"*

| Threshold | Criteria |
|---|---|
| Max income impact alone | < 20 points |

**Results (all pass):**

| Policy | Low Income | High Income | Impact |
|---|---|---|---|
| Health | 76.4 | 58.8 | 17.7 |
| Auto | 82.0 | 66.2 | 15.8 |
| Life | 39.4 | 24.8 | 14.6 |
| Property | 53.7 | 34.6 | 19.1 |

---

## 14. API Reference

### Python Backend (FastAPI)

| Endpoint | Method | Description | Rate Limit |
|---|---|---|---|
| `/api/ml/score` | POST | Score assessment with ML model | 30/min |
| `/api/ml/score/models` | GET | List trained models + metrics | — |
| `/api/ml/score/metrics` | GET | Live prediction metrics (latency, distributions) | — |
| `/api/ml/score/fairness` | GET | Run fairness audit on all models | — |
| `/api/ml/score/fairness/{type}` | GET | Single model fairness audit | — |
| `/api/ml/score/registry` | GET | Model version history | — |
| `/api/ml/score/deployments` | GET | Deployment log | — |
| `/api/ml/score/cache/invalidate` | POST | Clear model cache | — |
| `/api/ml/weights/{type}` | GET | Get current weights for policy type | — |
| `/api/ml/weights` | POST | Save custom weights (must sum to 100) | — |
| `/api/ml/weights/reset/{type}` | POST | Reset weights to defaults | — |
| `/api/ml/weights/simulate` | POST | Compare default vs custom scoring | — |
| `/api/rag/search` | POST | Knowledge base TF-IDF search | — |
| `/api/rag/similar` | POST | Find similar past assessments | — |
| `/api/rag/documents` | GET | List all knowledge base documents | — |
| `/api/rag/stats` | GET | Knowledge base statistics | — |
| `/api/fraud/analyze` | POST | Analyze claim for fraud (5 checks) | — |
| `/api/verify` | POST | Document forensic verification | — |
| `/api/chat` | POST | Streaming chat with RAG grounding | — |
| `/health` | GET | Health check | — |

### Next.js Frontend API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/assessments` | GET/POST | List/create assessments |
| `/api/assessments/[id]/analyze` | POST | Trigger ML + LLM analysis |
| `/api/assessments/[id]/action` | POST | Underwriter accept/reject/modify |
| `/api/assessments/[id]/document` | GET | Generate assessment report HTML |
| `/api/assessments/batch` | POST | Batch scoring (max 50) |
| `/api/claims` | GET/POST | List/create claims (STP + fraud) |
| `/api/claims/[id]/settle` | POST | Approve/reject/dispute claim |
| `/api/extract` | POST | AI document extraction (8 types) |
| `/api/verify-document` | POST | Document authenticity check |
| `/api/telematics` | GET/POST | Generate mock telematics data |
| `/api/georisk` | POST | Geographic risk assessment |
| `/api/analytics` | GET | Dashboard metrics |
| `/api/audit` | GET | Audit trail |
| `/api/chat` | POST | Chat proxy to Python backend |
| `/api/explain` | POST | Plain-language explanation |
| `/api/upload` | POST | File upload to Cloudinary |
| `/api/email` | POST | Send notification emails |

---

## 15. Model Performance

| Policy | Test MAE | Test R² | CV R² (5-fold) | Score Range | Training Samples |
|---|---|---|---|---|---|
| Health | 3.06 | 0.9588 | 0.9514 ± 0.001 | 0-100 | 10,000 |
| Auto | 2.58 | 0.9741 | 0.9694 ± 0.001 | 0-100 | 10,000 |
| Life | 2.74 | 0.9772 | 0.9731 ± 0.001 | 0-100 | 10,000 |
| Property | 2.85 | 0.9653 | 0.9599 ± 0.002 | 0-100 | 10,000 |

**Interpretation:**
- **MAE 2.5-3.0:** Average prediction error is only 2.5-3 points on a 100-point scale
- **R² 0.96-0.98:** Models explain 96-98% of all variance in risk scores
- **CV R² ≈ Test R²:** Confirmed no overfitting via 5-fold cross-validation
- **Latency:** ~50ms per prediction (after initial model load)

### Top Feature Importance

| Rank | Health | Auto | Life | Property |
|---|---|---|---|---|
| 1 | Age (27%) | Accidents (24%) | **Age (46%)** | Flood Zone (29%) |
| 2 | Smoking (23%) | Age (23%) | Smoking (26%) | Prop Age (27%) |
| 3 | BMI (12%) | Violations (14%) | BMI (8%) | Income (14%) |
| 4 | Income (10%) | Credit (9%) | Income (8%) | Credit (10%) |
| 5 | Medical Hx (7%) | Income (7%) | Credit (5%) | Security (9%) |

### Sanity Check Results

| Scenario | Expected | Actual | Status |
|---|---|---|---|
| Healthy 25yo, BMI 22, non-smoker | Very low risk | Score ~0-10 | PASS |
| 65yo, BMI 38, smoker, 4 conditions | Very high risk | Score ~95+ | PASS |
| Safe 35yo driver, 15yr exp, clean | Low risk | Score ~0-10 | PASS |
| 19yo, 1yr exp, 3 accidents, 4 violations | Critical risk | Score ~100 | PASS |
| New RCC property, no flood, security | Low risk | Score ~0-10 | PASS |
| 60yr wood property, high flood, no security | Critical risk | Score ~100 | PASS |

---

## 16. Demo Script

### Pre-Demo Setup

```bash
# Terminal 1 — Python Backend
cd python
pip install -r requirements.txt
python -m ml.train          # Train all 4 models (one-time)
python -m ml.tests          # Verify all 16 tests pass
uvicorn main:app --reload   # Start on port 8000

# Terminal 2 — Next.js Frontend
cd client
npm install
npm run dev                 # Start on port 3000

# Terminal 3 — Seed Data (optional)
node seed-assessments.mjs   # Create 100 realistic assessments
node analyze-seeded.mjs     # Score them through ML backend
```

---

### Act 1: The Problem (30 seconds)

> "Traditional insurance in India uses just 3-4 data points — age, income, credit, medical history. Millions of healthy, responsible Indians are overcharged or denied coverage because they lack a paper trail. UnderwriteAI solves this with AI-powered underwriting using 12+ data sources."

---

### Act 2: Applicant Journey — Low Risk (3 minutes)

**Scene 1 — Policy Selection**
> Navigate to the dashboard. The applicant sees 4 policy types. Click **"Low Risk (Health)"** demo scenario.
> Pre-fills: 28F Software Engineer, income ₹12L, CIBIL 780, BMI 22, non-smoker, exercise 5x/week.

**Scene 2 — Document Upload & AI Extraction**
> "Upload an Aadhaar card. Our AI — Groq's Llama 4 Scout 17B vision model — extracts name, DOB, gender, address instantly. It supports 8 Indian document types. Each document also undergoes **forensic verification** — pixel-level analysis checking EXIF metadata, compression artifacts, noise consistency, and statistical patterns."

**Scene 3 — Alternative Data Consent**
> "The applicant consents to share telematics (wearable/phone), behavioral (financial patterns), and lifestyle data. This is the key differentiator — **12+ signals instead of just 4**."

**Scene 4 — ML Scoring**
> "On submit, the Stacked Ensemble model processes all 16 features:"
> - "GradientBoosting (300 trees) + RandomForest (200 trees) → Ridge meta-learner"
> - "Risk Score: **22/100** — Low Risk, APPROVED"
> - "Confidence: 89% (low variance across all trees)"
> - "Latency: 48ms"

**Scene 5 — Analysis Page**
> "The analysis shows:"
> - "**Traditional vs AI:** Traditional score was 35 (no alternative data). With telematics 85, behavioral 78, lifestyle 82 → AI score dropped to 22. **13-point improvement**."
> - "**Radar Chart:** All 8 risk factors visualized"
> - "**Premium:** ₹3,500–₹4,500/year for ₹5L health cover — calculated using IALM 2012-14 mortality tables"
> - "**RAG Citations:** Regulatory backing from IRDAI guidelines and actuarial benchmarks"

---

### Act 3: High Risk Comparison (1.5 minutes)

**Click "High Risk (Health)" demo**
> Pre-fills: 62M Retired, income ₹0, CIBIL 0, BMI 36, current smoker, diabetes + hypertension + heart disease.

> "Score: **88/100** — DECLINED."
> "Breakdown: base 35 + age(+25) + smoking(+26) + BMI(+22) + medical(+21) + income(+20) + credit(+18) − no alternative data offset = 88"
> "Premium would be ₹9L+/year if approved — the actuarial engine applies age factor 16x, smoking 1.4x, BMI 1.3x, morbidity 1.15x"
> "**Adverse Action Notice** automatically generated with specific reasons, improvement steps, and IRDAI regulatory citations from the RAG knowledge base."

---

### Act 4: Auto Insurance Demo (1 minute)

**Click "Young Driver (Auto)" demo**
> Pre-fills: 19M Student, no income, 1yr driving, 2 accidents, 3 violations, motorcycle.

> "Score: **~85** — DECLINED. Young age (+28) + accidents (2×14=+28) + violations (3×9=+27) compounds."
> "TP premium alone: ₹1,850 (IRDAI fixed for motorcycle). OD would be loaded 2.5x."

**Click "Safe Driver (Auto)" demo**
> Pre-fills: 38F Teacher, ₹7L income, CIBIL 750, 15yr exp, 0 accidents, 0 violations, Maruti Swift.

> "Score: **~20** — APPROVED preferred. Premium: ~₹18,000/year. NCB 25% discount + telematics 6% discount."

---

### Act 5: Admin Dashboard (2 minutes)

**Scene 1 — Risk Weights Configuration**
> "Admins can customize weights — default Health: Age 20%, Smoking 20%. Shift Telematics from 3% to 20%. The system recalculates with ±15 point cap. Shows strategy classification: 'Tech-Forward' if alternative data >30%."

**Scene 2 — Claims & Fraud Detection**
> "File an auto claim for ₹3L. Fraud engine runs 5 checks: Amount Anomaly (₹3L vs ₹1.5L avg → 2x ratio → 15pts), Frequency (first claim → 0), Duplicates (none → 0), Timing (2 months after purchase → OK), Documents (2 uploaded → 0). Total: **15 → Clean → Auto-approve eligible.**"
> "STP complexity: 75 (>₹2L → +75, docs -10, first claim -10, no fraud -15 = 40). Not auto-approved since complexity > 30. Goes to manual review."

**Scene 3 — Fraud Dashboard**
> "Shows: clean rate, investigation queue, pattern detection (duplicates, high-frequency, network links). Each flag has severity: info/warning/critical."

---

### Act 6: RAG-Powered Chat & Fairness (1 minute)

**Scene 1 — AI Chat**
> "Ask the chatbot 'Why was this applicant declined?' — it retrieves relevant knowledge base documents via TF-IDF, finds 3 similar historical cases from MongoDB, and generates a grounded explanation with citations."

**Scene 2 — Fairness Audit**
> "All 4 models pass all 3 fairness tests: Gender disparity < 5 points, age curve smooth (no >25 point jumps), income alone < 20 points impact. Compliant with IRDAI anti-discrimination guidelines."

---

### Closing (30 seconds)

> "UnderwriteAI combines:"
> 1. **Stacked Ensemble ML** — R² > 0.96, MAE < 3 points, 50ms latency
> 2. **RAG-Augmented Decisions** — 100+ domain documents, regulatory citations, similar case retrieval
> 3. **Actuarial Premium Engine** — IALM 2012-14 mortality tables, IRDAI tariffs
> 4. **12+ Data Sources** — telematics, behavioral, lifestyle, digital footprint
> 5. **Fraud Detection** — 5-factor scoring with STP auto-approval
> 6. **Document Forensics** — 4 pixel-level authenticity checks
> 7. **Fairness-First Design** — Gender, age, income bias tested before deployment
> 8. **Human-in-the-Loop** — AI advises, underwriter decides

---

## File Structure

```
python/
├── main.py                    # FastAPI entry point, CORS, rate limiting
├── requirements.txt           # Dependencies
├── config/
│   └── settings.py            # Environment variables, LLM config
├── ml/
│   ├── features.py            # 16 features per type, RAG smart defaults
│   ├── train.py               # 10K synthetic data generation + stacked ensemble
│   ├── predictor.py           # Thread-safe inference, contributions, adverse actions
│   ├── premium.py             # Actuarial engine (IALM 2012-14, IRDAI tariffs)
│   ├── weights.py             # Custom weight config, ±15pt adjustment
│   ├── fairness.py            # Gender, age, income disparity tests
│   ├── recommendations.py     # Product recommendations per policy type
│   ├── logger.py              # Structured logging, latency metrics, drift detection
│   ├── versioning.py          # Model registry, rollback, deployment log
│   ├── tests.py               # 16 tests (features, predictions, edge cases, fairness)
│   └── models/
│       ├── {type}_model.joblib     # Trained stacked ensemble models
│       ├── {type}_metrics.json     # Performance metrics
│       ├── {type}_weights.json     # Custom weight configurations
│       ├── {type}_data.csv         # 10K training samples
│       └── registry.json           # Version history
├── rag/
│   ├── retriever.py           # TF-IDF vector search (bigrams, 5K features)
│   ├── knowledge_base.py      # 100+ embedded domain documents (7 categories)
│   ├── similar_cases.py       # MongoDB-backed case retrieval
│   └── smart_defaults.py      # Population-average defaults by demographic bracket
├── routes/
│   ├── scoring.py             # POST /api/ml/score + fairness endpoints
│   ├── weights.py             # Weight CRUD + simulation
│   ├── fraud.py               # 5-component fraud scoring
│   ├── chat.py                # Streaming chat with RAG + similar cases
│   ├── rag.py                 # Knowledge search + similar cases API
│   ├── forensics.py           # Document verification proxy
│   └── suggestions.py         # Context-aware suggestion generation
├── services/
│   ├── llm.py                 # Groq API client (streaming + sync)
│   ├── prompts.py             # System prompt builder with full platform knowledge
│   ├── context.py             # MongoDB context builder for chat
│   └── document_forensics.py  # 4-layer pixel-level verification
├── actions/
│   ├── handler.py             # Intent-based action routing
│   ├── create.py              # LLM-powered assessment creation from chat
│   └── navigate.py            # Navigation action executor
└── utils/
    └── helpers.py             # Utility functions

client/
├── app/
│   ├── api/                   # 22 API route files
│   ├── admin/dashboard/       # Admin pages (weights, claims, fraud, compliance)
│   └── applicant/dashboard/   # Applicant pages (assess, history, claims)
├── components/                # 80+ React components
├── lib/
│   ├── models/                # MongoDB schemas (User, Assessment, Claim, Applicant)
│   ├── auth.js                # NextAuth config
│   └── mongodb.js             # Connection pooling
└── seed-assessments.mjs       # Database seeding (100 realistic Indian profiles)
```

---

## Quick Start

```bash
# 1. Install
cd python && pip install -r requirements.txt
cd ../client && npm install

# 2. Environment
# python/.env: MONGODB_URI, GROQ_API_KEY
# client/.env.local: MONGODB_URI, NEXTAUTH_SECRET, GROQ_API_KEY

# 3. Train ML Models
cd python && python -m ml.train    # Trains all 4 models (~2 min)

# 4. Verify
python -m ml.tests                  # 16 tests should pass
python -m ml.fairness               # All fairness tests should pass

# 5. Run
uvicorn main:app --reload           # Python backend on :8000
cd ../client && npm run dev         # Next.js frontend on :3000

# 6. Seed (optional)
node seed-assessments.mjs           # Create 100 test assessments
node analyze-seeded.mjs             # Score them through ML
```
