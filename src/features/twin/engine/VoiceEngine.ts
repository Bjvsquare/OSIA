// ═══════════════════════════════════════════════════════════
// VoiceEngine — Speech-to-Text and Text-to-Speech for the Twin
// Uses Web Speech API (browser-native, no API key needed)
// ═══════════════════════════════════════════════════════════

export interface VoiceEngineCallbacks {
  onTranscript: (text: string, isFinal: boolean) => void;
  onSpeakStart: () => void;
  onSpeakEnd: () => void;
  onSpeakAmplitude: (amplitude: number) => void;
  onError: (error: string) => void;
}

// Type augmentation for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

let recognition: any = null;
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let amplitudeFrameId: number | null = null;

/**
 * Initialize and start speech recognition (STT).
 * Returns a cleanup function.
 */
export function startListening(callbacks: VoiceEngineCallbacks): () => void {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    callbacks.onError('Speech recognition not supported in this browser');
    return () => {};
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      callbacks.onTranscript(finalTranscript, true);
    } else if (interimTranscript) {
      callbacks.onTranscript(interimTranscript, false);
    }
  };

  recognition.onerror = (event: any) => {
    if (event.error !== 'aborted') {
      callbacks.onError(`Speech recognition error: ${event.error}`);
    }
  };

  recognition.onend = () => {
    // Auto-restart if not explicitly stopped
    if (recognition) {
      try { recognition.start(); } catch { /* already running */ }
    }
  };

  try {
    recognition.start();
  } catch (e) {
    callbacks.onError('Failed to start speech recognition');
  }

  return () => {
    if (recognition) {
      recognition.onend = null; // Prevent auto-restart
      recognition.abort();
      recognition = null;
    }
  };
}

/**
 * Stop speech recognition.
 */
export function stopListening(): void {
  if (recognition) {
    recognition.onend = null;
    recognition.abort();
    recognition = null;
  }
}

/**
 * Speak text using Web Speech Synthesis (TTS).
 * Monitors audio amplitude for mouth animation.
 */
export function speak(
  text: string,
  callbacks: VoiceEngineCallbacks,
  voiceSettings?: { rate?: number; pitch?: number; voiceName?: string }
): void {
  if (!window.speechSynthesis) {
    callbacks.onError('Speech synthesis not supported');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = voiceSettings?.rate ?? 1.0;
  utterance.pitch = voiceSettings?.pitch ?? 1.0;
  utterance.volume = 1.0;

  // Try to select a natural-sounding voice
  const voices = window.speechSynthesis.getVoices();
  if (voiceSettings?.voiceName) {
    const match = voices.find(v => v.name.includes(voiceSettings.voiceName!));
    if (match) utterance.voice = match;
  } else {
    // Prefer Google or Microsoft voices for quality
    const preferred = voices.find(
      v => v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Natural')
    );
    if (preferred) utterance.voice = preferred;
  }

  utterance.onstart = () => {
    callbacks.onSpeakStart();
    startAmplitudeMonitoring(callbacks);
  };

  utterance.onend = () => {
    callbacks.onSpeakEnd();
    stopAmplitudeMonitoring();
  };

  utterance.onerror = () => {
    callbacks.onSpeakEnd();
    stopAmplitudeMonitoring();
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Stop speaking.
 */
export function stopSpeaking(): void {
  window.speechSynthesis?.cancel();
  stopAmplitudeMonitoring();
}

/**
 * Simulate mouth amplitude during speech.
 * Since Web Speech Synthesis doesn't expose audio data directly,
 * we generate a natural-looking mouth pattern.
 */
function startAmplitudeMonitoring(callbacks: VoiceEngineCallbacks): void {
  let time = 0;
  const update = () => {
    time += 0.016; // ~60fps

    // Natural speech amplitude pattern: mix of frequencies
    const base = Math.sin(time * 8) * 0.3;  // Syllable rhythm
    const mid = Math.sin(time * 14) * 0.2;  // Word rhythm
    const high = Math.sin(time * 25) * 0.1;  // Consonant bursts
    const noise = (Math.random() - 0.5) * 0.15; // Natural variation

    const amplitude = Math.max(0, Math.min(1, 0.4 + base + mid + high + noise));
    callbacks.onSpeakAmplitude(amplitude);

    amplitudeFrameId = requestAnimationFrame(update);
  };

  amplitudeFrameId = requestAnimationFrame(update);
}

function stopAmplitudeMonitoring(): void {
  if (amplitudeFrameId !== null) {
    cancelAnimationFrame(amplitudeFrameId);
    amplitudeFrameId = null;
  }
}

/**
 * Start monitoring microphone amplitude for real-time mouth sync
 * during user speech (listening mode).
 */
export async function startMicAmplitude(
  callback: (amplitude: number) => void
): Promise<() => void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let frameId: number;

    const update = () => {
      analyser!.getByteFrequencyData(dataArray);

      // Calculate RMS amplitude
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length) / 255;
      const amplitude = Math.min(1, rms * 3); // Scale up for visibility

      callback(amplitude);
      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frameId);
      stream.getTracks().forEach(t => t.stop());
      audioContext?.close();
      audioContext = null;
      analyser = null;
    };
  } catch {
    return () => {};
  }
}
