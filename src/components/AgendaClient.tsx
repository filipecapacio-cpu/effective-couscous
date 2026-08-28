"use client";

import { useState, useTransition } from "react";
import { CheckIcon, PencilIcon, PlusIcon, TrashIcon, XIcon } from "@/components/icons";
import { addAgendaItem, deleteAgendaItem, toggleAgendaItem, updateAgendaItem } from "@/app/actions/agenda";

type Item = { id: string; title: string; time: string | null; notes: string | null; done: boolean };

export default function AgendaClient({
  userId,
  date,
  items,
}: {
  userId: string;
  date: string;
  items: Item[];
}) {
  const [, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 && !adding && (
        <p className="text-sm text-ink-soft">Nada na agenda pra esse dia.</p>
      )}

      {items.map((item) =>
        editingId === item.id ? (
          <ItemForm
            key={item.id}
            initial={item}
            onCancel={() => setEditingId(null)}
            onSave={(title, time, notes) => {
              startTransition(() => updateAgendaItem(item.id, title, time, notes));
              setEditingId(null);
            }}
          />
        ) : (
          <div
            key={item.id}
            className={`flex items-start gap-3 p-3.5 rounded-2xl ${
              item.done ? "bg-card" : "bg-paper border-[1.5px] border-line"
            }`}
          >
            <button
              onClick={() => startTransition(() => toggleAgendaItem(item.id, !item.done))}
              className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                item.done ? "bg-accent" : "border-[1.5px] border-line"
              }`}
            >
              {item.done && <CheckIcon size={13} className="text-accent-ink" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                {item.time && (
                  <span className="text-[13px] font-semibold text-accent flex-shrink-0">
                    {item.time.slice(0, 5)}
                  </span>
                )}
                <span className={`text-[15px] font-semibold truncate ${item.done && "text-ink-soft"}`}>
                  {item.title}
                </span>
              </div>
              {item.notes && <div className="text-[13px] text-ink-soft mt-0.5">{item.notes}</div>}
            </div>
            <button onClick={() => setEditingId(item.id)} aria-label="Editar" className="text-ink-faint flex-shrink-0">
              <PencilIcon size={16} />
            </button>
            <button
              onClick={() => startTransition(() => deleteAgendaItem(item.id))}
              aria-label="Remover"
              className="text-ink-faint flex-shrink-0"
            >
              <TrashIcon size={16} />
            </button>
          </div>
        )
      )}

      {adding ? (
        <ItemForm
          onCancel={() => setAdding(false)}
          onSave={(title, time, notes) => {
            startTransition(() => addAgendaItem(userId, date, title, time, notes));
            setAdding(false);
          }}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border-[1.5px] border-dashed border-line text-ink-soft text-sm font-semibold"
        >
          <PlusIcon size={16} />
          Adicionar compromisso
        </button>
      )}
    </div>
  );
}

function ItemForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: { title: string; time: string | null; notes: string | null };
  onSave: (title: string, time: string | null, notes: string | null) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [time, setTime] = useState(initial?.time?.slice(0, 5) ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-2xl border-[1.5px] border-ink">
      <div className="flex gap-2">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="O que você precisa fazer?"
          className="flex-1 h-10 rounded-lg bg-paper px-3 text-[15px] font-semibold outline-none"
        />
        <input
          value={time}
          onChange={(e) => setTime(e.target.value)}
          type="time"
          className="w-[104px] h-10 rounded-lg bg-paper px-2 text-[15px] outline-none"
        />
      </div>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Detalhes (opcional)"
        className="h-9 rounded-lg bg-paper px-3 text-[13px] text-ink-soft outline-none"
      />
      <div className="flex gap-2 mt-1">
        <button
          onClick={() => title.trim() && onSave(title.trim(), time || null, notes.trim() || null)}
          className="flex-1 h-9 rounded-full bg-ink text-paper text-sm font-semibold"
        >
          Salvar
        </button>
        <button onClick={onCancel} className="w-9 h-9 rounded-full bg-card flex items-center justify-center flex-shrink-0">
          <XIcon size={16} className="text-ink-soft" />
        </button>
      </div>
    </div>
  );
}
