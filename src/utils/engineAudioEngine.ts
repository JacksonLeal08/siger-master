'use client';

/**
 * Motor de Áudio Veicular via Web Audio API (SIGER Master)
 * Sintetiza em tempo real o som contínuo de aceleração de motor a combustão (cilindros + aspiração/escape).
 */

const STORAGE_MUTE_KEY = 'siger_engine_sound_muted';

class EngineAudioEngine {
  private ctx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isRunning: boolean = false;
  private muted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_MUTE_KEY);
      this.muted = saved === 'true';
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_MUTE_KEY, String(muted));
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.28, this.ctx.currentTime);
    }
  }

  private initContext(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Gera um buffer de Ruído Rosa (Pink Noise) de 2 segundos em loop para simular aspiração e escape
   */
  private createPinkNoiseBuffer(): AudioBuffer {
    const bufferSize = this.ctx!.sampleRate * 2;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    return buffer;
  }

  /**
   * Inicializa a síntese contínua do motor em marcha lenta (0%)
   */
  public start(): void {
    if (this.isRunning || typeof window === 'undefined') return;

    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.01, now);
      // Entrada suave
      this.masterGain.gain.exponentialRampToValueAtTime(this.muted ? 0 : 0.28, now + 0.15);
      this.masterGain.connect(this.ctx.destination);

      // Oscilador 1: Cilindros primários (Dente de Serra, 45Hz marcha lenta)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.setValueAtTime(45, now);
      this.osc1.detune.setValueAtTime(-3, now); // Desafinação de -3Hz para encorpar

      // Oscilador 2: Cilindros secundários com detune positivo (+3Hz)
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'sawtooth';
      this.osc2.frequency.setValueAtTime(45, now);
      this.osc2.detune.setValueAtTime(3, now);

      // Sub-Oscilador Triângulo para impacto grave no assoalho acústico
      this.subOsc = this.ctx.createOscillator();
      this.subOsc.type = 'triangle';
      this.subOsc.frequency.setValueAtTime(22.5, now);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.7, now);

      this.osc1.connect(oscGain);
      this.osc2.connect(oscGain);
      this.subOsc.connect(oscGain);
      oscGain.connect(this.masterGain);

      // Camada de Ruído de Aspiração e Escape (Pink Noise + Bandpass Filter)
      const noiseBuffer = this.createPinkNoiseBuffer();
      this.noiseSource = this.ctx.createBufferSource();
      this.noiseSource.buffer = noiseBuffer;
      this.noiseSource.loop = true;

      this.noiseFilter = this.ctx.createBiquadFilter();
      this.noiseFilter.type = 'bandpass';
      this.noiseFilter.frequency.setValueAtTime(180, now);
      this.noiseFilter.Q.setValueAtTime(1.8, now);

      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.setValueAtTime(0.12, now);

      this.noiseSource.connect(this.noiseFilter);
      this.noiseFilter.connect(this.noiseGain);
      this.noiseGain.connect(this.masterGain);

      // Inicia os nós sonoros
      this.osc1.start(now);
      this.osc2.start(now);
      this.subOsc.start(now);
      this.noiseSource.start(now);

      this.isRunning = true;
    } catch (err) {
      console.warn('Web Audio API não autorizada ou bloqueada pelo navegador:', err);
    }
  }

  /**
   * Modula dinamicamente a frequência fundamental de RPM e o filtro conforme o progresso (0 a 100%)
   */
  public updateProgress(pct: number): void {
    if (!this.isRunning || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const normalizedPct = Math.min(100, Math.max(0, pct)) / 100;

      // Rampa de RPM: 45 Hz (0%) até 220 Hz (100%)
      const targetFreq = 45 + normalizedPct * (220 - 45);
      const targetSubFreq = targetFreq / 2;

      // Filtro de aspiração: 180 Hz a 950 Hz
      const targetFilterFreq = 180 + normalizedPct * (950 - 180);

      if (this.osc1) {
        this.osc1.frequency.setTargetAtTime(targetFreq, now, 0.05);
      }
      if (this.osc2) {
        this.osc2.frequency.setTargetAtTime(targetFreq, now, 0.05);
      }
      if (this.subOsc) {
        this.subOsc.frequency.setTargetAtTime(targetSubFreq, now, 0.05);
      }
      if (this.noiseFilter) {
        this.noiseFilter.frequency.setTargetAtTime(targetFilterFreq, now, 0.06);
      }
      if (this.noiseGain) {
        // Aumenta presença de aspiração com a aceleração
        const targetNoiseGain = 0.12 + normalizedPct * 0.18;
        this.noiseGain.gain.setTargetAtTime(targetNoiseGain, now, 0.05);
      }
    } catch {
      // Ignora pequenos atrasos de frame de áudio
    }
  }

  /**
   * Finaliza com rampa exponencial de 0.3s simulando corte/troca de marcha
   */
  public stop(rampSeconds = 0.3): void {
    if (!this.isRunning || !this.ctx || !this.masterGain) {
      this.isRunning = false;
      return;
    }

    try {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + rampSeconds);

      setTimeout(() => {
        try {
          this.osc1?.stop();
          this.osc2?.stop();
          this.subOsc?.stop();
          this.noiseSource?.stop();
          this.osc1?.disconnect();
          this.osc2?.disconnect();
          this.subOsc?.disconnect();
          this.noiseSource?.disconnect();
        } catch {
          // Cleanup seguro
        } finally {
          this.isRunning = false;
          this.osc1 = null;
          this.osc2 = null;
          this.subOsc = null;
          this.noiseSource = null;
        }
      }, rampSeconds * 1000 + 50);
    } catch {
      this.isRunning = false;
    }
  }
}

export const engineAudioEngine = new EngineAudioEngine();
export default engineAudioEngine;
