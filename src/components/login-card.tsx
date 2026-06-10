"use client";

import { FormEvent, useState } from "react";
import { LogIn } from "lucide-react";

export function LoginCard() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin12345");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    setLoading(false);
    if (!response.ok) {
      setError("Invalid email or password.");
      return;
    }
    window.location.reload();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-md bg-action text-white">
            <LogIn size={22} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Mapped Asset Manager</h1>
            <p className="text-sm text-slate-500">Sign in to manage assets.</p>
          </div>
        </div>
        <label className="mb-3 block text-sm font-medium">
          Email
          <input
            className="mt-1 w-full rounded-md border border-line px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
          />
        </label>
        <label className="mb-4 block text-sm font-medium">
          Password
          <input
            className="mt-1 w-full rounded-md border border-line px-3 py-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
          />
        </label>
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
        <button className="w-full rounded-md bg-action px-4 py-2.5 font-semibold text-white" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
