import { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';

const PORTRAIT_QUERY = '(orientation: portrait)';

function readPortrait(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(PORTRAIT_QUERY).matches;
}

export function OrientationLock() {
  const [isPortrait, setIsPortrait] = useState<boolean>(readPortrait);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(PORTRAIT_QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsPortrait(e.matches);
    setIsPortrait(mql.matches);
    mql.addEventListener('change', onChange);
    return () => {
      mql.removeEventListener('change', onChange);
    };
  }, []);

  if (!isPortrait) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-0 z-[2147483647] flex flex-col items-center justify-center gap-6 bg-black px-8 text-center text-white"
    >
      <RotateCw size={56} strokeWidth={1.5} aria-hidden="true" />
      <p className="max-w-xs text-base leading-relaxed">
        Tolong putar perangkat Anda ke mode Landscape (Mendatar) untuk bermain.
      </p>
    </div>
  );
}