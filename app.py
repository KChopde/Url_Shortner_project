from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, HttpUrl
import hashlib
import os
import redis

app = FastAPI(title="Redis URL Shortener")
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
BASE = len(ALPHABET)

def base62_encode(n: int) -> str:
    if n == 0:
        return "0"
    out = []
    while n > 0:
        n, rem = divmod(n, BASE)
        out.append(ALPHABET[rem])
    return "".join(reversed(out))

class ShortenRequest(BaseModel):
    url: HttpUrl
    ttl_seconds: int | None = None
    dedupe: bool = True

class ShortenResponse(BaseModel):
    code: str
    short_url: str

@app.post("/shorten", response_model=ShortenResponse)
def shorten(req: ShortenRequest):
    long_url = str(req.url)

    # Optional: dedupe so same long URL returns same code
    rev_key = None
    if req.dedupe:
        h = hashlib.sha256(long_url.encode("utf-8")).hexdigest()
        rev_key = f"rev:{h}"
        existing = r.get(rev_key)
        if existing:
            return ShortenResponse(code=existing, short_url=f"{BASE_URL}/{existing}")

    # Generate unique id and code
    new_id = r.incr("global:counter")
    code = base62_encode(new_id)

    url_key = f"url:{code}"

    # Store mapping (with optional TTL)
    if req.ttl_seconds:
        r.set(url_key, long_url, ex=req.ttl_seconds)
        if rev_key:
            r.set(rev_key, code, ex=req.ttl_seconds)
    else:
        r.set(url_key, long_url)
        if rev_key:
            r.set(rev_key, code)

    return ShortenResponse(code=code, short_url=f"{BASE_URL}/{code}")

@app.get("/{code}")
def redirect(code: str):
    long_url = r.get(f"url:{code}")
    if not long_url:
        raise HTTPException(status_code=404, detail="Short URL not found")
    return RedirectResponse(url=long_url, status_code=307)
