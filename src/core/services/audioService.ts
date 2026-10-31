import { Howl, Howler } from 'howler';

export type SfxName = 'notification' | 'click' | 'error';

const AMBIENT_VOLUME = 0.2;
const SFX_VOLUME = 0.6;

const SFX_SOURCES: Record<SfxName, string> = {
  notification: '/assets/audio/notification.mp3',
  click: '/assets/audio/click.mp3',
  error: '/assets/audio/error.mp3',
};
const AMBIENT_SOURCE = '/assets/audio/server_hum.mp3';

const sfxCache = new Map<SfxName, Howl>();
let ambient: Howl | null = null;

function getSfx(name: SfxName): Howl {
  const cached = sfxCache.get(name);
  if (cached) return cached;
  const howl = new Howl({
    src: [SFX_SOURCES[name]],
    volume: SFX_VOLUME,
    preload: true,
    onloaderror: () => {
      console.warn(`[Audio] Gagal memuat SFX: ${name}`);
    },
  });
  sfxCache.set(name, howl);
  return howl;
}

function getAmbient(): Howl {
  if (ambient) return ambient;
  ambient = new Howl({
    src: [AMBIENT_SOURCE],
    loop: true,
    volume: AMBIENT_VOLUME,
    preload: true,
    onloaderror: () => {
      console.warn('[Audio] Gagal memuat ambient');
    },
  });
  return ambient;
}

export function playSFX(soundName: SfxName): void {
  const howl = getSfx(soundName);
  if (howl.state() === 'unloaded') return;
  howl.play();
}

export function playAmbient(): void {
  const howl = getAmbient();
  if (howl.playing()) return;
  howl.play();
}

export function stopAmbient(): void {
  if (!ambient) return;
  ambient.stop();
}

export function setMasterVolume(percent: number): void {
  const clamped = Math.min(100, Math.max(0, percent));
  Howler.volume(clamped / 100);
  Howler.mute(clamped === 0);
}