import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Circle, MessageSquare, Send } from 'lucide-react';
import { useGameStore } from '@core/stores/gameStore';
import type { Act2Flags } from '@core/stores/gameStore';
import { useUiStore } from '@core/stores/uiStore';
import { loadChatData } from '@core/services/dataLoader';
import { cx } from '@core/utils/cx';

const TYPING_MS = 4500;

const FLAG_GATED_THREADS: Record<string, (a: Act2Flags) => boolean> = {
  chat_bagas_1: (a) => a.e09BagasContact,
  chat_bagas_2: (a) => a.e10Instruction,
};

const deliveredThreadIds = new Set<string>();

const DOT_DELAYS_MS = [0, 200, 400] as const;

export function ChatApp() {
  const chatData = useGameStore((s) => s.chatData);
  const setChatData = useGameStore((s) => s.setChatData);
  const act2 = useGameStore((s) => s.flags.act2);
  const unlockedThreadIds = useUiStore((s) => s.unlockedChatThreadIds);
  const pendingThreadId = useUiStore((s) => s.pendingChatThreadId);
  const clearPendingThread = useUiStore((s) => s.clearPendingChatThread);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>('');
  const [, setDeliveredVersion] = useState<number>(0);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatData) return;
    let cancelled = false;
    loadChatData()
      .then((data) => {
        if (!cancelled) setChatData(data);
      })
      .catch((err: unknown) => {
        console.warn(err);
      });
    return () => {
      cancelled = true;
    };
  }, [chatData, setChatData]);

  useEffect(() => {
    if (pendingThreadId === null || !chatData) return;
    const target = chatData.threads.find((t) => t.id === pendingThreadId);
    if (target) {
      setActiveContactId(target.contactId);
      setDraft('');
    } else {
      console.warn(`[ChatApp] Thread tidak ditemukan: ${pendingThreadId}`);
    }
    clearPendingThread();
  }, [pendingThreadId, chatData, clearPendingThread]);

  const contacts = chatData?.contacts ?? [];
  const activeContact = contacts.find((c) => c.id === activeContactId) ?? null;
  const contactThreads = (chatData?.threads ?? []).filter((t) => {
    if (t.contactId !== activeContactId) return false;
    if (t.locked !== true) return true;
    if (unlockedThreadIds.includes(t.id)) return true;
    return FLAG_GATED_THREADS[t.id]?.(act2) === true;
  });

  const typingThread =
    contactThreads.find(
      (t) => FLAG_GATED_THREADS[t.id] !== undefined && !deliveredThreadIds.has(t.id),
    ) ?? null;
  const typingThreadId = typingThread?.id ?? null;
  const typingIndex = typingThread ? contactThreads.indexOf(typingThread) : -1;
  const visibleThreads = typingIndex < 0 ? contactThreads : contactThreads.slice(0, typingIndex);

  const messages = visibleThreads.flatMap((t) => t.messages);
  const disabledThread =
    [...visibleThreads, ...(typingThread ? [typingThread] : [])].find(
      (t) => t.inputDisabled === true,
    ) ?? null;
  const isInputDisabled = disabledThread !== null;

  useEffect(() => {
    if (typingThreadId === null) return;
    const timer = window.setTimeout(() => {
      deliveredThreadIds.add(typingThreadId);
      setDeliveredVersion((v) => v + 1);
    }, TYPING_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [typingThreadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [activeContactId, messages.length, typingThreadId]);

  const handleSelectContact = (id: string) => {
    setActiveContactId(id);
    setDraft('');
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isInputDisabled || draft.trim() === '') return;
    setDraft('');
  };

  return (
    <div className="flex h-full w-full bg-[var(--os-bg)] text-neutral-100">
      <aside className="flex w-[250px] shrink-0 flex-col overflow-y-auto border-r border-[var(--os-border)] bg-[var(--os-panel)]">
        <ul className="flex flex-col py-1">
          {contacts.map((contact) => {
            const isOnline = contact.status === 'online';
            const isActive = contact.id === activeContactId;
            return (
              <li key={contact.id}>
                <button
                  type="button"
                  onClick={() => handleSelectContact(contact.id)}
                  className={cx(
                    'flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-white/10',
                    isActive && 'bg-white/10',
                  )}
                >
                  <Circle
                    size={10}
                    strokeWidth={0}
                    fill="currentColor"
                    aria-label={isOnline ? 'Online' : 'Offline'}
                    className={cx(
                      'shrink-0',
                      isOnline ? 'text-emerald-500' : 'text-neutral-500',
                    )}
                  />
                  <span className="truncate">{contact.displayName}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-[var(--os-bg)]">
        {activeContact === null ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-neutral-500">
            <MessageSquare size={32} strokeWidth={1.5} />
            <p className="text-sm">Pilih kontak untuk mulai mengobrol</p>
          </div>
        ) : (
          <>
            <header className="flex h-12 shrink-0 items-center border-b border-[var(--os-border)] px-4 text-sm font-semibold">
              <span className="truncate">{activeContact.displayName}</span>
            </header>

            <div className="chat-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
              {messages.length === 0 && typingThread === null ? (
                <p className="m-auto text-sm text-neutral-500">
                  Belum ada pesan
                </p>
              ) : (
                messages.map((msg, index) => {
                  const isPlayer = msg.from === 'player';
                  return (
                    <div
                      key={`${msg.time}-${index}`}
                      className={cx(
                        'flex w-full',
                        isPlayer ? 'justify-end' : 'justify-start',
                      )}
                    >
                      <div
                        className={cx(
                          'flex max-w-[75%] flex-col gap-1 rounded-2xl px-3 py-2 text-sm',
                          isPlayer
                            ? 'rounded-br-sm bg-[var(--os-accent)] text-white'
                            : 'rounded-bl-sm bg-[var(--os-panel-hover)] text-neutral-100',
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {msg.text}
                        </p>
                        <span
                          className={cx(
                            'self-end text-[10px] tabular-nums',
                            isPlayer ? 'text-white/70' : 'text-neutral-400',
                          )}
                        >
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              {typingThread !== null ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex w-full justify-start"
                >
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-[var(--os-panel-hover)] px-3 py-2 text-xs text-neutral-400">
                    <span className="flex items-center gap-1" aria-hidden="true">
                      {DOT_DELAYS_MS.map((delay) => (
                        <span
                          key={delay}
                          className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400"
                          style={{ animationDelay: `${delay}ms`, animationDuration: '1.2s' }}
                        />
                      ))}
                    </span>
                    <span>{`${activeContact.displayName} sedang mengetik...`}</span>
                  </div>
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex shrink-0 items-center gap-2 border-t border-[var(--os-border)] bg-[var(--os-panel)] p-3"
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={isInputDisabled}
                placeholder={
                  isInputDisabled
                    ? (disabledThread?.inputDisabledReason ?? 'Tidak dapat membalas')
                    : 'Ketik pesan...'
                }
                className={cx(
                  'min-w-0 flex-1 rounded-md border px-3 py-2 text-sm outline-none transition-colors',
                  isInputDisabled
                    ? 'cursor-not-allowed border-[var(--os-border)] bg-black/40 text-neutral-500 placeholder:text-neutral-600'
                    : 'border-[var(--os-border)] bg-[var(--os-bg)] text-neutral-100 placeholder:text-neutral-500 focus:border-[var(--os-accent)]',
                )}
              />
              <button
                type="submit"
                disabled={isInputDisabled || draft.trim() === ''}
                aria-label="Kirim"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--os-accent)] text-white transition-[filter,opacity] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
              >
                <Send size={16} strokeWidth={2} />
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}