import { useState } from 'react';
import {
  ChevronLeft,
  Clock,
  FileAudio,
  FileText,
  Folder,
  HardDrive,
  Monitor,
  Download,
  Rocket,
  Globe,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useGameStore } from '@core/stores/gameStore';
import { cx } from '@core/utils/cx';

type EntryKind = 'folder' | 'audio' | 'rtf' | 'txt';

interface FinderEntry {
  name: string;
  kind: EntryKind;
  content?: string;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const JANGAN_TEXT = 'kamu telat 11 bulan.\nkamu sudah di dalam.';

const FAVORITES: readonly SidebarItem[] = [
  { id: 'recents', label: 'Recents', icon: Clock },
  { id: 'applications', label: 'Applications', icon: Rocket },
  { id: 'desktop', label: 'Desktop', icon: Monitor },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'downloads', label: 'Downloads', icon: Download },
];

const LOCATIONS: readonly SidebarItem[] = [
  { id: 'hd', label: 'Macintosh HD', icon: HardDrive },
  { id: 'network', label: 'Network', icon: Globe },
];

const DOCUMENTS_ENTRIES: readonly FinderEntry[] = [
  { name: 'rekaman_0340.wav', kind: 'audio' },
  { name: 'laporan_akses.rtf', kind: 'rtf' },
  { name: 'jangan', kind: 'folder' },
];

const JANGAN_ENTRIES: readonly FinderEntry[] = [
  { name: 'jangan_buka.txt', kind: 'txt', content: JANGAN_TEXT },
];

const ENTRY_ICON: Record<EntryKind, LucideIcon> = {
  folder: Folder,
  audio: FileAudio,
  rtf: FileText,
  txt: FileText,
};

function entriesFor(sidebarId: string, inJangan: boolean): readonly FinderEntry[] {
  if (sidebarId !== 'documents') return [];
  return inJangan ? JANGAN_ENTRIES : DOCUMENTS_ENTRIES;
}

function SidebarGroup({
  title,
  items,
  activeId,
  onSelect,
}: {
  title: string;
  items: readonly SidebarItem[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="mb-3">
      <h2 className="px-2 pb-1 text-[11px] font-semibold text-neutral-500">{title}</h2>
      <ul>
        {items.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => onSelect(id)}
              className={cx(
                'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[13px] text-neutral-800',
                activeId === id ? 'bg-black/10' : 'hover:bg-black/5',
              )}
            >
              <Icon size={15} strokeWidth={1.75} className="text-[#1F72D8]" />
              <span className="truncate">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MacFinderApp() {
  const setFlag = useGameStore((s) => s.setFlag);
  const [location, setLocation] = useState('documents');
  const [inJangan, setInJangan] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [viewing, setViewing] = useState<FinderEntry | null>(null);

  const entries = entriesFor(location, inJangan);
  const pathLabel = inJangan ? 'jangan' : (FAVORITES.concat(LOCATIONS).find((i) => i.id === location)?.label ?? '');

  const selectLocation = (id: string) => {
    setLocation(id);
    setInJangan(false);
    setSelected(null);
    setViewing(null);
  };

  const goBack = () => {
    setInJangan(false);
    setSelected(null);
    setViewing(null);
  };

  const openEntry = (entry: FinderEntry) => {
    if (entry.kind === 'folder' && entry.name === 'jangan') {
      setInJangan(true);
      setSelected(null);
      setFlag('mac.folderJanganOpened', true);
      return;
    }
    setViewing(entry);
  };

  return (
    <div className="flex h-full min-h-0 bg-white text-neutral-800">
      <aside className="w-44 shrink-0 overflow-auto border-r border-black/10 bg-[#E9E9EC]/90 p-2 pt-3">
        <SidebarGroup title="Favorites" items={FAVORITES} activeId={location} onSelect={selectLocation} />
        <SidebarGroup title="Locations" items={LOCATIONS} activeId={location} onSelect={selectLocation} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-9 shrink-0 items-center gap-2 border-b border-black/10 px-3">
          <button
            type="button"
            aria-label="Kembali"
            disabled={!inJangan && !viewing}
            onClick={viewing ? () => setViewing(null) : goBack}
            className="rounded p-0.5 text-neutral-600 hover:bg-black/5 disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-[13px] font-semibold">{viewing ? viewing.name : pathLabel}</span>
        </div>

        {viewing ? (
          <div className="flex-1 overflow-auto bg-[#FBFBF8] p-6">
            {viewing.content ? (
              <pre className="whitespace-pre-wrap font-mono text-[14px] leading-relaxed">
                {viewing.content}
              </pre>
            ) : (
              <p className="text-[13px] text-neutral-500">Pratinjau tidak tersedia.</p>
            )}
          </div>
        ) : entries.length === 0 ? (
          <p className="p-6 text-[13px] text-neutral-400">Folder ini kosong.</p>
        ) : (
          <ul className="flex flex-1 flex-wrap content-start gap-3 overflow-auto p-4">
            {entries.map((entry) => {
              const Icon = ENTRY_ICON[entry.kind];
              return (
                <li key={entry.name}>
                  <button
                    type="button"
                    onClick={() => setSelected(entry.name)}
                    onDoubleClick={() => openEntry(entry)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') openEntry(entry);
                    }}
                    className="flex w-28 flex-col items-center gap-1 rounded-md p-2 text-center"
                  >
                    <Icon
                      size={44}
                      strokeWidth={1.25}
                      className={entry.kind === 'folder' ? 'text-[#5AB4F5]' : 'text-neutral-500'}
                    />
                    <span
                      className={cx(
                        'max-w-full break-all rounded px-1 text-[12px] leading-tight',
                        selected === entry.name ? 'bg-[#1F72D8] text-white' : 'text-neutral-800',
                      )}
                    >
                      {entry.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}