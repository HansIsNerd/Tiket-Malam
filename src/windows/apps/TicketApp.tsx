import { useEffect, useState } from 'react';
import { Ticket as TicketIcon } from 'lucide-react';
import { useGameStore } from '@core/stores/gameStore';
import { loadTicketData } from '@core/services/dataLoader';
import type { Ticket, TicketPriority } from '@core/types/tickets';
import { cx } from '@core/utils/cx';

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
};

const ACTION_BTN =
  'h-8 border border-neutral-500 bg-transparent px-4 text-xs font-semibold tracking-wider text-neutral-200 transition-colors hover:bg-white/10';
interface FieldProps {
  label: string;
  value: string;
}

function Field({ label, value }: FieldProps) {
  return (
    <div className="grid grid-cols-[110px_1fr] border-b border-[var(--os-border)] text-xs">
      <dt className="bg-[var(--os-panel)] px-3 py-2 uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="px-3 py-2 text-neutral-200">{value}</dd>
    </div>
  );
}

interface TicketActionsProps {
  ticket: Ticket;
}

function TicketActions({ ticket }: TicketActionsProps) {
  const closeClicked = useGameStore((s) => s.flags.act1.ticket4471CloseClicked);
  const setFlag = useGameStore((s) => s.setFlag);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const isSpecial = ticket.closeButtonDisappears === true;
  const showClose = !(isSpecial && closeClicked);

  const handleClose = () => {
    if (isSpecial) {
      setFlag('act1.ticket4471CloseClicked', true);
    }
  };

  const handleReply = () => {
    if (isSpecial) {
      setFlag('act1.ticket4471ReplyAttempted', true);
    }
    setDialogOpen(true);
  };

  const handleRemote = () => {
    console.log('Trigger Remote App');
  };

  return (
    <>
      <div className="mt-auto flex h-14 shrink-0 items-center gap-2 border-t border-[var(--os-border)] bg-[var(--os-panel)] px-4">
        <div className="flex h-8 w-[92px] shrink-0 items-center">
          {showClose ? (
            <button
              type="button"
              onClick={handleClose}
              className={cx(ACTION_BTN, 'w-full px-0')}
            >
              [ CLOSE ]
            </button>
          ) : null}
        </div>
        <button type="button" onClick={handleReply} className={ACTION_BTN}>
          [ BALAS ]
        </button>
        {ticket.hasRemoteButton === true ? (
          <button type="button" onClick={handleRemote} className={ACTION_BTN}>
            [ REMOTE KE PC ]
          </button>
        ) : null}
      </div>

      {dialogOpen ? (
        <div
          role="alertdialog"
          aria-modal="true"
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/50"
        >
          <div className="flex w-72 flex-col gap-4 border border-neutral-500 bg-[var(--os-panel)] p-4 text-xs text-neutral-200 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
            <p>Gagal mengirim. Penerima tidak ditemukan.</p>
            <button
              type="button"
              autoFocus
              onClick={() => setDialogOpen(false)}
              className={cx(ACTION_BTN, 'self-end')}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function TicketApp() {
  const ticketData = useGameStore((s) => s.ticketData);
  const setTicketData = useGameStore((s) => s.setTicketData);
  const playerName = useGameStore((s) => s.playerName);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  useEffect(() => {
    if (ticketData) return;
    let cancelled = false;
    loadTicketData()
      .then((data) => {
        if (!cancelled) setTicketData(data);
      })
      .catch((err: unknown) => {
        console.warn(err);
      });
    return () => {
      cancelled = true;
    };
  }, [ticketData, setTicketData]);

  const tickets = [...(ticketData?.tickets ?? [])].sort(
    (a, b) => b.number - a.number,
  );
  const activeTicket = tickets.find((t) => t.id === activeTicketId) ?? null;

  const resolveName = (name: string): string =>
    name === 'player' ? playerName : name;

  return (
    <div className="relative flex h-full w-full bg-[var(--os-bg)] text-neutral-100">
      <aside className="flex w-[350px] shrink-0 flex-col border-r border-[var(--os-border)] bg-[var(--os-panel)]">
        <div className="grid grid-cols-[64px_1fr_64px] border-b border-[var(--os-border)] px-3 py-2 text-[10px] uppercase tracking-wider text-neutral-500">
          <span>No.</span>
          <span>Subjek</span>
          <span className="text-right">Status</span>
        </div>
        <ul className="chat-scroll min-h-0 flex-1 overflow-y-auto">
          {tickets.map((ticket) => {
            const isOpen = ticket.status === 'open';
            const isActive = ticket.id === activeTicketId;
            return (
              <li key={ticket.id} className="border-b border-[var(--os-border)]">
                <button
                  type="button"
                  onClick={() => setActiveTicketId(ticket.id)}
                  className={cx(
                    'grid w-full grid-cols-[64px_1fr_64px] items-center px-3 py-2.5 text-left text-xs transition-colors hover:bg-white/10',
                    isActive && 'bg-white/10',
                  )}
                >
                  <span className="tabular-nums text-neutral-400">
                    #{ticket.number}
                  </span>
                  <span className="truncate pr-2">{ticket.title}</span>
                  <span
                    className={cx(
                      'justify-self-end rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                      isOpen
                        ? 'border-amber-500/50 text-amber-400'
                        : 'border-neutral-600 text-neutral-500',
                    )}
                  >
                    {isOpen ? 'Open' : 'Closed'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-[var(--os-bg)]">
        {activeTicket === null ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-neutral-500">
            <TicketIcon size={32} strokeWidth={1.5} />
            <p className="text-sm">Pilih tiket untuk melihat detail</p>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="chat-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
              <header className="flex flex-col gap-1 border-b border-[var(--os-border)] px-4 py-3">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                  Tiket #{activeTicket.number}
                </span>
                <h2 className="text-sm font-semibold">{activeTicket.title}</h2>
              </header>

              <dl className="border-b border-[var(--os-border)]">
                <Field label="Subjek" value={activeTicket.title} />
                <Field
                  label="Pengirim"
                  value={
                    activeTicket.from ? resolveName(activeTicket.from) : '-'
                  }
                />
                <Field label="Waktu" value={activeTicket.createdAt ?? '-'} />
                <Field
                  label="Prioritas"
                  value={
                    activeTicket.priority
                      ? PRIORITY_LABEL[activeTicket.priority]
                      : '-'
                  }
                />
                <Field
                  label="Status"
                  value={activeTicket.status === 'open' ? 'Open' : 'Closed'}
                />
              </dl>

              <div className="flex flex-col gap-2 px-4 py-4">
                <h3 className="text-[10px] uppercase tracking-wider text-neutral-500">
                  Deskripsi
                </h3>
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-neutral-200">
                  {activeTicket.description ?? '-'}
                </p>
              </div>

              {activeTicket.status === 'closed' ? (
                <div className="mx-4 mb-4 flex flex-col gap-2 border border-[var(--os-border)] bg-[var(--os-panel)] p-3">
                  <h3 className="text-[10px] uppercase tracking-wider text-neutral-500">
                    Penutupan
                  </h3>
                  <dl className="grid grid-cols-[110px_1fr] gap-y-1 text-xs">
                    <dt className="text-neutral-500">Ditutup oleh</dt>
                    <dd>
                      {activeTicket.closedBy
                        ? resolveName(activeTicket.closedBy)
                        : '-'}
                    </dd>
                    <dt className="text-neutral-500">Waktu</dt>
                    <dd>{activeTicket.closedAt ?? '-'}</dd>
                    <dt className="text-neutral-500">Catatan</dt>
                    <dd className="whitespace-pre-wrap">
                      {activeTicket.resolution ?? '-'}
                    </dd>
                  </dl>
                </div>
              ) : null}
            </div>

            {activeTicket.status === 'open' ? (
              <TicketActions key={activeTicket.id} ticket={activeTicket} />
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}