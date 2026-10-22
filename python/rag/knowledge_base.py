"""
RAG Knowledge Base — IRDAI regulations, insurance domain knowledge,
underwriting guidelines, and platform documentation.

Each document has: id, text, category, source, metadata.
Categories: regulation, guideline, actuarial, platform, faq
"""

DOCUMENTS = [
    # ═══════════════════════════════════════════
    # IRDAI REGULATIONS & INDIAN INSURANCE LAW
    # ═══════════════════════════════════════════
    {
        "id": "irdai_001",
        "category": "regulation",
        "source": "IRDAI Health Insurance Regulations 2016, Section 16",
        "text": "Every insurer shall adopt a board-approved underwriting policy that clearly defines the criteria for acceptance, loading, and rejection of proposals. The underwriting policy shall not be unfairly discriminatory and shall be based on sound actuarial principles. Risk classification must be transparent and documented.",
    },
    {
        "id": "irdai_002",
        "category": "regulation",
        "source": "IRDAI (Protection of Policyholders' Interests) Regulations 2017, Section 6",
        "text": "An insurer or its agent shall provide all material information regarding the proposed policy to the prospect including premium, benefits, exclusions, loading, and terms of acceptance. The prospect shall be informed of the basis of risk classification applied to their proposal.",
    },
    {
        "id": "irdai_003",
        "category": "regulation",
        "source": "IRDAI Circular IRDA/HLT/MISC/CIR/174/11/2020",
        "text": "Insurers shall not deny coverage solely based on a single health parameter such as BMI, blood pressure, or age. A holistic assessment of the applicant's health profile, including lifestyle factors, medical history, family history, and current health status, must be conducted before arriving at an underwriting decision.",
    },
    {
        "id": "irdai_004",
        "category": "regulation",
        "source": "IRDAI Motor Insurance Guidelines 2024, Section 8.3",
        "text": "Premium calculation for motor insurance shall consider the vehicle's age, type, insured declared value, geographical zone, claims history, and the insured's driving record. Telematics data, where available with the insured's consent, may be used as a supplementary factor for risk-based pricing, provided it does not constitute the sole basis for premium determination.",
    },
    {
        "id": "irdai_005",
        "category": "regulation",
        "source": "IRDAI (Insurance Surety Bonds) Guidelines 2022, Section 4",
        "text": "Insurers shall ensure that the underwriting process for all insurance products is completed within a reasonable timeframe. Automated underwriting systems may be used provided they are regularly audited for accuracy, fairness, and compliance with applicable regulations.",
    },
    {
        "id": "irdai_006",
        "category": "regulation",
        "source": "Insurance Act 1938, Section 45 (amended 2015)",
        "text": "No policy of life insurance shall be called in question on any ground whatsoever after the expiry of three years from the date of the policy. The insurer must demonstrate that a material fact was suppressed fraudulently for repudiation within this period. This places the burden of thorough underwriting at the point of policy issuance.",
    },
    {
        "id": "irdai_007",
        "category": "regulation",
        "source": "IRDAI Guidelines on Insurance e-commerce 2017, Section 12",
        "text": "Digital underwriting platforms shall maintain complete audit trails of all risk assessment decisions, including the data inputs, model outputs, and any manual overrides. Such records shall be preserved for a minimum period of 8 years from the date of policy expiry or claim settlement.",
    },
    {
        "id": "irdai_008",
        "category": "regulation",
        "source": "IRDAI (Regulatory Sandbox) Regulations 2019",
        "text": "Insurers may apply for approval to use innovative technologies including artificial intelligence, machine learning, and telematics for underwriting and risk assessment under the regulatory sandbox framework. Such applications must demonstrate consumer protection, data privacy compliance, and fair treatment of policyholders.",
    },
    {
        "id": "irdai_009",
        "category": "regulation",
        "source": "IRDAI Annual Report 2023 — Underwriting Standards",
        "text": "The regulator has observed that AI-based underwriting systems can improve consistency and reduce processing times from days to minutes. However, insurers must ensure that automated systems do not perpetuate or amplify existing biases against protected groups including gender, caste, religion, or disability status.",
    },
    {
        "id": "irdai_010",
        "category": "regulation",
        "source": "IRDAI (Health Insurance) Regulations 2016, Section 21 — Adverse Actions",
        "text": "When an insurer declines a proposal or applies a loading, the insurer shall communicate the decision to the proposer in writing, clearly stating the reasons for the decision. The proposer shall be given an opportunity to provide additional information or clarification before the decision is finalized.",
    },

    # ═══════════════════════════════════════════
    # UNDERWRITING GUIDELINES
    # ═══════════════════════════════════════════
    {
        "id": "guide_001",
        "category": "guideline",
        "source": "UnderwriteAI Health Underwriting Guidelines v1.0",
        "text": "Health insurance risk assessment considers: age (27% weight), smoking status (25%), BMI (11%), annual income (10%), credit score (8%), medical history (8%), family history (5%), and alternative data sources (6%). A BMI above 30 combined with smoking history increases risk score by 15-25 points. Applicants with controlled chronic conditions (e.g., managed diabetes with HbA1c < 7) should be assessed at standard rates, not automatically loaded.",
    },
    {
        "id": "guide_002",
        "category": "guideline",
        "source": "UnderwriteAI Auto Underwriting Guidelines v1.0",
        "text": "Auto insurance risk assessment considers: accident history in last 5 years (23% weight), age (23%), traffic violations (13%), income (13%), credit score (10%), driving experience (8%), and telematics data (10%). Young drivers (18-25) with clean records and high telematics scores should receive standard rates. Telematics data showing consistent safe driving (score > 80) can offset age-related risk by up to 15 points.",
    },
    {
        "id": "guide_003",
        "category": "guideline",
        "source": "UnderwriteAI Life Underwriting Guidelines v1.0",
        "text": "Life insurance risk assessment considers: age (46% weight), smoking status (26%), BMI (8%), income (8%), credit score (5%), family history (7%). Age is the dominant factor in life insurance as it directly correlates with mortality risk. Non-smokers under 40 with no family history of critical illness typically qualify for preferred rates (score < 30).",
    },
    {
        "id": "guide_004",
        "category": "guideline",
        "source": "UnderwriteAI Property Underwriting Guidelines v1.0",
        "text": "Property insurance risk assessment considers: flood zone classification (29% weight), property age (27%), income (14%), security systems (9%), credit score (8%), construction type (8%), property value (5%). Properties in high flood zones with wood construction require mandatory loading. Comprehensive security systems (monitored alarms, sprinklers, CCTV) can reduce risk score by 8-12 points.",
    },
    {
        "id": "guide_005",
        "category": "guideline",
        "source": "UnderwriteAI Alternative Data Usage Policy v1.0",
        "text": "Alternative data sources are used to supplement, not replace, traditional underwriting factors. Telematics scores measure driving safety behavior (harsh braking, speeding, night driving). Behavioral scores assess financial responsibility (payment consistency, credit utilization). Lifestyle scores evaluate health habits (daily steps, sleep quality, exercise frequency). When alternative data is unavailable, a default penalty score of 0.3 (below average) is applied, not a zero score, to reflect uncertainty rather than assumed risk.",
    },

    # ═══════════════════════════════════════════
    # ACTUARIAL REFERENCE DATA
    # ═══════════════════════════════════════════
    {
        "id": "act_001",
        "category": "actuarial",
        "source": "Indian Insurance Industry — Premium Benchmarks 2024",
        "text": "Average health insurance premium in India for age group 25-35: ₹8,000-₹15,000/year for ₹5L cover. For age 35-45: ₹12,000-₹22,000/year. For age 45-55: ₹18,000-₹35,000/year. For age 55-65: ₹30,000-₹60,000/year. Smoker loading typically adds 25-50% to base premium. Pre-existing conditions may add 10-100% loading depending on severity and management.",
    },
    {
        "id": "act_002",
        "category": "actuarial",
        "source": "Indian Motor Insurance Statistics 2024",
        "text": "Average motor insurance claim ratio in India is 85-90%. Young drivers (18-25) have 2.5x higher accident rate than drivers aged 30-50. Telematics adoption can reduce claims frequency by 20-30% through safer driving incentives. Average comprehensive motor premium for a sedan in metro cities: ₹15,000-₹25,000/year. High-risk profiles (young, multiple accidents, violations): ₹35,000-₹60,000/year.",
    },
    {
        "id": "act_003",
        "category": "actuarial",
        "source": "Life Insurance Corporation of India — Mortality Tables",
        "text": "Indian mortality rates: age 25 male non-smoker: 0.8 per 1000; age 45 male non-smoker: 3.2 per 1000; age 65 male non-smoker: 18.5 per 1000. Smoking increases mortality by 2-3x. Female mortality rates are 20-30% lower than male rates at all ages. The mortality differential between smoker and non-smoker is the single largest actuarial factor in life insurance pricing.",
    },
    {
        "id": "act_004",
        "category": "actuarial",
        "source": "Indian Property Insurance — Risk Assessment Data 2024",
        "text": "India's average annual flood damage: ₹32,000 crore. Properties in Zone 4-5 (high seismic + flood) command 40-80% premium loading. Average property insurance rate: 0.1-0.3% of insured value for low-risk properties, 0.5-1.3% for high-risk. RCC construction reduces fire risk by 60% compared to wood frame. Properties with monitored security systems show 35% fewer burglary claims.",
    },

    # ═══════════════════════════════════════════
    # ADVERSE ACTION COMPLIANCE
    # ═══════════════════════════════════════════
    {
        "id": "adverse_001",
        "category": "regulation",
        "source": "IRDAI Adverse Action Notice Requirements",
        "text": "When an insurer declines or applies adverse terms to a proposal, the notice must include: (1) the specific reasons for the adverse decision, (2) the key factors that contributed to the decision, (3) information about the applicant's right to request reconsideration, (4) instructions for providing additional information. Reasons must be specific and factual, not generic. For example, 'elevated BMI of 34 combined with smoking history' is acceptable, while 'health reasons' alone is not.",
    },
    {
        "id": "adverse_002",
        "category": "regulation",
        "source": "ECOA/FCRA Equivalent — Indian Fair Lending Principles",
        "text": "Insurance underwriting must not discriminate based on gender, religion, caste, disability, or marital status. The 4/5 (80%) rule for disparate impact applies: if the approval rate for a protected group is less than 80% of the rate for the most-approved group, there may be a prima facie case of discrimination. Insurers using AI models must regularly audit for disparate impact across all protected categories.",
    },
    {
        "id": "adverse_003",
        "category": "guideline",
        "source": "UnderwriteAI Adverse Action Templates",
        "text": "Standard adverse action reasons by factor: (1) Age: 'Age-related risk profile exceeds standard underwriting thresholds for this policy type.' (2) Income: 'Reported income level affects the premium-to-income ratio sustainability assessment.' (3) Credit: 'Credit score below the standard threshold indicates elevated financial risk.' (4) Smoking: 'Tobacco use significantly increases actuarial risk for this policy category.' (5) BMI: 'Body mass index exceeds the standard range for preferred rating classification.' (6) Driving record: 'Accident and/or violation history indicates elevated driving risk.'",
    },

    # ═══════════════════════════════════════════
    # PLATFORM DOCUMENTATION
    # ═══════════════════════════════════════════
    {
        "id": "plat_001",
        "category": "platform",
        "source": "UnderwriteAI — ML Pipeline Documentation",
        "text": "The risk scoring pipeline uses a Stacked Ensemble model: Gradient Boosting Regressor (300 trees, depth 5, learning rate 0.08) and Random Forest (200 trees, depth 8) as base learners, with Ridge Regression (alpha=1.0) as the meta-learner. Training uses 5-fold cross-validation on 10,000 synthetic samples per policy type, calibrated to Indian market actuarial data. Performance: R² = 0.96-0.98, MAE = 2.5-3.0 on a 0-100 risk score scale. Prediction latency: ~50ms.",
    },
    {
        "id": "plat_002",
        "category": "platform",
        "source": "UnderwriteAI — Decision Thresholds",
        "text": "Risk score decision mapping: 0-30 = Approve (preferred rates, low risk), 31-55 = Approve (standard rates, moderate risk), 56-75 = Refer for manual review (high risk, underwriter must review), 76-100 = Decline (critical risk, adverse action notice required). These thresholds are consistent across all four policy types. The refer band (56-75) is intentionally wide to ensure borderline cases receive human judgment.",
    },
    {
        "id": "plat_003",
        "category": "platform",
        "source": "UnderwriteAI — Fairness Audit Framework",
        "text": "Three fairness tests run on all models: (1) Gender Disparity — identical profiles with only gender varied must produce < 5 point score difference and disparate impact ratio > 0.8. (2) Age Fairness — risk must increase smoothly with no single age-bracket jump exceeding 25 points. (3) Income Disparity — income alone must not swing the score by more than 20 points. All four models (health, auto, life, property) currently pass all three tests.",
    },
    {
        "id": "plat_004",
        "category": "platform",
        "source": "UnderwriteAI — Custom Weights System",
        "text": "Insurers can customize risk factor weights per policy type. Weights must sum to 100 per category. Custom weights can shift the final risk score by a maximum of ±15 points from the ML base prediction. The system provides strategy classification (Tech-Forward if alternative data weight > 30%, Traditional if < 5%, Balanced otherwise) and generates warnings for extreme configurations such as single-factor concentration > 35% or zero alternative data usage.",
    },

    # ═══════════════════════════════════════════
    # FAQ / COMMON QUESTIONS
    # ═══════════════════════════════════════════
    {
        "id": "faq_001",
        "category": "faq",
        "source": "UnderwriteAI FAQ",
        "text": "Q: Why was my application declined? A: Applications may be declined when the overall risk score exceeds 75 on a 0-100 scale. Key factors that drive high risk scores include: age above 60 combined with smoking history, multiple accidents in the past 5 years, very low income relative to coverage requested, or properties in high flood zones with inadequate security. You can view the specific factors that affected your score on your assessment detail page.",
    },
    {
        "id": "faq_002",
        "category": "faq",
        "source": "UnderwriteAI FAQ",
        "text": "Q: How can I improve my risk score? A: Several factors are within your control: (1) Quit smoking — this alone can reduce your health/life score by 15-25 points. (2) Improve credit score — pay bills on time, reduce credit utilization. (3) Provide telematics data — safe driving behavior can offset age risk by up to 15 points. (4) Install security systems — for property insurance, monitored security reduces risk by 8-12 points. (5) Complete your application — missing data defaults to risky assumptions and adds a completeness penalty of up to 12 points.",
    },
    {
        "id": "faq_003",
        "category": "faq",
        "source": "UnderwriteAI FAQ",
        "text": "Q: What is alternative data and how does it affect my premium? A: Alternative data includes telematics (driving behavior from OBD devices or smartphones), behavioral data (financial habits like payment consistency), lifestyle data (exercise, sleep from wearables), and social media risk indicators. This data supplements traditional factors to give a more complete picture. For example, a young driver with a clean telematics record may receive better rates than their age alone would suggest. Alternative data is always optional and requires your consent.",
    },
    {
        "id": "faq_004",
        "category": "faq",
        "source": "UnderwriteAI FAQ",
        "text": "Q: How does the fairness system work? A: Our platform runs automated bias audits on all ML models to ensure no protected group is unfairly treated. We test for gender disparity (score difference must be < 5 points), age fairness (no extreme jumps between age brackets), and income disparity (income alone cannot dominate the score). These tests align with IRDAI guidelines and the 4/5 (80%) rule for disparate impact. All models are required to pass all tests before deployment.",
    },

    # ═══════════════════════════════════════════
    # INSURANCE PRODUCT TYPES (PolicyBazaar-style)
    # ═══════════════════════════════════════════
    {
        "id": "prod_001",
        "category": "product",
        "source": "Indian Insurance Products — Term Life Insurance",
        "text": "Term life insurance provides pure death cover for a fixed period (10-40 years) at the lowest premiums. No maturity benefit — if the insured survives the term, no payout. Ideal for income replacement. In India, term plans from LIC, HDFC Life, ICICI Pru start from ₹500/month for ₹1Cr cover for a 25-year-old non-smoker. Premium is calculated using mortality tables (IALM 2012-14) × sum assured × policy term × risk loading. Key underwriting factors: age, smoking status, income, medical history. Return of Premium (TROP) variants refund all premiums if the insured survives.",
    },
    {
        "id": "prod_002",
        "category": "product",
        "source": "Indian Insurance Products — Health Insurance",
        "text": "Health insurance covers hospitalization expenses (room rent, surgery, ICU, medicines). Types: Individual, Family Floater, Senior Citizen, Critical Illness, Top-Up, Super Top-Up. IRDAI mandates guaranteed renewal, no lifetime cap, and pre-existing disease cover after waiting period (2-4 years). Premium depends on: age, sum insured (₹3L-₹1Cr), city tier, pre-existing conditions, lifestyle. No-claim bonus (NCB) gives 5-50% sum insured increase for claim-free years. Standard policies: Arogya Sanjeevani (₹5L at ₹5,000-₹15,000/year).",
    },
    {
        "id": "prod_003",
        "category": "product",
        "source": "Indian Insurance Products — Motor Insurance",
        "text": "Motor insurance in India has two components: Third-Party (mandatory, IRDAI-fixed rates) and Own Damage (market-driven, risk-based). TP rates for FY 2024-25: car ₹2,094, bike ₹1,850, truck ₹15,746. OD premium = IDV × rate (3.2-4.5%) × NCB discount (20-50%). Comprehensive = OD + TP. Add-ons: zero depreciation, engine protect, roadside assistance, consumables cover. Usage-based insurance (UBI) with telematics is emerging — Acko, Digit, Go Digit offer pay-as-you-drive models. IDV depreciation: 15% year-1, 20% year-2, up to 50% by year-5.",
    },
    {
        "id": "prod_004",
        "category": "product",
        "source": "Indian Insurance Products — Property Insurance",
        "text": "Property/home insurance covers structure and contents against fire, natural calamities, theft, and third-party liability. Types: Standard Fire & Special Perils (SFSP), Comprehensive Householder, Industrial All Risk. Premium = property value × base rate (0.05-0.15%) × peril loading. IRDAI tariff applies to SFSP policies. Construction type (RCC vs wood), location (flood/earthquake zone), security systems, and fire protection determine loading. Average premium: ₹3,000-₹15,000/year for ₹50L residential property. Earthquake cover is optional add-on in Zone III-V.",
    },
    {
        "id": "prod_005",
        "category": "product",
        "source": "Indian Insurance Products — ULIP (Unit Linked Insurance Plan)",
        "text": "ULIPs combine insurance + investment. Premium split: mortality charges + fund management + allocation to equity/debt funds. IRDAI mandates: minimum ₹2.5L life cover, 5-year lock-in, fund management charge capped at 1.35%, premium allocation charge capped at first 5 years. Suitable for long-term wealth creation (10+ years). Returns linked to market performance. Unlike term insurance, ULIPs have higher charges in early years. NAV-based pricing with daily valuation. Popular plans: HDFC Click 2 Wealth, ICICI Pru Signature, SBI Life Smart Wealth.",
    },
    {
        "id": "prod_006",
        "category": "product",
        "source": "Indian Insurance Products — Critical Illness Insurance",
        "text": "Critical illness plans pay a lump sum on diagnosis of specified diseases (heart attack, cancer, stroke, kidney failure, etc.). Unlike health insurance, it's a benefit policy — fixed payout regardless of actual expenses. Covers 10-35 critical illnesses depending on plan. Premium depends heavily on age and family history. Average premium: ₹3,000-₹8,000/year for ₹10L cover for age 30. Waiting period: 90 days from policy start. Key underwriting factor: family history of heart disease, cancer, diabetes. Can be standalone or rider on term/health plan.",
    },
    {
        "id": "prod_007",
        "category": "product",
        "source": "Indian Insurance Products — Travel Insurance",
        "text": "Travel insurance covers trip cancellation, medical emergencies abroad, baggage loss, flight delays, passport loss. Types: Single Trip, Annual Multi-Trip, Student, Senior Citizen. International travel: mandatory for Schengen visa (€30,000 minimum cover). Premium: ₹500-₹5,000 per trip for $50K-$500K cover depending on destination, duration, age. Key factors: destination risk (USA expensive due to medical costs), pre-existing conditions, adventure sports coverage. Domestic travel insurance: ₹100-₹300 per trip.",
    },
    {
        "id": "prod_008",
        "category": "product",
        "source": "Indian Insurance Products — Pension & Annuity Plans",
        "text": "Pension plans provide regular income post-retirement. Types: Deferred Annuity (accumulation phase + payout phase), Immediate Annuity (lump sum → regular income). IRDAI mandates minimum 4.5% annuity rate for immediate annuity. NPS (National Pension System) allows up to 75% equity allocation till age 50. Annuity options: life annuity, joint life, with return of purchase price, increasing annuity. Premium calculation uses survival tables (opposite of life insurance — longer life = more payouts). Key factor: age at vesting, annuity option chosen, prevailing interest rates.",
    },

    # ═══════════════════════════════════════════
    # PREMIUM CALCULATION METHODOLOGY
    # ═══════════════════════════════════════════
    {
        "id": "prem_001",
        "category": "actuarial",
        "source": "UnderwriteAI Premium Engine — Methodology",
        "text": "Health premium uses GLM-style: Base Rate (₹8K for ₹5L SI at age 30) × Age Factor (from IALM mortality table, interpolated) × Sum Insured Factor (linear scale) × ML Risk Loading (0.7x-3.0x from ensemble model) × Smoking Load (1.0/1.15/1.40) × BMI Load × NCB Discount (up to 15%) × Wellness Discount (up to 8% for high lifestyle score) × Expense Ratio (1.28) × GST 18%. Every factor is traceable and auditable.",
    },
    {
        "id": "prem_002",
        "category": "actuarial",
        "source": "UnderwriteAI Premium Engine — Motor Methodology",
        "text": "Motor premium = OD Premium + TP Premium + PA Cover. OD = IDV × published rate (3.2-4.5% by vehicle age) × risk factor from ML × NCB discount (IRDAI mandated 20-50%). TP = IRDAI fixed annual rate (₹2,094 for cars). PA cover = ₹750/year mandatory. Telematics discount up to 12% for safe driving. IDV calculated using IRDAI depreciation schedule (15% year-1 to 50% year-5). Expense loading 12% + GST 18%.",
    },
    {
        "id": "prem_003",
        "category": "actuarial",
        "source": "UnderwriteAI Premium Engine — Life Methodology",
        "text": "Life premium uses discounted mortality model: sum over policy term of [mortality_rate(age+t) × sum_assured × discount_factor(6.5%, t)], annualized. Mortality from IALM 2012-14 tables with linear interpolation. Risk loading from ML (0.8x-3.0x). Smoker surcharge 2.0x (actuarial: smoker mortality 2-3x higher). Over-insurance check: sum assured > 20x income triggers 15% loading. Expense ratio 22% blended. GST 12% blended (18% first year, 4.5% renewal).",
    },
]


def get_all_documents():
    """Return the full knowledge base."""
    return DOCUMENTS


def get_documents_by_category(category: str):
    """Filter documents by category."""
    return [d for d in DOCUMENTS if d["category"] == category]
