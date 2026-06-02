"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (error?.name === "ChunkLoadError") {
      window.location.reload();
    }
  }, [error]);

  if (error?.name === "ChunkLoadError") {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        height: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      <h2>Algo deu errado.</h2>
      <button
        onClick={reset}
        style={{
          padding: "8px 20px",
          borderRadius: "6px",
          border: "none",
          background: "#2563eb",
          color: "#fff",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        Tentar novamente
      </button>
    </div>
  );
}
