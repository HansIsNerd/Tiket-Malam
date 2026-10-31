import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Circle, MessageSquare, Send } from 'lucide-react';
import { useGameStore } from '@core/stores/gameStore';
import { useUiStore } from '@core/stores/uiStore';
import { loadChatData } from '@core/services/dataLoader';
import { cx } from '@core/utils/cx';

export function ChatApp() {
  const chatData = useGameStore((s) => s.chatData);
  const setChatData = useGameStore((s) => s.setChatData);
  const unlockedThreadIds = useUiStore((s) => s.unlockedChatThreadIds);
  const pendingThreadId = useUiStore((s) => s.pendingChatThreadId);
  const clearPendingThread = useUiStore((s) => s.clearPendingChatThread);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>('');
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
    }
    clearPendingThread();
  }, [pendingThreadId, chatData, clearPendingThread]);

  const contacts = chatData?.contacts ?? [];
  const activeContact = contacts.find((c) => c.id === activeContactId) ?? null;
  const contactThreads = (chatData?.threads ?? []).filter(
    (t) =>
      t.contactId === activeContactId &&
      (t.locked !== true || unlockedThreadIds.includes(t.id)),
  );
  const messages = contactThreads.flatMap((t) => t.messages);
  const disabledThread = contactThreads.find((t) => t.inputDisabled === true) ?? null;
  const isInputDisabled = disabledThread !== null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [activeContactId, messages.length]);

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
              {messages.length === 0 ? (
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