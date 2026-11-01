import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Archive,
  Check,
  Inbox,
  Mail as MailIcon,
  Paperclip,
  Pencil,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useGameStore } from '@core/stores/gameStore';
import { loadMailData } from '@core/services/dataLoader';
import { triggerEnding } from '@core/services/endingService';
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

const OFFBOARDING_PDF = 'berita_acara_bagas.pdf';
const NO_SENDER_LABEL = '(Tanpa Pengirim)';
const NO_SUBJECT_LABEL = '(Tanpa Subjek)';
const REPORT_ADDRESS = 'hr_pusat@nusadata.co.id';
const ACTION_BTN =
  'h-8 border border-neutral-500 bg-transparent px-4 text-xs font-semibold tracking-wider text-neutral-200 transition-colors hover:bg-white/10';
const INPUT_CLASS =
  'min-w-0 flex-1 border border-[var(--os-border)] bg-[var(--os-bg)] px-3 py-2 text-xs text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-[var(--os-accent)]';

function senderOf(mail: Mail): string {
  return mail.from.trim() === '' ? NO_SENDER_LABEL : mail.from;
}

function subjectOf(mail: Mail): string {
  return mail.subject.trim() === '' ? NO_SUBJECT_LABEL : mail.subject;
}

interface OffboardingPdfProps {
  playerName: string;
  signed: boolean;
  onSign: () => void;
  onClose: () => void;
}

function OffboardingPdf({ playerName, signed, onSign, onClose }: OffboardingPdfProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={OFFBOARDING_PDF}
      onClick={onClose}
      className="absolute inset-0 z-10 flex flex-col items-center bg-black/70 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex min-h-0 w-full max-w-[640px] flex-1 flex-col overflow-hidden rounded-sm bg-white text-black shadow-2xl"
      >
        <div className="flex h-9 shrink-0 items-center justify-between bg-neutral-700 px-3 text-xs text-neutral-100">
          <span className="truncate">{OFFBOARDING_PDF}</span>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-white/20"
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        </div>

        <div className="chat-scroll min-h-0 flex-1 overflow-y-auto px-16 py-12 font-serif text-[13px] leading-relaxed">
          <h1 className="text-center text-lg font-bold uppercase tracking-wide">
            Berita Acara Offboarding
          </h1>
          <p className="mb-8 text-center text-xs text-neutral-600">
            Nusadata · Departemen HR
          </p>

          <p className="mb-4">
            Dokumen ini menyatakan bahwa proses offboarding atas nama{' '}
            <strong>Bagas Prasetyo</strong> telah dilaksanakan dan serah terima tugas,
            akses, serta perangkat telah diselesaikan kepada tim IT.
          </p>

          <ol className="mb-4 list-decimal space-y-1 pl-6">
            <li>Akun dan hak akses sistem telah dinonaktifkan.</li>
            <li>Perangkat kerja telah dikembalikan dan dicatat.</li>
            <li>Catatan serah terima telah diarsipkan oleh tim IT.</li>
          </ol>

          <p className="mb-8">
            Dokumen ini dibuat sebagai arsip resmi dan tidak dapat diubah setelah
            ditandatangani.
          </p>

          <p className="mb-10">
            Diterima oleh: <strong>{playerName}</strong>
          </p>

          <div className="mb-3 text-xs text-neutral-600">Tanda tangan penerima</div>
          <div className="flex h-20 items-end border-b border-black px-2 pb-1">
            {signed ? (
              <span className="font-serif text-2xl italic">{playerName}</span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-neutral-600">{playerName}</p>
        </div>

        <div className="flex h-14 shrink-0 items-center justify-end border-t border-neutral-300 bg-neutral-100 px-6">
          {signed ? (
            <span className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <Check size={16} strokeWidth={2.5} />
              Ditandatangani
            </span>
          ) : (
            <button
              type="button"
              onClick={onSign}
              className="h-9 rounded bg-neutral-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
            >
              Tanda Tangan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface ComposeDialogProps {
  onClose: () => void;
  onSend: (to: string) => string | null;
}

function ComposeDialog({ onClose, onSend }: ComposeDialogProps) {
  const [to, setTo] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(onSend(to));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Email baru"
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4"
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-full w-full max-w-xl flex-col border border-neutral-500 bg-[var(--os-panel)] shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
      >
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--os-border)] pl-3 text-xs text-neutral-100">
          <span>Email Baru</span>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="flex h-9 w-10 items-center justify-center transition-colors hover:bg-[#E81123] hover:text-white"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-col gap-2 p-3">
          <label className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="w-14 shrink-0">To:</span>
            <input
              type="text"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setError(null);
              }}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              className={INPUT_CLASS}
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="w-14 shrink-0">Subjek:</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              autoComplete="off"
              className={INPUT_CLASS}
            />
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="chat-scroll w-full resize-none border border-[var(--os-border)] bg-[var(--os-bg)] px-3 py-2 text-xs leading-relaxed text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-[var(--os-accent)]"
          />
          {error !== null ? (
            <p role="alert" className="text-xs text-red-400">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--os-border)] px-3 py-3">
          <button type="button" onClick={onClose} className={ACTION_BTN}>
            [ Batal ]
          </button>
          <button type="submit" className={ACTION_BTN}>
            [ Kirim ]
          </button>
        </div>
      </form>
    </div>
  );
}

export function MailApp() {
  const mailData = useGameStore((s) => s.mailData);
  const setMailData = useGameStore((s) => s.setMailData);
  const playerName = useGameStore((s) => s.playerName);
  const act = useGameStore((s) => s.act);
  const signedOffboarding = useGameStore((s) => s.flags.act1.signedOffboarding);
  const setFlag = useGameStore((s) => s.setFlag);
  const [activeFolder, setActiveFolder] = useState<FolderId>('inbox');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(new Set());
  const [pdfOpen, setPdfOpen] = useState<boolean>(false);
  const [composeOpen, setComposeOpen] = useState<boolean>(false);

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

  const actMails: Mail[] = useMemo(
    () => (mailData?.mails ?? []).filter((m) => (m.minAct ?? 1) <= act),
    [mailData, act],
  );
  const mails: Mail[] = useMemo(
    () => (activeFolder === 'inbox' ? actMails : []),
    [activeFolder, actMails],
  );
  const selected = mails.find((m) => m.id === selectedId) ?? null;
  const attachments = selected?.attachments ?? [];
  const isUnread = (m: Mail) => m.unread && !readIds.has(m.id);
  const inboxUnread = actMails.filter(isUnread).length;

  const handleSelectFolder = (id: FolderId) => {
    setActiveFolder(id);
    setSelectedId(null);
    setPdfOpen(false);
  };

  const handleSelectMail = (id: string) => {
    setSelectedId(id);
    setPdfOpen(false);
    setReadIds((prev) => new Set(prev).add(id));
  };

  const handleSign = () => {
    setFlag('act1.signedOffboarding', true);
    setPdfOpen(false);
  };

  const handleSend = (to: string): string | null => {
    if (to.trim().toLowerCase() === REPORT_ADDRESS) {
      setComposeOpen(false);
      triggerEnding('lapor');
      return null;
    }
    return 'Gagal mengirim. Penerima tidak ditemukan.';
  };

  return (
    <div className="relative flex h-full w-full bg-[var(--os-bg)] text-neutral-100">
      <aside className="flex w-[180px] shrink-0 flex-col border-r border-[var(--os-border)] bg-[var(--os-panel)] py-2">
        <button
          type="button"
          onClick={() => setComposeOpen(true)}
          className="mx-3 mb-2 flex items-center justify-center gap-2 border border-neutral-500 bg-transparent px-3 py-2 text-xs font-semibold tracking-wider text-neutral-200 transition-colors hover:bg-white/10"
        >
          <Pencil size={14} strokeWidth={1.75} />
          Tulis Email
        </button>
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
                            mail.from.trim() === '' && 'italic text-neutral-500',
                          )}
                        >
                          {senderOf(mail)}
                        </span>
                        <span className="shrink-0 text-[11px] tabular-nums text-neutral-500">
                          {mail.time}
                        </span>
                      </span>
                      <span
                        className={cx(
                          'truncate text-xs',
                          unread ? 'font-bold text-neutral-200' : 'text-neutral-400',
                          mail.subject.trim() === '' && 'italic text-neutral-500',
                        )}
                      >
                        {subjectOf(mail)}
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
              <h2 className="text-base font-semibold">{subjectOf(selected)}</h2>
              <p className="text-xs text-neutral-400">
                {senderOf(selected)} · {selected.time}
              </p>
            </header>
            <div className="chat-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-200">
                {selected.body.replaceAll('{PLAYER}', playerName)}
              </p>
            </div>
            {attachments.length > 0 ? (
              <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[var(--os-border)] bg-[var(--os-panel)] px-5 py-3">
                {attachments.map((att) => {
                  const isOffboarding = att.fileName === OFFBOARDING_PDF;
                  const isSigned = isOffboarding && signedOffboarding;
                  return (
                    <button
                      key={att.id}
                      type="button"
                      title={att.fileName}
                      onClick={isOffboarding ? () => setPdfOpen(true) : undefined}
                      className="flex items-center gap-2 rounded-md border border-[var(--os-border)] bg-[var(--os-bg)] px-3 py-1.5 text-xs text-neutral-200 transition-colors hover:bg-white/10"
                    >
                      <Paperclip size={14} strokeWidth={1.75} />
                      <span>Lampiran</span>
                      <span className="text-neutral-500">{att.fileName}</span>
                      {isSigned ? (
                        <span className="flex items-center gap-1 font-semibold text-emerald-500">
                          <Check size={12} strokeWidth={2.5} />
                          Ditandatangani
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </footer>
            ) : null}
          </>
        )}
      </section>

      {pdfOpen ? (
        <OffboardingPdf
          playerName={playerName}
          signed={signedOffboarding}
          onSign={handleSign}
          onClose={() => setPdfOpen(false)}
        />
      ) : null}

      {composeOpen ? (
        <ComposeDialog onClose={() => setComposeOpen(false)} onSend={handleSend} />
      ) : null}
    </div>
  );
}