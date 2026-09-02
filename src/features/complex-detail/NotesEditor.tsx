import { useState } from "react";
import type { CandidateNotes, ListingKind } from "@/domain/types";
import { useCandidatesStore } from "@/stores/candidatesStore";

function ListEditor({
  label,
  items,
  onAdd,
  onRemove,
}: {
  label: string;
  items: string[];
  onAdd: (text: string) => void;
  onRemove: (index: number) => void;
}) {
  const [text, setText] = useState("");
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(t);
    setText("");
  };

  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <ul className="mt-1 space-y-1">
        {items.map((it, i) => (
          <li
            key={`${it}-${i}`}
            className="bg-surface-muted flex items-center justify-between rounded px-2 py-1 text-sm"
          >
            <span>{it}</span>
            <button
              type="button"
              onClick={() => onRemove(i)}
              aria-label={`${label} 삭제`}
              className="text-muted-foreground"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-1 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          aria-label={`${label} 입력`}
          className="border-border bg-surface flex-1 rounded-md border px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={submit}
          className="border-border rounded-md border px-3 text-sm font-medium"
        >
          추가
        </button>
      </div>
    </div>
  );
}

export function NotesEditor({
  complexId,
  kind,
}: {
  complexId: string;
  kind: ListingKind;
}) {
  const candidate = useCandidatesStore((s) =>
    s.candidates.find((c) => c.id === complexId && c.kind === kind),
  );
  const updateNotesRaw = useCandidatesStore((s) => s.updateNotes);
  const updateNotes = (notes: Partial<CandidateNotes>) =>
    updateNotesRaw(complexId, notes, kind);

  if (!candidate) return null;
  const { notes } = candidate;

  return (
    <section className="space-y-4">
      <h2 className="font-semibold">내 메모</h2>
      <ListEditor
        label="장점"
        items={notes.pros}
        onAdd={(t) => updateNotes({ pros: [...notes.pros, t] })}
        onRemove={(i) =>
          updateNotes({
            pros: notes.pros.filter((_, idx) => idx !== i),
          })
        }
      />
      <ListEditor
        label="단점"
        items={notes.cons}
        onAdd={(t) => updateNotes({ cons: [...notes.cons, t] })}
        onRemove={(i) =>
          updateNotes({
            cons: notes.cons.filter((_, idx) => idx !== i),
          })
        }
      />
      <div>
        <label htmlFor="visitMemo" className="text-sm font-medium">
          임장 메모
        </label>
        <textarea
          id="visitMemo"
          rows={3}
          value={notes.visitMemo ?? ""}
          onChange={(e) => updateNotes({ visitMemo: e.target.value })}
          className="border-border bg-surface mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
    </section>
  );
}
