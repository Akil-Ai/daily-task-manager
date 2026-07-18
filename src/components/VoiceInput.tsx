import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsListening(false);
    };

    rec.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    setRecognition(rec);
  }, [onTranscript]);

  const toggleListening = () => {
    if (!supported || !recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  };

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        className="p-3 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed"
        title="Voice input not supported in this browser"
      >
        <MicOff size={20} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`relative p-3 rounded-full transition-all duration-300 active:scale-95 ${
        isListening
          ? 'bg-rose-500 text-white animate-pulse'
          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/60'
      }`}
      title={isListening ? 'Stop Listening' : 'Voice Input'}
    >
      {isListening && (
        <span className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
      )}
      <Mic size={20} />
    </button>
  );
};
