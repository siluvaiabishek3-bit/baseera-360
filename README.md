# 🏢 BASEERA 360 - Facade Inspection Platform

**Professional drone-powered facade inspection, defect mapping, and building condition assessment system**

A complete SaaS platform for engineers and contractors to inspect building facades using drone imagery, thermal analysis, 3D models, and 360° panoramas.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Development](#-development)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Contributing](#-contributing)

---

## ✨ Features

### Core Functionality
- ✅ **Multi-modal Media Support** - RGB images, thermal (R-JPEG), video, 3D models, 360° panoramas
- ✅ **Advanced Annotation System** - Defect mapping with severity levels and remedial actions
- ✅ **Thermal Analysis** - Temperature readings, anomaly detection, heat loss visualization
- ✅ **3D Model Viewer** - Interactive OBJ/FBX/IFC models with Level-of-Detail support
- ✅ **360° Panorama Viewer** - Immersive navigation with measurements and hotspots
- ✅ **Intelligent Reporting** - Generate PDF reports filtered by defect type, severity, zone
- ✅ **Role-Based Access Control** - Admin, Engineer, Client, Viewer roles
- ✅ **Real-time Notifications** - Assignment notifications, status updates
- ✅ **Activity Audit Trail** - Complete history of all changes

### Technical Features
- ✅ **Multi-tenancy** - Support for multiple organizations
- ✅ **JWT Authentication** - Secure token-based auth with refresh tokens
- ✅ **Rate Limiting** - Built-in API rate limiting
- ✅ **Error Handling** - Comprehensive error codes and logging
- ✅ **Database Transactions** - ACID transactions for data integrity
- ✅ **Soft Deletes** - Safe data deletion with recovery capability
- ✅ **Responsive Design** - Works on desktop, tablet, mobile
- ✅ **Dark Mode** - Theme switching support

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 13+
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Logging**: Winston

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Forms**: React Hook Form
- **3D Graphics**: Three.js + React Three Fiber
- **Maps**: Leaflet + React Leaflet
- **Styling**: Tailwind CSS
- **Charts**: Recharts

### DevOps & Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **CI/CD**: GitHub Actions (ready)
- **Cloud**: AWS S3 / Azure Blob (configured)
- **Database Admin**: pgAdmin

---

## 📁 Project Structure

```
baseera-360/
├── backend/                          # Node.js/Express API server
│   ├── src/
│   │   ├── config/                  # Configuration & database
│   │   ├── middleware/              # Auth, error handling, logging
│   │   ├── routes/                  # API endpoints
│   │   ├── services/                # Business logic (TODO)
│   │   ├── controllers/             # Request handlers (TODO)
│   │   ├── types/                   # TypeScript definitions
│   │   ├── utils/                   # Helper functions (TODO)
│   │   └── index.ts                 # Entry point
│   ├── migrations/                  # Database migrations
│   ├── seeds/                       # Database seed data
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                         # React SPA
│   ├── src/
│   │   ├── components/              # Reusable React components
│   │   ├── pages/                   # Page components
│   │   ├── services/                # API client services
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── context/                 # Context for state
│   │   ├── types/                   # TypeScript definitions
│   │   ├── utils/                   # Helper utilities
│   │   ├── assets/                  # Images, icons, fonts
│   │   ├── App.tsx                  # Root component
│   │   └── main.tsx                 # Entry point
│   ├── public/                      # Static files
│   ├── package.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── database/                         # Database schemas & migrations
│   └── schema.sql                   # Full PostgreSQL schema
│
├── docker-compose.yml               # Local development setup
├── README.md                        # This file
└── .github/
    └── workflows/                   # CI/CD pipelines (TODO)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker & Docker Compose (for containerized setup)
- PostgreSQL 13+ (if not using Docker)
- Git

### Option 1: Docker Compose (Recommended for Development)

```bash
# Clone repository
git clone https://github.com/your-org/baseera-360.git
cd baseera-360

# Copy environment file
cp backend/.env.example backend/.env

# Start all services (backend, frontend, PostgreSQL, pgAdmin, Redis)
docker-compose up -d

# Wait for services to start (about 30 seconds)
docker-compose logs -f

# Access the application:
# Frontend: http://localhost:3001
# Backend API: http://localhost:3000/api
# pgAdmin: http://localhost:5050 (email: admin@baseera.ae, password: admin)
# API Docs: http://localhost:3000/api/docs
```

### Option 2: Local Development

**Backend Setup:**
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update DATABASE_URL in .env to your PostgreSQL instance
# DATABASE_URL=postgresql://user:password@localhost:5432/baseera_360

# Run database migrations
npm run migrations:run

# Start development server
npm run dev

# Server runs on http://localhost:3000
```

**Frontend Setup:**
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:3000/api" > .env

# Start development server
npm run dev

# App runs on http://localhost:5173
```

---

## 💻 Development

### Backend Development

**Common Commands:**
```bash
cd backend

npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm test             # Run unit tests
npm run migrations:create  # Create new database migration
npm run seed         # Seed database with test data
```

**Database Migrations:**
```bash
# Create migration
npm run migrations:create -- create_users_table

# This creates a file in migrations/
# Edit the file with your SQL
# Run migrations
npm run migrations:run
```

**Database Seeding:**
```bash
# Seed test data
npm run seed

# This populates the database with sample organizations, projects, users
```

### Frontend Development

**Common Commands:**
```bash
cd frontend

npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

**Component Development:**
- Components are in `src/components/`
- Pages are in `src/pages/`
- Follow React hooks best practices
- Use TypeScript for type safety
- Tailwind CSS for styling

### Code Standards

**TypeScript:**
- Strict mode enabled
- No `any` types
- Use interfaces for type definitions
- Proper error handling

**Comments & Documentation:**
```typescript
/**
 * Get user by email
 * @param email - User email address
 * @returns User object or null if not found
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  // Implementation
}
```

---

## 🐳 Deployment

### Build Docker Images

```bash
# Backend
docker build -t baseera-360-backend:latest ./backend

# Frontend
docker build -t baseera-360-frontend:latest ./frontend

# Test locally
docker run -p 3000:3000 baseera-360-backend:latest
docker run -p 3001:3000 baseera-360-frontend:latest
```

### Deploy to AWS ECS

```bash
# Push images to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker tag baseera-360-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/baseera-360-backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/baseera-360-backend:latest

# Use ECS/CloudFormation for orchestration
```

### Environment Variables for Production

```bash
# Backend
NODE_ENV=production
DATABASE_URL=postgresql://user:password@db-instance.rds.amazonaws.com:5432/baseera_360
JWT_SECRET=your-secret-key-min-32-characters
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
CORS_ORIGIN=https://app.baseera.ae
LOG_LEVEL=info

# Frontend
REACT_APP_API_URL=https://api.baseera.ae
```

---

## 📚 API Documentation

### Authentication

**Login:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "engineer@baseera.ae",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user-uuid",
      "email": "engineer@baseera.ae",
      "role": "ENGINEER"
    }
  }
}
```

### Projects

**List Projects:**
```bash
GET /api/projects
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "projects": [...],
    "total": 5,
    "limit": 50,
    "offset": 0
  }
}
```

**Create Project:**
```bash
POST /api/projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "projectName": "Marina Tower Inspection",
  "buildingName": "Marina Tower",
  "jobNumber": "MAR-2024-001",
  "facadeType": "Glass Curtain Wall",
  "clientName": "DAMAC Properties",
  "latitude": 28.5244,
  "longitude": 55.2764
}
```

### Annotations

**Create Annotation:**
```bash
POST /api/annotations
Authorization: Bearer {token}
Content-Type: application/json

{
  "projectId": "project-uuid",
  "buildingZoneId": "zone-uuid",
  "defectType": "CRACK",
  "severity": "HIGH",
  "title": "Diagonal facade crack",
  "description": "4-meter crack on north wall",
  "recommendedAction": "Structural assessment and repair",
  "estimatedCostUsd": 15000
}
```

**List Annotations:**
```bash
GET /api/annotations?projectId=project-uuid&severity=HIGH,CRITICAL
Authorization: Bearer {token}
```

---

## 🗄️ Database Schema

The complete PostgreSQL schema is in `database/schema.sql`

**Key Tables:**
- `users` - User accounts
- `organizations` - Multi-tenant orgs
- `projects` - Inspection projects
- `media_assets` - Images, videos, 3D models, panoramas
- `annotations` - Defects and findings
- `annotations_comments` - Discussion threads
- `thermal_readings` - Temperature data points
- `model_3d` - 3D building models
- `panoramas` - 360° images
- `reports` - Generated inspection reports

**Views:**
- `v_projects_with_stats` - Projects with defect counts
- `v_annotation_summary` - Defect distribution
- `v_defect_heatmap` - Zone-based severity heatmap

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:watch
```

### Frontend Tests
```bash
cd frontend
# Vitest configuration (TODO)
npm test
```

---

## 📊 Monitoring & Logging

### Application Logs
```bash
# View backend logs
docker logs baseera-360-backend

# Real-time logs
docker logs -f baseera-360-backend

# Database logs
docker logs baseera-360-postgres
```

### Database Health
```bash
# Connect to PostgreSQL
psql postgresql://baseera_app:secure_password@localhost:5432/baseera_360

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables WHERE schemaname != 'pg_catalog'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check query performance
SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

---

## 🔐 Security

- **Password Hashing**: bcrypt with 10 rounds
- **Token Expiry**: 7 days for JWT tokens
- **HTTPS**: Enabled in production
- **CORS**: Whitelist configured domains
- **SQL Injection**: Parameterized queries
- **Rate Limiting**: 100 requests per 15 minutes
- **Input Validation**: Zod schema validation
- **Non-root User**: Docker container runs as nodejs user

---

## 📝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

**Code Review Process:**
- All PRs require 2 approvals
- Must pass linting and tests
- No console.log() in production code
- Update documentation if needed

---

## 📄 License

This project is proprietary software owned by BASEERA 360. Unauthorized use is prohibited.

---

## 📞 Support & Contact

- **Website**: https://baseera.ae
- **Email**: support@baseera.ae
- **Location**: Dubai, UAE
- **Slack Channel**: #baseera-360-dev

---

## 🎯 Roadmap

- [ ] **Phase 1 (MVP)**: Auth, Projects, Media Upload, Annotations (Current)
- [ ] **Phase 2**: 3D Models, Thermal Analysis, Advanced Filtering
- [ ] **Phase 3**: 360° Panoramas, Measurements, Hyperlinks
- [ ] **Phase 4**: GIS Map View, Advanced Analytics, WebGIS Integration
- [ ] **Phase 5**: Mobile App, Offline Mode, Real-time Collaboration
- [ ] **Phase 6**: AI-powered Defect Detection, Auto-Classification

---

**Version**: 1.0.0 | **Last Updated**: May 2024 | **Maintained by**: BASEERA 360 Development Team
