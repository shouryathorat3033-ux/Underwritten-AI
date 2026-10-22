# UnderwriteAI - Frontend Client

Intelligent insurance underwriting platform built with Next.js 16, React 19, and Tailwind CSS. Features AI-powered risk assessment, document intelligence, and role-based dashboards.

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 16 (App Router) | Framework + API routes |
| React 19 | UI rendering |
| Tailwind CSS | Styling |
| NextAuth v5 | Authentication (Credentials + Google OAuth) |
| MongoDB / Mongoose | Database |
| Groq SDK (Llama 3.3 70B) | AI explanations + document extraction |
| Cloudinary | Document storage |
| Framer Motion | Animations |
| Nodemailer | Email notifications |

## Architecture

```
client/
  app/
    api/                  # 16 API routes (server-side)
      assessments/        # CRUD + AI analysis
      auth/               # NextAuth handlers
      extract/            # AI document extraction (8 doc types)
      upload/             # Cloudinary file upload
      profile/            # Applicant profile management
      analytics/          # Dashboard analytics
      email/              # Email notifications
      signup/             # User registration
    dashboard/            # Protected dashboard (layout.js checks auth)
      assess/             # Multi-step assessment form
      assessment/[id]/    # Assessment detail + analysis
      history/            # Assessment history
      profile/            # Applicant profile + document upload
      analytics/          # Charts + trends
      fairness/           # ML fairness audit dashboard
      weights/            # Custom risk weight configuration
      policies/           # Policy management
    assess/               # Redirector -> /dashboard/assess or /signup
    login/                # Credentials + Google login
    signup/               # User registration
  components/
    assess/               # Assessment form components (PolicySelector, StepSidebar, etc.)
    chat/                 # AI chatbot (streaming, context-aware)
    landing/              # Landing page sections
    layout/               # Sidebar, Navbar, Footer, MobileNav
    motion/               # Framer Motion wrappers
    ui/                   # Reusable UI (Skeletons, ErrorState, PricingComparison)
  lib/
    auth.js               # NextAuth config (JWT + Google OAuth)
    mongodb.js            # MongoDB connection pooling
    models/               # Mongoose schemas (User, Assessment, Applicant)
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)
- Groq API key (for AI features)
- Cloudinary account (for document uploads)

### Installation

```bash
cd client
npm install
cp .env.example .env.local   # Fill in your credentials
npm run dev                   # http://localhost:3000
```

### Environment Variables

See `.env.example` for all required variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `NEXTAUTH_SECRET` | Yes | Random string for JWT signing |
| `NEXTAUTH_URL` | Yes | App URL (http://localhost:3000) |
| `GROQ_API_KEY` | Yes | Groq API key for LLM features |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth secret |
| `PYTHON_BACKEND_URL` | Yes | ML backend URL (http://localhost:8000) |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `EMAIL_USER` | No | Gmail for notifications |
| `EMAIL_PASS` | No | Gmail app password |
| `ADMIN_EMAIL` | No | Email that gets admin role on signup |

## User Roles

| Role | Access | Assigned |
|------|--------|----------|
| `applicant` | Create assessments, view own history, profile, documents | Default on signup |
| `underwriter` | Review all assessments, approve/decline, weight config, fairness audit | Set in DB |
| `admin` | All underwriter access + system config | Via `ADMIN_EMAIL` env |

## API Routes

### Authentication
- `POST /api/signup` - Register new user
- `GET/POST /api/auth/[...nextauth]` - NextAuth handlers

### Assessments
- `GET /api/assessments` - List assessments (role-filtered)
- `POST /api/assessments` - Create assessment (auth required)
- `POST /api/assessments/[id]/analyze` - Trigger AI analysis
- `POST /api/assessments/[id]/action` - Underwriter action (underwriter/admin only)

### Documents
- `POST /api/upload` - Upload to Cloudinary (10MB max, PDF/JPG/PNG)
- `POST /api/extract` - AI extraction from 8 document types

### Profile
- `GET /api/profile` - Get applicant profile (auto-creates if missing)
- `PUT /api/profile` - Update profile sections

### Analytics
- `GET /api/analytics` - Dashboard statistics (role-filtered)

## Key Features

### AI Document Extraction
Supports 8 Indian document types:
- Aadhaar Card (name, age, gender, address)
- PAN Card (name, PAN number)
- Salary Slip / Form 16 (income, employer)
- Medical Report (BMI, BP, conditions)
- Driving License (driving years)
- Vehicle RC (make, year, registration)
- Property Document (value, area, age)
- Insurance Policy (type, coverage, premium)

### ML Risk Scoring
Connects to Python backend (`PYTHON_BACKEND_URL`) for:
- 0-100 risk score from stacked ensemble model
- Feature importance breakdown
- Premium calculation (INR)
- Adverse action reasons for declined applicants
- Traditional vs AI-enhanced score comparison

### Fairness Auditing
Dashboard at `/dashboard/fairness` showing:
- Gender disparity test (< 5 point difference)
- Age fairness test (smooth, no jumps > 25 points)
- Income disparity test (< 20 point swing)

## Testing

```bash
npm test                    # Run all tests
npm test -- --coverage      # With coverage report
```

## Deployment

### Vercel (Recommended)
```bash
vercel --prod
```
Set all environment variables in Vercel dashboard.

## Related

- **Python ML Backend** - See `../python/` for the ML pipeline, model training, and FastAPI scoring server
- **ML Documentation** - See `../python/ml/README.md` for detailed model architecture and fairness audit results
