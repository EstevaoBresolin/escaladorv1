"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (error?.name !== "ChunkLoadError") return;

    // Recarrega apenas uma vez por sessão para evitar loop infinito
    const alreadyReloaded = sessionStorage.getItem("chunk_reload");
    if (!alreadyReloaded) {
      sessionStorage.setItem("chunk_reload", "1");
      window.location.reload();
    }
  }, [error]);

  const isChunkError = error?.name === "ChunkLoadError";

  return (
    <html lang="pt-BR">
      <body
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          height: "100vh",
          fontFamily: "sans-serif",
          background: "#0a0a0a",
          color: "#fff",
          margin: 0,
        }}
      >
        {isChunkError ? (
          <p>Atualizando...</p>
        ) : (
          <>
            <h2>Algo deu errado.</h2>
            <button
              onClick={() => {
                sessionStorage.removeItem("chunk_reload");
                reset();
              }}
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
          </>
        )}
      </body>
    </html>
  );
}
