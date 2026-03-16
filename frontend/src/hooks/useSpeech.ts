import { useCallback, useEffect, useMemo, useState } from "react";

export type SpeechStatus = "idle" | "speaking";

export const useSpeech = () => {
  const isSupported = useMemo(() => typeof window !== "undefined" && "speechSynthesis" in window, []);
  const [status, setStatus] = useState<SpeechStatus>("idle");

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setStatus("idle");
  }, [isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported) return false;
    const t = (text || "").trim();
    if (!t) return false;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(t);
    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");
    setStatus("speaking");
    window.speechSynthesis.speak(utterance);
    return true;
  }, [isSupported]);

  // Stop speech when the tab is backgrounded.
  useEffect(() => {
    if (!isSupported) return;
    const onVis = () => {
      if (document.visibilityState !== "visible") {
        window.speechSynthesis.cancel();
        setStatus("idle");
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [isSupported]);

  return { isSupported, status, speak, cancel };
};

