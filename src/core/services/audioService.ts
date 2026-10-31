import { Howl, Howler } from 'howler';

const AMBIENT_VOLUME = 0.2;
const AMBIENT_FADE_IN_MS = 3000;
const AMBIENT_FADE_OUT_MS = 1500;

const sounds = {
  ambientHum: new Howl({
    src: ['/assets/audio/ambient_hum.ogg'],
    loop: true,
    volume: 0,
    preload: true,
  }),
};

let stopTimer: number | null = null;

function clearStopTimer(): void {
  if (stopTimer !== null) {
    window.clearTimeout(stopTimer);
    stopTimer = null;
  }
}

export function playAmbient(fadeMs: number = AMBIENT_FADE_IN_MS): void {
  const hum = sounds.ambientHum;
  clearStopTimer();
  const from = hum.playing() ? hum.volume() : 0;
  if (!hum.playing()) {
    hum.volume(0);
    hum.play();
  }
  hum.fade(from, AMBIENT_VOLUME, fadeMs);
}

export function stopAmbient(fadeMs: number = AMBIENT_FADE_OUT_MS): void {
  const hum = sounds.ambientHum;
  if (!hum.playing()) return;
  clearStopTimer();
  hum.fade(hum.volume(), 0, fadeMs);
  stopTimer = window.setTimeout(() => {
    hum.stop();
    stopTimer = null;
  }, fadeMs);
}

export function playSFX(soundName: string): void {
  console.log(`[Audio] Mencoba memutar SFX: ${soundName} (file belum ada)`);
}

export function setMasterVolume(volume: number): void {
  const safeVolume = Math.max(0, Math.min(100, volume));
  Howler.volume(safeVolume / 100);
}

export const audioService = {
  playAmbient,
  stopAmbient,
  playSFX,
  setVolume: setMasterVolume,
  setMasterVolume,
};