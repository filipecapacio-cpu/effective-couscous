"use client";

import { useState, useTransition } from "react";
import { connectGarmin, disconnectGarmin } from "@/app/actions/wearables";

export default function GarminConnectButton({ connected }: { connected: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConnect() {
    setError(null);
    startTransition(async () => {
      // Em caso de sucesso, connectGarmin() redireciona pro widget da Terra
      // e essa função nem retorna - só volta um valor quando falha.
      const result = await connectGarmin();
      if (result && "error" in result) setError(result.error);
    });
  }

  function handleDisconnect() {
    setError(null);
    startTransition(async () => {
      const result = await disconnectGarmin();
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <div className="text-[13px] text-accent font-medium">{error}</div>}
      {connected ? (
        <button
          onClick={handleDisconnect}
          disabled={pending}
          className="h-11 rounded border border-white/10 text-on-ink font-semibold text-[14px] disabled:opacity-60"
        >
          {pending ? "Desconectando…" : "Desconectar Garmin"}
        </button>
      ) : (
        <button
          onClick={handleConnect}
          disabled={pending}
          className="h-11 rounded bg-accent text-accent-ink font-semibold text-[14px] disabled:opacity-60"
        >
          {pending ? "Abrindo…" : "Conectar Garmin"}
        </button>
      )}
    </div>
  );
}
