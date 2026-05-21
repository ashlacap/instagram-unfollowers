"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import Instructions from "@/components/Instructions";
import Results from "@/components/Results";
import type { AnalysisResult } from "@/lib/instagram";

type State =
  | { stage: "idle" }
  | { stage: "loading" }
  | { stage: "done"; result: AnalysisResult }
  | { stage: "error"; message: string };

export default function Home() {
  const [state, setState] = useState<State>({ stage: "idle" });

  async function handleUpload(file: File) {
    setState({ stage: "loading" });
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setState({ stage: "error", message: data.error ?? "Unknown error." });
        return;
      }

      setState({ stage: "done", result: data });
    } catch {
      setState({
        stage: "error",
        message: "Failed to reach the server. Please try again.",
      });
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 px-4 py-12">
      {/* Header */}
      <header className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-200">
          <svg
            className="h-7 w-7 text-white"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Instagram Unfollowers
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          See who doesn&rsquo;t follow you back &mdash; no login, no scraping,
          100% private.
        </p>
      </header>

      {/* Main content */}
      {state.stage === "done" ? (
        <Results
          result={state.result}
          onReset={() => setState({ stage: "idle" })}
        />
      ) : (
        <>
          <FileUpload
            onUpload={handleUpload}
            loading={state.stage === "loading"}
          />

          {state.stage === "error" && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
              <strong>Error:</strong> {state.message}
            </div>
          )}

          <Instructions />
        </>
      )}

      <footer className="mt-auto pt-4 text-center text-xs text-gray-300">
        Not affiliated with Instagram or Meta.
      </footer>
    </main>
  );
}
