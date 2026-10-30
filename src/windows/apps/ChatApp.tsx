import { useEffect, useState } from 'react';
import { Circle, MessageSquare } from 'lucide-react';
import { useGameStore } from '@core/stores/gameStore';
import { loadChatData } from '@core/services/dataLoader';
import { cx } from '@core/utils/cx';

export function ChatApp() {
  const chatData = useGameStore((s) => s.chatData);
  const setChatData = useGameStore((s) => s.setChatData);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);

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

  const contacts = chatData?.contacts ?? [];

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
                  onClick={() => setActiveContactId(contact.id)}
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
        {activeContactId === null ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-neutral-500">
            <MessageSquare size={32} strokeWidth={1.5} />
            <p className="text-sm">Pilih kontak untuk mulai mengobrol</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}