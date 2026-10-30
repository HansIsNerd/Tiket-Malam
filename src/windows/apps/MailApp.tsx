import { useEffect, useMemo, useState } from 'react';
import { Archive, Inbox, Mail as MailIcon, Paperclip, Send, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useGameStore } from '@core/stores/gameStore';
import { loadMailData } from '@core/services/dataLoader';
import type { Mail } from '@core/types/mail';
import { cx } from '@core/utils/cx';

type FolderId = 'inbox' | 'sent' | 'archive' | 'trash';

interface FolderMeta {
  id: FolderId;
  label: string;
  icon: LucideIcon;
}

const FOLDERS: readonly FolderMeta[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

export function MailApp() {
  const mailData = useGameStore((s) => s.mailData);
  const setMailData = useGameStore((s) => s.setMailData);
  const playerName = useGameStore((s) => s.playerName);
  const [activeFolder, setActiveFolder] = useState<FolderId>('inbox');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (mailData) return;
    let cancelled = false;
    loadMailData()
      .then((data) => {
        if (!cancelled) setMailData(data);
      })
      .catch((err: unknown) => {
        console.warn(err);
      });
    return () => {
      cancelled = true;
    };
  }, [mailData, setMailData]);

  const mails: Mail[] = useMemo(
    () => (activeFolder === 'inbox' ? (mailData?.mails ?? []) : []),
    [activeFolder, mailData],
  );
  const selected = mails.find((m) => m.id === selectedId) ?? null;
  const attachments = selected?.attachments ?? [];
  const isUnread = (m: Mail) => m.unread && !readIds.has(m.id);
  const inboxUnread = (mailData?.mails ?? []).filter(isUnread).length;

  const handleSelectFolder = (id: FolderId) => {
    setActiveFolder(id);
    setSelectedId(null);
  };

  const handleSelectMail = (id: string) => {
    setSelectedId(id);
    setReadIds((prev) => new Set(prev).add(id));
  };

  return (
    <div className="flex h-full w-full bg-[var(--os-bg)] text-neutral-100">
      <aside className="flex w-[180px] shrink-0 flex-col border-r border-[var(--os-border)] bg-[var(--os-panel)] py-2">
        {FOLDERS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleSelectFolder(id)}
            className={cx(
              'flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/10',
              activeFolder === id && 'bg-white/10 font-semibold',
            )}
          >
            <Icon size={16} strokeWidth={1.75} className="shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {id === 'inbox' && inboxUnread > 0 ? (
              <span className="text-xs tabular-nums text-[var(--os-accent)]">{inboxUnread}</span>
            ) : null}
          </button>
        ))}
      </aside>

      <section className="flex w-[320px] shrink-0 flex-col border-r border-[var(--os-border)] bg-[var(--os-bg)]">
        <header className="flex h-12 shrink-0 items-center border-b border-[var(--os-border)] px-4 text-sm font-semibold">
          {FOLDERS.find((f) => f.id === activeFolder)?.label}
        </header>
        <ul className="chat-scroll min-h-0 flex-1 overflow-y-auto">
          {mails.length === 0 ? (
            <li className="p-6 text-center text-sm text-neutral-500">Tidak ada email</li>
          ) : (
            mails.map((mail) => {
              const unread = isUnread(mail);
              return (
                <li key={mail.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectMail(mail.id)}
                    className={cx(
                      'flex w-full items-start gap-2 border-b border-[var(--os-border)] px-4 py-3 text-left transition-colors hover:bg-white/5',
                      mail.id === selectedId && 'bg-[var(--os-panel-hover)]',
                    )}
                  >
                    <span
                      aria-label={unread ? 'Belum dibaca' : undefined}
                      className={cx(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        unread ? 'bg-blue-500' : 'bg-transparent',
                      )}
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-baseline justify-between gap-2">
                        <span
                          className={cx(
                            'truncate text-sm',
                            unread ? 'font-bold text-neutral-100' : 'text-neutral-300',
                          )}
                        >
                          {mail.from}
                        </span>
                        <span className="shrink-0 text-[11px] tabular-nums text-neutral-500">
                          {mail.time}
                        </span>
                      </span>
                      <span
                        className={cx(
                          'truncate text-xs',
                          unread ? 'font-bold text-neutral-200' : 'text-neutral-400',
                        )}
                      >
                        {mail.subject}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <section className="flex min-w-0 flex-1 flex-col bg-[var(--os-bg)]">
        {selected === null ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-neutral-500">
            <MailIcon size={32} strokeWidth={1.5} />
            <p className="text-sm">Pilih email untuk membaca</p>
          </div>
        ) : (
          <>
            <header className="flex shrink-0 flex-col gap-1 border-b border-[var(--os-border)] bg-[var(--os-panel)] px-5 py-4">
              <h2 className="text-base font-semibold">{selected.subject}</h2>
              <p className="text-xs text-neutral-400">
                {selected.from} · {selected.time}
              </p>
            </header>
            <div className="chat-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-200">
                {selected.body.replaceAll('{PLAYER}', playerName)}
              </p>
            </div>
            {attachments.length > 0 ? (
              <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[var(--os-border)] bg-[var(--os-panel)] px-5 py-3">
                {attachments.map((att) => (
                  <button
                    key={att.id}
                    type="button"
                    title={att.fileName}
                    className="flex items-center gap-2 rounded-md border border-[var(--os-border)] bg-[var(--os-bg)] px-3 py-1.5 text-xs text-neutral-200 transition-colors hover:bg-white/10"
                  >
                    <Paperclip size={14} strokeWidth={1.75} />
                    <span>Lampiran</span>
                    <span className="text-neutral-500">{att.fileName}</span>
                  </button>
                ))}
              </footer>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}