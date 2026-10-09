"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@concile/client/react";
import { api } from "../concile/_generated/server";

// Open this page in two tabs. Send a message in one; it appears in the other. No polling.
export default function Page() {
  const messages = useQuery(api.messages.list, {});
  const send = useMutation(api.messages.send);
  const [body, setBody] = useState("");
  const [author] = useState(() => "guest-" + Math.random().toString(36).slice(2, 6));
  return (
    <main style={{ maxWidth: 520, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Live chat</h1>
      <ul>{messages?.map((m) => <li key={m._id}><b>{m.author}:</b> {m.body}</li>) ?? <li>Loading…</li>}</ul>
      <form onSubmit={(e) => { e.preventDefault(); if (body.trim()) void send({ author, body }); setBody(""); }}>
        <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Say something" autoFocus />
        <button type="submit">Send</button>
      </form>
    </main>
  );
}
