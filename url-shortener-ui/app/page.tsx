"use client";

import { useMemo, useState } from "react";

type ShortenResponse = {
  code: string;
  short_url: string;
};

export default function Home() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

  const [url, setUrl] = useState("");
  const [ttl, setTtl] = useState<string>(""); // keep as string for input box
  const [dedupe, setDedupe] = useState(true);

  const [result, setResult] = useState<ShortenResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const canSubmit = useMemo(() => {
    return url.trim().length > 0 && !loading;
  }, [url, loading]);

  async function onShorten(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    const ttlSeconds =
      ttl.trim() === "" ? null : Number.isFinite(Number(ttl)) ? Number(ttl) : NaN;

    if (ttlSeconds !== null && (Number.isNaN(ttlSeconds) || ttlSeconds <= 0)) {
      setError("TTL must be a positive number (seconds) or empty.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          ttl_seconds: ttlSeconds,
          dedupe,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }

      const data = (await res.json()) as ShortenResponse;
      setResult(data);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback: do nothing
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Redis URL Shortener</h1>
      <p style={{ color: "#555", marginBottom: 20 }}>
        Paste a long URL and generate a short one.
      </p>

      <form onSubmit={onShorten} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Long URL</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/very/long/path"
            style={{
              padding: 12,
              borderRadius: 10,
              border: "1px solid #ccc",
              fontSize: 16,
            }}
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 600 }}>TTL (seconds, optional)</span>
            <input
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
              placeholder="3600"
              inputMode="numeric"
              style={{
                padding: 12,
                borderRadius: 10,
                border: "1px solid #ccc",
                fontSize: 16,
              }}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 28 }}>
            <input
              type="checkbox"
              checked={dedupe}
              onChange={(e) => setDedupe(e.target.checked)}
            />
            <span style={{ fontWeight: 600 }}>Dedupe (same URL → same code)</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "none",
            fontSize: 16,
            fontWeight: 700,
            cursor: canSubmit ? "pointer" : "not-allowed",
            opacity: canSubmit ? 1 : 0.6,
          }}
        >
          {loading ? "Shortening..." : "Shorten URL"}
        </button>
      </form>

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #f3b0b0",
            background: "#ffecec",
            color: "#8a1f1f",
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <section
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 14,
            border: "1px solid #ddd",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Your short URL</div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <a href={result.short_url} target="_blank" rel="noreferrer" style={{ fontSize: 16 }}>
              {result.short_url}
            </a>
            <button
              onClick={() => copyToClipboard(result.short_url)}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #ccc",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Copy
            </button>
          </div>

          <div style={{ marginTop: 8, color: "#666" }}>
            Code: <b>{result.code}</b>
          </div>
        </section>
      )}

      <footer style={{ marginTop: 30, color: "#777", fontSize: 13 }}>
        API: <code>{API_BASE}</code>
      </footer>
    </main>
  );
}
