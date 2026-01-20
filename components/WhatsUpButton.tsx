"use client";

import { useState } from "react";

interface WhatsUpButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export default function WhatsUpButton({ onClick, isLoading }: WhatsUpButtonProps) {
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleClick = () => {
    setShowAccessCodeModal(true);
    setAccessCode("");
    setError("");
    setShowCode(false);
  };

  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError("");

    try {
      const response = await fetch("/api/verify-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: accessCode, type: "whatsup" }),
      });

      if (response.ok) {
        setShowAccessCodeModal(false);
        setAccessCode("");
        onClick();
      } else {
        const data = await response.json();
        setError(data.error || "Incorrect access code");
      }
    } catch {
      setError("Failed to verify access code");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCloseModal = () => {
    setShowAccessCodeModal(false);
    setAccessCode("");
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
            Loading...
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
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
            What's Up?
          </>
        )}
      </button>

      {/* Access Code Modal */}
      {showAccessCodeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.92)" }}
        >
          <div
            className="card p-6 w-full max-w-sm mx-4"
            style={{
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-primary" style={{ fontSize: "var(--text-lg)" }}>
                Access Code Required
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
              Enter the access code to view the market summary.
            </p>

            <form onSubmit={handleAccessCodeSubmit}>
              <div className="relative mb-3">
                <input
                  type={showCode ? "text" : "password"}
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter access code"
                  className="w-full px-3 py-2 pr-10 rounded-lg text-primary"
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    fontSize: "var(--text-base)",
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                >
                  {showCode ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

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
                  disabled={isVerifying || !accessCode}
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
