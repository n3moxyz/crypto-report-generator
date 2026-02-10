"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

interface ArchiveEntry {
  date: string;
  dateLabel: string;
  content: string;
  images: string[];
}

function formatContent(text: string): string {
  // Replace *text* with <strong>text</strong> (Telegram bold markdown)
  return text.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");
}

export default function ArchivePage() {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [archivePassword, setArchivePassword] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setPasswordError("");

    try {
      const response = await fetch("/api/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, type: "archive" }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setArchivePassword(password);
        setPassword("");
        fetchArchive(password);
      } else {
        const data = await response.json();
        setPasswordError(data.error || "Incorrect password");
      }
    } catch {
      setPasswordError("Failed to verify password");
    } finally {
      setIsVerifying(false);
    }
  };

  const fetchArchive = async (pwd: string) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/archive", {
        headers: { "x-archive-password": pwd },
      });
      if (!res.ok) throw new Error("Failed to fetch archive");
      const data = await res.json();
      setEntries(data.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load archive");
    } finally {
      setIsLoading(false);
    }
  };

  // Password gate — show modal before anything else
  if (!isAuthenticated && mounted) {
    return createPortal(
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-primary"
      >
        <div
          className="card p-6 w-full max-w-sm mx-4"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-primary" style={{ fontSize: "var(--text-lg)" }}>
              Password Required
            </h3>
            <Link
              href="/"
              className="text-muted hover:text-primary transition-colors"
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>

          <p className="text-secondary mb-4" style={{ fontSize: "var(--text-sm)" }}>
            Enter the password to view the archive.
          </p>

          <form onSubmit={handlePasswordSubmit}>
            <div className="relative mb-3">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-3 py-2 pr-10 rounded-lg text-primary"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color)",
                  fontSize: "var(--text-base)",
                }}
                autoFocus
                autoComplete="current-password"
                aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {passwordError && (
              <p className="mb-3" style={{ fontSize: "var(--text-sm)", color: "var(--danger)" }}>
                {passwordError}
              </p>
            )}

            <div className="flex gap-2">
              <Link
                href="/"
                className="btn flex-1 text-center"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isVerifying || !password}
                className="btn btn-primary flex-1"
              >
                {isVerifying ? "Verifying..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className="bg-primary" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "24px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <Link
            href="/"
            className="btn-ghost"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "var(--text-sm)",
              textDecoration: "none",
              marginBottom: "16px",
              padding: "6px 10px",
              borderRadius: "var(--radius-sm)",
            }}
          >
            &larr; Back
          </Link>
          <h1
            className="text-primary"
            style={{
              fontSize: "var(--text-2xl)",
              fontWeight: 600,
              margin: 0,
            }}
          >
            Market Update Archive
          </h1>
          <p
            className="text-muted"
            style={{
              fontSize: "var(--text-sm)",
              marginTop: "4px",
            }}
          >
            Historical market updates and charts
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div
            className="card"
            style={{
              padding: "40px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "6px",
                marginBottom: "12px",
              }}
            >
              <div className="loading-dot" />
              <div className="loading-dot" />
              <div className="loading-dot" />
            </div>
            <p className="text-muted" style={{ fontSize: "var(--text-sm)", margin: 0 }}>
              Loading archive...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            className="card"
            style={{
              padding: "20px",
              textAlign: "center",
              borderColor: "var(--danger)",
            }}
          >
            <p style={{ color: "var(--danger)", margin: 0, fontSize: "var(--text-sm)" }}>
              {error}
            </p>
          </div>
        )}

        {/* Entries */}
        {!isLoading && !error && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {entries.map((entry) => (
              <article key={entry.date} className="card" style={{ padding: "24px" }}>
                {/* Date header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "16px",
                    paddingBottom: "12px",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "var(--accent)",
                      flexShrink: 0,
                    }}
                  />
                  <h2
                    className="text-primary"
                    style={{
                      fontSize: "var(--text-lg)",
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {entry.dateLabel}
                  </h2>
                </div>

                {/* Text content */}
                <div
                  className="text-secondary"
                  style={{
                    fontSize: "var(--text-base)",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: formatContent(entry.content),
                  }}
                />

                {/* Images — pass password via fetch, render as blob URLs */}
                {entry.images.length > 0 && (
                  <ArchiveImages images={entry.images} dateLabel={entry.dateLabel} password={archivePassword} />
                )}
              </article>
            ))}

            {entries.length === 0 && (
              <div
                className="card"
                style={{
                  padding: "40px",
                  textAlign: "center",
                }}
              >
                <p className="text-muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
                  No archive entries found.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Separate component to load images with auth header
function ArchiveImages({ images, dateLabel, password }: { images: string[]; dateLabel: string; password: string }) {
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadImages = async () => {
      const urls: Record<string, string> = {};
      await Promise.all(
        images.map(async (img) => {
          try {
            const res = await fetch(`/api/archive/images/${img}`, {
              headers: { "x-archive-password": password },
            });
            if (res.ok) {
              const blob = await res.blob();
              urls[img] = URL.createObjectURL(blob);
            }
          } catch {
            // Skip failed images
          }
        })
      );
      setImageUrls(urls);
    };
    loadImages();

    // Cleanup blob URLs on unmount
    return () => {
      Object.values(imageUrls).forEach(URL.revokeObjectURL);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, password]);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        marginTop: "16px",
      }}
    >
      {images.map((img) =>
        imageUrls[img] ? (
          <img
            key={img}
            src={imageUrls[img]}
            alt={`Chart for ${dateLabel}`}
            style={{
              maxWidth: "100%",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
            }}
          />
        ) : null
      )}
    </div>
  );
}
