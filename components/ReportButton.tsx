"use client";

import { useState } from "react";

interface ReportButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export default function ReportButton({ onClick, isLoading }: ReportButtonProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleClick = () => {
    // Always prompt for password on every click
    setShowPasswordModal(true);
    setPassword("");
    setError("");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError("");

    try {
      const response = await fetch("/api/verify-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setShowPasswordModal(false);
        setPassword("");
        onClick();
      } else {
        const data = await response.json();
        setError(data.error || "Incorrect password");
      }
    } catch {
      setError("Failed to verify password");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCloseModal = () => {
    setShowPasswordModal(false);
    setPassword("");
    setError("");
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="btn btn-primary"
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Generate Update
          </>
        )}
      </button>

      {/* Password Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
        >
          <div
            className="card p-6 w-full max-w-sm mx-4"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-primary" style={{ fontSize: "var(--text-lg)" }}>
                Password Required
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-muted hover:text-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-secondary mb-4" style={{ fontSize: "var(--text-sm)" }}>
              Enter the password to generate weekly updates.
            </p>

            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 rounded-lg mb-3 text-primary"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color)",
                  fontSize: "var(--text-base)",
                }}
                autoFocus
              />

              {error && (
                <p className="mb-3" style={{ fontSize: "var(--text-sm)", color: "var(--danger)" }}>
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn flex-1"
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Cancel
                </button>
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
        </div>
      )}
    </>
  );
}
