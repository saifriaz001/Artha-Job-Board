# 🧠 Artha Job Board – Full Stack Developer (MERN) Task

A scalable job ingestion and monitoring system that fetches job listings from multiple RSS feeds, processes them asynchronously via BullMQ + Redis, stores unique jobs in MongoDB, and provides an admin dashboard built with Next.js to visualize import history and system health.

---

## 🚀 Tech Stack

|    Layer        |  Technology |
|-----------------|-------------|
| **Frontend**    | Next.js (App Router) + TailwindCSS |
| **Backend**     | Node.js (Express) |
| **Database**    | MongoDB (Mongoose) |
| **Queue**       | BullMQ |
| **Queue Store** | Redis Cloud |
| **Scheduler**   | Node-cron |
| **Deployment**  | Vercel (Frontend), Render (Backend), MongoDB Atlas, Redis Cloud |

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository
```bash
git clone https://github.com/yourusername/artha-job-board.git
cd artha-job-board
``` 
### 2️⃣ Backend Setup
```bash
cd server
npm install
cp .env.example .env
npm run dev
``` 
Runs on: http://localhost:4000
Example endpoint: GET /api/import/trigger

### 3️⃣ Frontend Setup
```bash
cd ../client
npm install
npm run dev
```
Runs on: http://localhost:3000

## Environment Variables
### server/.env.example
```bash
PORT=4000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/jobs
REDIS_URL=redis://default:<password>@redis-xxxxx.redns.redis-cloud.com:13662
JOB_FEEDS=https://jobicy.com/?feed=job_feed,https://jobicy.com/?feed=job_feed&job_categories=data-science,https://www.higheredjobs.com/rss/articleFeed.cfm
QUEUE_CONCURRENCY=10
QUEUE_MAX_RETRIES=5
QUEUE_BACKOFF_MS=3000
IMPORT_TRIGGER_URL=http://localhost:4000/api/import/trigger
```

### client/.env.local
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 🧮 Features

Fetches multiple RSS feeds (Jobicy, HigherEdJobs)
Normalizes and deduplicates jobs via SHA1 hashing
Pushes jobs to Redis-backed BullMQ queue
Worker processes jobs with retry and backoff logic
Cron triggers imports automatically every hour
Dashboard shows feed-wise import history with auto-refresh

### How to Test

Start backend (npm run dev)
Start worker (npm run worker)
Start frontend (npm run dev)
Visit http://localhost:3000
 → View import history table
Or manually trigger import via:
```bash
curl -X POST http://localhost:4000/api/import/trigger
```

### Key Design Decisions
BullMQ + Redis: Enables parallel job processing and persistence.
MongoDB: Ideal for flexible storage of varying job data.
Deduplication Logic: Based on job URL (externalId) and hash of job content.
Scalable Architecture: Independent worker and API processes allow horizontal scaling.
Configurable Behavior: Queue concurrency and backoff durations controlled via .env.

### Bonus Implementations
Auto-refreshing dashboard (every minute)
Status badges (Running / Completed / Failed)
Node-cron automation
Environment-driven concurrency, retries, and backoff
Deployed-ready structure (Vercel + Render)

### Future Enhancements

Real-time updates via Socket.IO
Aggregated analytics (daily jobs imported)
Slack/email alerts on failed feeds
Role-based admin authentication
Integration with Elasticsearch for job search

## 🧭 System Architecture Diagram

```text
                         ┌──────────────────────────┐
                         │        CRON JOB          │
                         │ (Node-cron Scheduler)    │
                         └────────────┬─────────────┘
                                      │  triggers every hour
                                      ▼
                        ┌──────────────────────────────┐
                        │       EXPRESS API SERVER      │
                        │  (Routes, Controllers,        │
                        │   Feed Fetch + Normalizer)    │
                        └────────────┬──────────────────┘
                                      │  pushes normalized jobs
                                      ▼
                       ┌────────────────────────────────┐
                       │      REDIS QUEUE (BullMQ)       │
                       │   Queue + Retry + Backoff Mgmt  │
                       └────────────┬────────────────────┘
                                      │  consumed by worker
                                      ▼
                    ┌──────────────────────────────────────────┐
                    │           WORKER PROCESS (BullMQ)        │
                    │   - Computes hash                        │
                    │   - Dedupes via MongoDB                  │
                    │   - Inserts/updates Job + ImportLog      │
                    └──────────────────┬───────────────────────┘
                                       │
                                       ▼
                     ┌─────────────────────────────────────────┐
                     │           MONGODB (Mongoose)             │
                     │   - Jobs Collection                      │
                     │   - ImportLogs Collection                │
                     └─────────────────┬───────────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────────┐
                    │      NEXT.JS ADMIN DASHBOARD (UI)        │
                    │   - Fetches /api/import/logs             │
                    │   - Displays table + summary cards       │
                    │   - Auto-refresh every 60 sec            │
                    └──────────────────────────────────────────┘
```

## ⚙️ Data Flow

1. **Scheduler (Node-cron)**  
   - Triggers `/api/import/trigger` every hour (or manually via endpoint).
2. **Feed Fetcher (Service Layer)**  
   - Fetches jobs from multiple feeds listed in `JOB_FEEDS` env variable.
   - Normalizes them into a consistent structure (title, description, link, etc.).
3. **Queue Dispatcher**  
   - Pushes each normalized job into BullMQ (`job-import-queue`).
   - Each job is uniquely identified by its external link (`externalId`).
4. **Worker (jobImport.worker.js)**  
   - Listens for new jobs from Redis.
   - Computes a content hash and checks MongoDB for existing entry.
   - If new → inserts. If changed → updates. Else → skip.
   - Updates ImportLog with stats (newJobs, updatedJobs, failedJobs).
5. **Database (MongoDB)**  
   - Stores two collections:
     - `jobs` → all unique job postings.
     - `import_logs` → history of each import run.
6. **Admin Dashboard (Next.js)**  
   - Displays `import_logs` with feed URL, counts, and timestamps.
   - Auto-refreshes every minute to reflect new imports.

---

## 🧠 Design Rationale

| Decision | Justification |
|-----------|----------------|
| **BullMQ over simple loops** | Enables parallel processing, retries, and future scaling via multiple workers. |
| **MongoDB + Mongoose** | Flexible schema for varying job fields and quick queries. |
| **Redis Cloud** | Persistent queue store accessible by multiple worker instances. |
| **Next.js (App Router)** | Fast rendering, simple API consumption, Tailwind UI ease. |
| **Modular Code Organization** | Separate controllers, services, models, and queues enable microservice migration later. |

---

## 🧩 Modular Design

| Layer | Description |
|-------|--------------|
| **Controller** | Handles route logic like `/api/import/trigger`. |
| **Service** | Fetches and normalizes job feeds. |
| **Queue** | Manages BullMQ producer and worker. |
| **Model** | Defines Job and ImportLog schemas. |
| **Utils** | Shared helpers (hashing, logging, Redis config). |

---

## 🔁 Retry & Backoff Logic
Jobs have retry logic configured via `.env`:
```bash
QUEUE_MAX_RETRIES=5
QUEUE_BACKOFF_MS=3000
Retries failed jobs up to 5 times
Uses exponential backoff between retries
```