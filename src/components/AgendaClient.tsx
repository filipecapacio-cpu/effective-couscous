"use client";

import { useState, useTransition } from "react";
import { CheckIcon, ChevronRightIcon, PencilIcon, PlusIcon, TrashIcon, XIcon } from "@/components/icons";
import {
  addAgendaItem,
  addChecklistItem,
  deleteAgendaItem,
  deleteChecklistItem,
  toggleAgendaItem,
  toggleChecklistItem,
  updateAgendaItem,
} from "@/app/actions/agenda";

type ChecklistItem = { id: string; text: string; done: boolean };
type Item = {
  id: string;
  title: string;
  time: string | null;
  notes: string | null;
  done: boolean;
  agenda_checklist_items: ChecklistItem[];
};

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
  const [openChecklists, setOpenChecklists] = useState<Record<string, boolean>>({});

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
            className={`rounded-2xl ${item.done ? "bg-card" : "bg-paper border-[1.5px] border-line"}`}
          >
            <div className="flex items-start gap-3 p-3.5">
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

            <ChecklistSection
              agendaItemId={item.id}
              checklist={item.agenda_checklist_items}
              open={openChecklists[item.id] ?? item.agenda_checklist_items.length > 0}
              onToggleOpen={() =>
                setOpenChecklists((prev) => ({ ...prev, [item.id]: !(prev[item.id] ?? item.agenda_checklist_items.length > 0) }))
              }
            />
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

function ChecklistSection({
  agendaItemId,
  checklist,
  open,
  onToggleOpen,
}: {
  agendaItemId: string;
  checklist: ChecklistItem[];
  open: boolean;
  onToggleOpen: () => void;
}) {
  const [, startTransition] = useTransition();
  const [newText, setNewText] = useState("");
  const done = checklist.filter((c) => c.done).length;

  function submitNew() {
    const text = newText.trim();
    if (!text) return;
    startTransition(() => addChecklistItem(agendaItemId, text));
    setNewText("");
  }

  return (
    <div className="px-3.5 pb-3.5 pl-[46px]">
      <button
        onClick={onToggleOpen}
        className="flex items-center gap-1.5 text-[12.5px] text-ink-soft font-semibold"
      >
        <ChevronRightIcon
          size={13}
          className="transition-transform"
          strokeWidth={2.2}
          {...(open ? { style: { transform: "rotate(90deg)" } } : {})}
        />
        {checklist.length > 0 ? `Checklist · ${done}/${checklist.length}` : "Checklist"}
      </button>

      {open && (
        <div className="flex flex-col gap-1.5 mt-2">
          {checklist.map((c) => (
            <div key={c.id} className="flex items-center gap-2.5">
              <button
                onClick={() => startTransition(() => toggleChecklistItem(c.id, !c.done))}
                className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                  c.done ? "bg-accent" : "border-[1.5px] border-line"
                }`}
              >
                {c.done && <CheckIcon size={11} className="text-accent-ink" />}
              </button>
              <span className={`text-[13.5px] flex-1 min-w-0 truncate ${c.done ? "text-ink-faint line-through" : "text-ink"}`}>
                {c.text}
              </span>
              <button
                onClick={() => startTransition(() => deleteChecklistItem(c.id))}
                aria-label="Remover item"
                className="text-ink-faint flex-shrink-0"
              >
                <XIcon size={13} />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-2.5 mt-0.5">
            <div className="w-5 h-5 rounded-md border-[1.5px] border-dashed border-line flex-shrink-0" />
            <input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitNew();
                }
              }}
              placeholder="Adicionar item…"
              className="flex-1 min-w-0 h-7 text-[13.5px] outline-none bg-transparent placeholder:text-ink-faint"
            />
          </div>
        </div>
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
