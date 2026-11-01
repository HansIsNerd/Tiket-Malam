import { useEffect, useMemo, useRef } from 'react';

const TOTAL_MESSAGES = 330;
const MESSAGE_TEXT = 'saya di sini.';
const CONTACT_NAME = '?';
const BASE_YEAR = 2025;
const BASE_MONTH = 10;
const BASE_DAY = 2;

interface DatedMessage {
  id: number;
  date: string;
}

function buildMessages(): DatedMessage[] {
  const formatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return Array.from({ length: TOTAL_MESSAGES }, (_, i) => {
    const offset = TOTAL_MESSAGES - 1 - i;
    const date = new Date(BASE_YEAR, BASE_MONTH, BASE_DAY - offset);
    return { id: i, date: formatter.format(date) };
  });
}

export function MacMessagesApp() {
  const messages = useMemo(buildMessages, []);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, []);

  return (
    <div className="flex h-full min-h-0 bg-white text-neutral-800">
      <aside className="flex w-48 shrink-0 flex-col border-r border-black/10 bg-[#E9E9EC]/90 p-2">
        <button
          type="button"
          aria-current="true"
          className="flex flex-col rounded-md bg-[#1F72D8] px-3 py-2 text-left text-white"
        >
          <span className="text-[13px] font-semibold">{CONTACT_NAME}</span>
          <span className="truncate text-[11px] text-white/80">{MESSAGE_TEXT}</span>
        </button>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-10 shrink-0 items-center justify-center border-b border-black/10 text-[13px] font-semibold">
          {CONTACT_NAME}
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto bg-[#FBFBF8] px-4 py-3">
          {messages.map((m) => (
            <div key={m.id} className="flex flex-col items-start gap-0.5">
              <span className="w-full text-center text-[10px] text-neutral-400">
                {m.date}, 03.00
              </span>
              <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-[#E5E5EA] px-3 py-1.5 text-[13px]">
                {MESSAGE_TEXT}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex shrink-0 items-center border-t border-black/10 bg-[#F5F5F7] p-2"
        >
          <input
            type="text"
            disabled
            aria-label="Balas"
            placeholder="Tidak dapat membalas"
            className="min-w-0 flex-1 cursor-not-allowed rounded-full border border-black/10 bg-black/5 px-3 py-1.5 text-[13px] text-neutral-400 placeholder:text-neutral-400"
          />
        </form>
      </section>
    </div>
  );
}