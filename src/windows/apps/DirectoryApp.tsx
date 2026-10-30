import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { useGameStore } from '@core/stores/gameStore';
import { loadDirectoryData } from '@core/services/dataLoader';
import type { Employee, EmployeeStatus } from '@core/types/directory';
import { cx } from '@core/utils/cx';

const STATUS_LABEL: Record<EmployeeStatus, string> = {
  active: 'Active',
  resigned: 'Resigned',
};

const STATUS_CLASS: Record<EmployeeStatus, string> = {
  active: 'border-emerald-500/50 text-emerald-400',
  resigned: 'border-red-500/50 text-red-400',
};

const ROW_GRID = 'grid grid-cols-[1.2fr_1.4fr_96px] items-center gap-2 px-4';

interface ProfilePanelProps {
  employee: Employee;
  displayName: string;
}

function ProfilePanel({ employee, displayName }: ProfilePanelProps) {
  const initials = displayName
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center gap-4 overflow-y-auto px-6 py-8">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-neutral-600 text-3xl font-semibold text-neutral-200">
        {employee.id === 'bagas_p' ? 'BP' : initials}
      </div>
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-base font-semibold">{displayName}</h2>
        {employee.username ? (
          <span className="text-xs text-neutral-500">{employee.username}</span>
        ) : null}
      </div>
      <dl className="w-full max-w-xs border-t border-[var(--os-border)] text-xs">
        <div className="grid grid-cols-[90px_1fr] border-b border-[var(--os-border)]">
          <dt className="bg-[var(--os-panel)] px-3 py-2 uppercase tracking-wide text-neutral-500">
            Jabatan
          </dt>
          <dd className="px-3 py-2 text-neutral-200">{employee.detail ?? employee.role}</dd>
        </div>
        <div className="grid grid-cols-[90px_1fr] border-b border-[var(--os-border)]">
          <dt className="bg-[var(--os-panel)] px-3 py-2 uppercase tracking-wide text-neutral-500">
            Status
          </dt>
          <dd className="px-3 py-2">
            <span
              className={cx(
                'rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                STATUS_CLASS[employee.status],
              )}
            >
              {STATUS_LABEL[employee.status]}
            </span>
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function DirectoryApp() {
  const directoryData = useGameStore((s) => s.directoryData);
  const setDirectoryData = useGameStore((s) => s.setDirectoryData);
  const playerName = useGameStore((s) => s.playerName);
  const setFlag = useGameStore((s) => s.setFlag);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (directoryData) return;
    let cancelled = false;
    loadDirectoryData()
      .then((data) => {
        if (!cancelled) setDirectoryData(data);
      })
      .catch((err: unknown) => {
        console.warn(err);
      });
    return () => {
      cancelled = true;
    };
  }, [directoryData, setDirectoryData]);

  const employees = directoryData?.employees ?? [];
  const active = employees.find((e) => e.id === activeId) ?? null;

  const resolveName = (name: string): string => (name === 'player' ? playerName : name);

  const handleSelect = (employee: Employee) => {
    if (employee.hasProfile !== true) return;
    setActiveId(employee.id);
    if (employee.id === 'bagas_p') {
      setFlag('act1.directoryBagasSeen', true);
    }
  };

  return (
    <div className="flex h-full w-full bg-[var(--os-bg)] text-neutral-100">
      <section className="flex min-w-0 flex-1 flex-col border-r border-[var(--os-border)]">
        <div
          className={cx(
            ROW_GRID,
            'border-b border-[var(--os-border)] bg-[var(--os-panel)] py-2 text-[10px] uppercase tracking-wider text-neutral-500',
          )}
        >
          <span>Nama</span>
          <span>Jabatan</span>
          <span className="text-right">Status</span>
        </div>
        <ul className="chat-scroll min-h-0 flex-1 overflow-y-auto">
          {employees.map((employee) => {
            const clickable = employee.hasProfile === true;
            const isResigned = employee.status === 'resigned';
            return (
              <li key={employee.id} className="border-b border-[var(--os-border)]">
                <button
                  type="button"
                  onClick={() => handleSelect(employee)}
                  disabled={!clickable}
                  className={cx(
                    ROW_GRID,
                    'w-full py-2.5 text-left text-xs transition-colors',
                    clickable ? 'hover:bg-white/10' : 'cursor-default',
                    employee.id === activeId && 'bg-white/10',
                    isResigned && 'text-neutral-400',
                  )}
                >
                  <span className="truncate">{resolveName(employee.name)}</span>
                  <span className="truncate text-neutral-400">{employee.role}</span>
                  <span
                    className={cx(
                      'justify-self-end rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                      STATUS_CLASS[employee.status],
                    )}
                  >
                    {STATUS_LABEL[employee.status]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex w-[320px] shrink-0 flex-col bg-[var(--os-bg)]">
        {active === null ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-neutral-500">
            <Users size={32} strokeWidth={1.5} />
            <p className="text-sm">Pilih karyawan untuk melihat profil</p>
          </div>
        ) : (
          <ProfilePanel employee={active} displayName={resolveName(active.name)} />
        )}
      </section>
    </div>
  );
}