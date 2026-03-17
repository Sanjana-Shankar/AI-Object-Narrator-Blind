import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SpeechRecognitionType = any;

export const useSpeechRecognition = (opts?: { lang?: string }) => {
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [lastResult, setLastResult] = useState<string>("");
  const [lastError, setLastError] = useState<string | null>(null);

  const RecognitionCtor = useMemo(() => {
    if (typeof window === "undefined") return null;
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
  }, []);

  const isSupported = !!RecognitionCtor;

  const stop = useCallback(() => {
    const r = recognitionRef.current;
    if (!r) return;
    try {
      r.stop();
    } catch {
      // ignore
    }
  }, []);

  const start = useCallback(() => {
    if (!RecognitionCtor) return false;
    if (isListening) return true;

    setLastError(null);
    setLastResult("");

    const r = new RecognitionCtor();
    recognitionRef.current = r;
    r.lang = opts?.lang || "en-US";
    r.interimResults = false;
    r.continuous = false;
    r.maxAlternatives = 1;

    r.onstart = () => setIsListening(true);
    r.onend = () => setIsListening(false);
    r.onerror = (e: any) => {
      setIsListening(false);
      setLastError(e?.error || "Speech recognition error");
    };
    r.onresult = (event: any) => {
      const text = event?.results?.[0]?.[0]?.transcript;
      if (typeof text === "string") setLastResult(text);
    };

    try {
      r.start();
      return true;
    } catch (e: any) {
      setLastError(e?.message ?? "Failed to start speech recognition");
      setIsListening(false);
      return false;
    }
  }, [RecognitionCtor, isListening, opts?.lang]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort?.();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, []);

  return { isSupported, isListening, lastResult, lastError, start, stop };
};

