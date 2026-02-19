# Redis URL Shortener (FastAPI + Redis + Next.js)

A simple URL shortener:
- **POST /shorten** → generates a short code and stores it in Redis
- **GET /{code}** → redirects to the original long URL
- **Next.js UI** → paste URL, generate short link, copy/share

---

## Tech Stack
- **Backend:** FastAPI (Python)
- **Store:** Redis
- **Frontend:** Next.js (App Router)

---

## Project Structure (suggested)
project-root/
backend/
app.py
requirements.txt
frontend/
app/page.tsx
package.json
.env.local


---

## Prerequisites
- Python 3.10+
- Node.js 18+
- Docker Desktop (recommended for Redis)

---

## 1) Start Redis (Windows/macOS/Linux)

### Option A: Docker (recommended)
```bash
docker run --name redis -p 6379:6379 -d redis:7-alpine

verify using below command expected reply PONG:
docker exec -it redis redis-cli ping

If you get “name already in use”:

docker rm -f redis


2) Run Backend (FastAPI)
2.1 Create virtual environment
cd backend
python -m venv .venv

Activate venv

Windows (PowerShell):

.\.venv\Scripts\Activate.ps1


Windows (CMD):

.\.venv\Scripts\activate.bat


macOS/Linux:

source .venv/bin/activate

2.2 Install dependencies

Install:

pip install -r requirements.txt

2.3 Set environment variables

Windows PowerShell

$env:REDIS_URL="redis://localhost:6379/0"
$env:BASE_URL="http://localhost:8000"


macOS/Linux

export REDIS_URL="redis://localhost:6379/0"
export BASE_URL="http://localhost:8000"


2.4 Start FastAPI
uvicorn app:app --reload --port 8000


Open Swagger docs:

http://localhost:8000/docs

(Optional) If you added /health endpoint:

http://localhost:8000/health

3) Run Frontend (Next.js UI)
cd ../frontend
npm install


Create frontend/.env.local:

NEXT_PUBLIC_API_BASE=http://localhost:8000


Start Next.js:

npm run dev


Open UI:

http://localhost:3000

4) How to Use
From UI

Paste a long URL

(Optional) Enter TTL seconds

Click Shorten URL

Copy and open the short URL

From API (curl)
curl -X POST "http://localhost:8000/shorten" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/very/long/path","ttl_seconds":3600,"dedupe":true}'


Then open:

http://localhost:8000/
<code>

5) See stored URLs in Redis