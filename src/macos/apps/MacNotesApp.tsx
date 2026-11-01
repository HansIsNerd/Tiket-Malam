import { useEffect } from 'react';
import { useGameStore } from '@core/stores/gameStore';

const NOTE_TITLE = 'Hari terakhir';
const NOTE_META = '1 Nov 2025 pukul 23.12';

const NOTE_POINTS: readonly string[] = [
  'Log akses lantai 4 dihapus manual setiap Jumat.',
  'Tiga laporan terkirim. Tidak ada balasan.',
  'Login bagas.p ke L4-PC-01 setiap 03:00, padahal aku belum login.',
  'Matikan proses 03:00 (gagal, PID naik)',
  'Dokumen offboarding sudah bertanda tangan sebelum aku membacanya.',
  'Rekaman terakhir kusimpan di Documents.',
  'Malam ini naik ke lantai 4.',
];

export function MacNotesApp() {
  const setFlag = useGameStore((s) => s.setFlag);

  useEffect(() => {
    setFlag('mac.notesRead', true);
  }, [setFlag]);

  return (
    <div className="flex h-full min-h-0 bg-[#FBFBF8] text-neutral-800">
      <aside className="flex w-44 shrink-0 flex-col border-r border-black/10 bg-[#F0EFEA] p-2">
        <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          iCloud
        </p>
        <button
          type="button"
          className="rounded-md bg-[#F2C94C]/70 px-2 py-1.5 text-left"
          aria-current="true"
        >
          <span className="block truncate text-[13px] font-semibold">{NOTE_TITLE}</span>
          <span className="block truncate text-[11px] text-neutral-600">{NOTE_META}</span>
        </button>
      </aside>

      <article className="min-w-0 flex-1 overflow-auto px-8 py-6">
        <p className="mb-3 text-center text-[11px] text-neutral-400">{NOTE_META}</p>
        <h1 className="mb-4 text-xl font-bold">{NOTE_TITLE}</h1>
        <ol className="list-decimal space-y-2.5 pl-6 text-[14px] leading-snug marker:text-neutral-400">
          {NOTE_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ol>
      </article>
    </div>
  );
}