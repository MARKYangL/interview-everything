// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: any;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
  prototype: SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface SpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private options: SpeechRecognitionOptions = {
    continuous: true,
    interimResults: true,
    lang: 'en-US',
  };

  constructor() {
    // Check if the browser supports speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        this.recognition = new SpeechRecognitionAPI();
      }
    }
  }

  public setup(options: SpeechRecognitionOptions): void {
    if (!this.recognition) {
      console.error('Speech recognition is not supported in this browser');
      return;
    }

    this.options = { ...this.options, ...options };
    
    // Configure the recognition instance
    this.recognition.continuous = this.options.continuous || true;
    this.recognition.interimResults = this.options.interimResults || true;
    this.recognition.lang = this.options.lang || 'en-US';

    // Set up event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.options.onStart) this.options.onStart();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.options.onEnd) this.options.onEnd();
    };

    this.recognition.onerror = (event) => {
      if (this.options.onError) this.options.onError(event);
    };

    this.recognition.onspeechstart = () => {
      this.isSpeaking = true;
      if (this.options.onSpeechStart) this.options.onSpeechStart();
    };

    this.recognition.onspeechend = () => {
      this.isSpeaking = false;
      if (this.options.onSpeechEnd) this.options.onSpeechEnd();
    };

    this.recognition.onresult = (event) => {
      if (this.options.onResult) {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        const isFinal = event.results[last].isFinal;
        this.options.onResult(transcript, isFinal);
      }
    };
  }

  public start(): void {
    if (!this.recognition) {
      console.error('Speech recognition is not supported in this browser');
      return;
    }

    if (!this.isListening) {
      try {
        this.recognition.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  }

  public stop(): void {
    if (!this.recognition) {
      return;
    }

    if (this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
  }

  public getStatus(): { isListening: boolean; isSpeaking: boolean } {
    return {
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
    };
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }
}

const speechRecognitionService = new SpeechRecognitionService();
export default speechRecognitionService; 