import { Howl, Howler } from 'howler';

const sounds = {
  ambientHum: new Howl({
    src: ['/assets/audio/ambient_hum.ogg'],
    loop: true,
    volume: 0.2,
    preload: true,
  }),
};

export const audioService = {
  playAmbient: () => {
    if (!sounds.ambientHum.playing()) {
      sounds.ambientHum.play();
    }
  },

  stopAmbient: () => {
    sounds.ambientHum.stop();
  },

  // Fungsi SFX dibiarkan kosong sementara sampai file audionya siap
  playSFX: (soundName: string) => {
    console.log(`[Audio] Mencoba memutar SFX: ${soundName} (file belum ada)`);
  },

  setVolume: (volume: number) => {
    const safeVolume = Math.max(0, Math.min(100, volume));
    Howler.volume(safeVolume / 100);
  },
};