"use client";

import { useState } from "react";
import type { AnalysisResult, InstagramUser } from "@/lib/instagram";

interface ResultsProps {
  result: AnalysisResult;
  onReset: () => void;
}

type CheckState = "idle" | "checking" | "done";

export default function Results({ result, onReset }: ResultsProps) {
  const [search, setSearch] = useState("");
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [activeUsers, setActiveUsers] = useState<InstagramUser[]>(result.notFollowingBack);
  const [removedCount, setRemovedCount] = useState(0);

  const filtered = activeUsers.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCheckDeleted() {
    setCheckState("checking");
    try {
      const res = await fetch("/api/check-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: activeUsers.map((u) => u.username) }),
      });
      const data = await res.json();
      if (data.results) {
        const existingSet = new Set<string>(
          data.results.filter((r: { username: string; exists: boolean }) => r.exists).map((r: { username: string }) => r.username.toLowerCase())
        );
        const filtered = activeUsers.filter((u) => existingSet.has(u.username.toLowerCase()));
        setRemovedCount(activeUsers.length - filtered.length);
        setActiveUsers(filtered);
      }
    } catch {
      // silently ignore — leave list unchanged
    }
    setCheckState("done");
  }

  const { followersCount, followingCount } = result;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Following" value={followingCount} color="from-blue-500 to-indigo-600" />
        <StatCard label="Followers" value={followersCount} color="from-green-500 to-teal-600" />
        <StatCard label="Not following back" value={activeUsers.length} color="from-pink-500 to-purple-600" />
      </div>

      {activeUsers.length === 0 ? (
        <div className="rounded-2xl bg-green-50 p-8 text-center">
          <p className="text-2xl font-bold text-green-600">All good!</p>
          <p className="mt-1 text-sm text-green-500">
            Everyone you follow also follows you back.
          </p>
        </div>
      ) : (
        <>
          {/* Check deleted button */}
          {checkState === "idle" && (
            <button
              onClick={handleCheckDeleted}
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-pink-300 hover:text-pink-600"
            >
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Filter out deleted / inactive accounts
            </button>
          )}

          {checkState === "checking" && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-gray-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-pink-400 border-t-transparent" />
              Checking accounts&hellip; this may take a moment
            </div>
          )}

          {checkState === "done" && (
            <div className="rounded-xl bg-green-50 px-4 py-2.5 text-sm text-green-600">
              {removedCount > 0
                ? `Removed ${removedCount} deleted or inactive account${removedCount !== 1 ? "s" : ""}.`
                : "No deleted or inactive accounts found."}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search usernames…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
              />
            </div>
            <span className="text-xs text-gray-400">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          <ul className="max-h-[420px] overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
            {filtered.map((user) => (
              <li key={user.username}>
                <a
                  href={user.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-pink-50/50 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-purple-100 text-sm font-semibold text-purple-600 uppercase">
                      {user.username[0]}
                    </div>
                    <span className="text-sm font-medium text-gray-800 group-hover:text-pink-600">
                      @{user.username}
                    </span>
                  </div>
                  <svg
                    className="h-4 w-4 text-gray-300 group-hover:text-pink-400 transition-colors"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-gray-400">
                No results for &ldquo;{search}&rdquo;
              </li>
            )}
          </ul>
        </>
      )}

      <button
        onClick={onReset}
        className="mx-auto flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
      >
        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Analyze another export
      </button>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-100">
      <div className={`bg-gradient-to-br ${color} bg-clip-text text-2xl font-bold text-transparent`}>
        {value.toLocaleString()}
      </div>
      <div className="mt-0.5 text-xs text-gray-500">{label}</div>
    </div>
  );
}
