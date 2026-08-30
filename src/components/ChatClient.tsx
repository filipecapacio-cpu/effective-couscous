"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { SendIcon, SparkleIcon } from "@/components/icons";
import { sendChatMessage } from "@/app/actions/ai";

type Message = { id: string; role: "user" | "assistant"; content: string };

export default function ChatClient({
  initialMessages,
  hasAnamnesis,
  aiConfigured,
}: {
  initialMessages: Message[];
  hasAnamnesis: boolean;
  aiConfigured: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  function scrollToEnd() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  function handleSend() {
    const text = input.trim();
    if (!text || pending) return;
    setError(null);
    setInput("");
    const userMsg: Message = { id: `local-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    scrollToEnd();

    startTransition(async () => {
      const result = await sendChatMessage(text);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setMessages((prev) => [
        ...prev,
        { id: `reply-${Date.now()}`, role: "assistant", content: result.reply },
      ]);
      scrollToEnd();
    });
  }

  if (!aiConfigured) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <SparkleIcon size={28} className="text-ink-faint" />
        <p className="text-ink-soft text-[15px]">
          O assistente de IA ainda não foi configurado nesta instalação do Onmode.
        </p>
      </div>
    );
  }

  return (
    <>
      <div ref={listRef} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
            <SparkleIcon size={26} className="text-ink-faint" />
            <p className="text-ink-soft text-[15px]">
              Pergunta qualquer coisa sobre seu treino, dieta ou progresso.
            </p>
            {!hasAnamnesis && (
              <p className="text-ink-faint text-[13px]">
                Dica: preencher sua{" "}
                <Link href="/anamnese" className="underline">
                  anamnese
                </Link>{" "}
                deixa as respostas bem mais precisas.
              </p>
            )}
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] px-4 py-2.5 rounded-lg text-[15px] leading-relaxed whitespace-pre-wrap ${
              m.role === "user"
                ? "self-end bg-ink text-paper rounded-br-md"
                : "self-start bg-card text-ink rounded-bl-md"
            }`}
          >
            {m.content}
          </div>
        ))}
        {pending && (
          <div className="self-start bg-card text-ink-soft px-4 py-2.5 rounded-lg rounded-bl-md text-[15px]">
            Pensando…
          </div>
        )}
      </div>

      {error && <div className="px-6 pb-1 text-sm text-accent font-medium">{error}</div>}

      <div className="px-6 pb-6 pt-2 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          placeholder="Escreva sua pergunta…"
          className="flex-1 max-h-28 rounded-lg border border-line bg-paper px-4 py-3 text-[15px] outline-none focus:border-ink resize-none"
        />
        <button
          onClick={handleSend}
          disabled={pending || !input.trim()}
          aria-label="Enviar"
          className="w-12 h-12 rounded-full bg-ink text-paper flex items-center justify-center flex-shrink-0 disabled:opacity-40"
        >
          <SendIcon size={18} />
        </button>
      </div>
    </>
  );
}
