# OpSim GPE

**Live Application:** [https://tacticore-ai.vercel.app/](https://tacticore-ai.vercel.app/)

OpSim GPE is an AI-powered web-based tactical simulation platform designed to modernize the traditional SSB Group Planning Exercise (GPE) system.

## Features
- Multi-phase GPE workflow (Briefing → Individual Planning → Group Discussion → Consolidation → Presentation)
- Real-time collaborative planning board with proposals, voting, and challenges
- AI-powered OLQ (Officer Like Qualities) analysis engine scoring 14 OLQs
- Instructor dashboard with session management and AI-generated reports
- Master Plan panel with resource conflict detection

## Tech Stack
- **Frontend:** React + Vite
- **Backend:** Node.js + Express + Socket.io
- **Database:** MongoDB
- **AI Engine:** Rule-based behavioral OLQ analyzer

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB connection (Atlas or local)

### Setup
```bash
# Backend
cd backend
npm install
cp .env.example .env   # Add your MONGO_URI
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Default Instructor Accounts
| Role | Email | Password |
|------|-------|----------|
| IO | io@gov.in | io@12345 |
| Psychologist | psych@gov.in | psych@12345 |
| GTO | gto@gov.in | gto@12345 |
