class SoundEffects {
  private static ctx: AudioContext | null = null;

  private static getContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume context if suspended (browsers block audio until user interaction)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  static playCorrect() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      
      const now = ctx.currentTime;
      // Rising chime: C5 (523.25Hz) then E5 (659.25Hz)
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (err) {
      console.error('[sounds] Play correct failed:', err);
    }
  }

  static playWrong() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Triangle oscillator gives a nice buzzer-like timbre
      osc.type = 'triangle';
      
      const now = ctx.currentTime;
      // Descending buzz (180Hz down to 90Hz)
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.3);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (err) {
      console.error('[sounds] Play wrong failed:', err);
    }
  }

  static playAchievement() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Celebratory arpeggio: C5 (523.25) -> E5 (659.25) -> G5 (783.99) -> C6 (1046.50)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const duration = 0.1;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * duration);
        
        const noteStart = now + idx * duration;
        gain.gain.setValueAtTime(0.08, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(noteStart);
        osc.stop(noteStart + 0.3);
      });
    } catch (err) {
      console.error('[sounds] Play achievement failed:', err);
    }
  }

  static playSessionComplete() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Uplifting fanfare chord progression: C4 -> E4 -> G4 -> C5 -> E5 -> G5 -> C6
      const chord = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      const stagger = 0.05;

      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * stagger);
        
        const noteStart = now + idx * stagger;
        gain.gain.setValueAtTime(0.05, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.6);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(noteStart);
        osc.stop(noteStart + 0.6);
      });
    } catch (err) {
      console.error('[sounds] Play session complete failed:', err);
    }
  }
}

export default SoundEffects;
