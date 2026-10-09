/**
 * notificationSound — Modern notification chime using Web Audio API.
 * No external file needed; generates a pleasant two-tone bell sound.
 * Also provides vibration patterns for mobile devices.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

interface ChimeOptions {
  volume?: number;
  vibrate?: boolean;
}

/**
 * Play a pleasant two-tone notification chime.
 * Uses oscillators with a soft envelope — no audio file required.
 */
export function playNotificationChime(opts: ChimeOptions = {}): void {
  const { volume = 0.3, vibrate = true } = opts;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // First tone — higher bell
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(880, now);
  osc1.frequency.exponentialRampToValueAtTime(660, now + 0.15);

  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(volume, now + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.4);

  // Second tone — lower bell (delayed)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(660, now + 0.12);
  osc2.frequency.exponentialRampToValueAtTime(440, now + 0.3);

  gain2.gain.setValueAtTime(0, now + 0.12);
  gain2.gain.linearRampToValueAtTime(volume * 0.8, now + 0.14);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.12);
  osc2.stop(now + 0.5);

  // Vibration on supported devices
  if (vibrate && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([80, 40, 80]);
    } catch {
      // ignore
    }
  }
}

/**
 * Play a short alert sound for urgent reminders (e.g. jadwal starting soon).
 */
export function playReminderSound(opts: ChimeOptions = {}): void {
  const { volume = 0.35, vibrate = true } = opts;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Three quick ascending tones
  const freqs = [523, 659, 784]; // C5, E5, G5
  freqs.forEach((freq, i) => {
    const start = now + i * 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.25);
  });

  if (vibrate && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([60, 30, 60, 30, 100]);
    } catch {
      // ignore
    }
  }
}

/**
 * Vibrate the device with a custom pattern (no sound).
 */
export function vibrateDevice(pattern: number | number[] = [80, 40, 80]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }
}
