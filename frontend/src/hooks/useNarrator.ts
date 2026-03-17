import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSpeech } from "@/hooks/useSpeech";

export interface DetectedObject {
  id: string;
  label: string;
  confidence: number;
  box: [number, number, number, number];
  timestamp: number;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

type AnalyzeResponse = {
  objects: DetectedObject[];
  transcript: string;
  audio_url?: string | null;
};

type UseNarratorOptions = {
  autoSpeak?: boolean;
};

const hashBlob = async (blob: Blob) => {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const mergeUniqueByLabel = (prev: DetectedObject[], next: DetectedObject[]) => {
  const byLabel = new Map<string, DetectedObject>();
  for (const o of prev) byLabel.set(o.label, o);
  for (const o of next) {
    const existing = byLabel.get(o.label);
    if (!existing) {
      byLabel.set(o.label, o);
      continue;
    }
    // Keep a stable id for list rendering; update recency and best score.
    byLabel.set(o.label, {
      ...existing,
      confidence: Math.max(existing.confidence, o.confidence),
      box: o.box,
      timestamp: o.timestamp,
    });
  }
  return Array.from(byLabel.values()).sort((a, b) => b.timestamp - a.timestamp);
};

export const useNarrator = (isActive: boolean, opts: UseNarratorOptions = {}) => {
  const [objects, setObjects] = useState<DetectedObject[]>([]); // history (unique by label)
  const [currentObjects, setCurrentObjects] = useState<DetectedObject[]>([]);
  const [transcript, setTranscript] = useState<string>("");
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isLoading, setIsLoading] = useState(false); // camera connect
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [lastCaptureHash, setLastCaptureHash] = useState<string | null>(null);
  const [lastSpokenHash, setLastSpokenHash] = useState<string | null>(null);

  const { speak, status: speechStatus } = useSpeech();

  const apiBase = useMemo(() => {
    const raw = (import.meta as any).env?.VITE_BACKEND_URL as string | undefined;
    if (raw && raw.trim()) {
      return raw.trim().replace(/\/$/, "");
    }

    const isNative = Boolean((window as any)?.Capacitor?.isNativePlatform?.());
    return isNative ? "" : "http://localhost:8000";
  }, []);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (!stream) {
      el.srcObject = null;
      return;
    }
    el.srcObject = stream;
  }, [stream]);

  const connect = useCallback(async () => {
    if (status === 'connected' || status === 'connecting') return;
    setLastError(null);
    setStatus('connecting');
    setIsLoading(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(media);
      setStatus('connected');
    } catch (e: any) {
      setLastError(e?.message ?? "Failed to enable camera");
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  const disconnect = useCallback(() => {
    setStatus('disconnected');
    setObjects([]);
    setCurrentObjects([]);
    setTranscript("");
    setLastError(null);
    setIsAnalyzing(false);
    setAudioUrl(null);
    setLastCaptureHash(null);
    setLastSpokenHash(null);
    setStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  const captureAndAnalyze = useCallback(async (prompt?: string) => {
    if (!videoRef.current) return;
    if (status !== "connected") return;
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    setLastError(null);

    try {
      const video = videoRef.current;
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) {
        throw new Error("Camera not ready yet");
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.drawImage(video, 0, 0, w, h);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Failed to capture image"))),
          "image/jpeg",
          0.92
        );
      });

      const captureHash = await hashBlob(blob);
      setLastCaptureHash(captureHash);

      const form = new FormData();
      form.append("image", blob, "capture.jpg");
      if (prompt && prompt.trim()) {
        form.append("prompt", prompt.trim());
      }

      if (!apiBase) {
        throw new Error("Backend URL is not configured. Set VITE_BACKEND_URL before mobile build.");
      }

      const res = await fetch(`${apiBase}/analyze`, { method: "POST", body: form });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Analyze failed (${res.status})`);
      }
      const data = (await res.json()) as AnalyzeResponse;

      const nextObjs = Array.isArray(data.objects) ? data.objects : [];
      setCurrentObjects(nextObjs);
      setObjects((prev) => mergeUniqueByLabel(prev, nextObjs).slice(0, 25));

      const nextTranscript = typeof data.transcript === "string" ? data.transcript : "";
      setTranscript(nextTranscript);

      const u = data.audio_url ?? null;
      setAudioUrl(u);

      const shouldAutoSpeak = (opts.autoSpeak ?? true) && captureHash !== lastSpokenHash;
      if (shouldAutoSpeak && nextTranscript) {
        speak(nextTranscript);
        setLastSpokenHash(captureHash);
      }
    } catch (e: any) {
      setLastError(e?.message ?? "Analyze failed");
    } finally {
      setIsAnalyzing(false);
    }
  }, [apiBase, isAnalyzing, status, opts.autoSpeak, lastSpokenHash, speak]);

  const speakTranscript = useCallback(() => {
    if (!transcript) return false;
    return speak(transcript);
  }, [speak, transcript]);

  return {
    objects,
    currentObjects,
    transcript,
    audioUrl,
    status,
    isLoading,
    isAnalyzing,
    speechStatus,
    lastError,
    lastCaptureHash,
    videoRef,
    connect,
    disconnect,
    captureAndAnalyze,
    speakTranscript,
  };
};
