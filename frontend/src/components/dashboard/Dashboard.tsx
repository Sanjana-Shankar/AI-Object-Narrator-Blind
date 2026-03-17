import { useEffect, useState } from "react";
import { Activity, MessageSquare, Settings, Power } from "lucide-react";
import { useNarrator } from "@/hooks/useNarrator";
import { useSpeech } from "@/hooks/useSpeech";
import CameraFeed from "@/components/dashboard/CameraFeed";
import TranscriptPanel from "@/components/dashboard/TranscriptPanel";
import DetectedObjectsList from "@/components/dashboard/DetectedObjectsList";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import StatusBadge from "@/components/dashboard/StatusBadge";
import LandingView from "@/components/dashboard/LandingView";
import { ChatModal } from "@/components/dashboard/ChatModal";

const Dashboard = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const { objects, currentObjects, transcript, requestId, status, isAnalyzing, speechStatus, lastError, lastCaptureHash, videoRef, connect, disconnect, captureAndAnalyze, speakTranscript } = useNarrator(isLive, { autoSpeak: ttsEnabled });
  const { speak, isSupported: isSpeechSupported } = useSpeech();
  const [chatOpen, setChatOpen] = useState(false);
  const [pendingChatHash, setPendingChatHash] = useState<string | null>(null);
  const [announcedChatHash, setAnnouncedChatHash] = useState<string | null>(null);

  const apiBase = ((import.meta as any).env?.VITE_BACKEND_URL as string | undefined)?.trim()?.replace(/\/$/, "") || "http://localhost:8000";

  const handleStart = async () => {
    setHasStarted(true);
    await connect();
    setIsLive(true);
  };

  const handleToggleLive = async () => {
    if (isLive) {
      disconnect();
      setIsLive(false);
    } else {
      await connect();
      setIsLive(true);
    }
  };

  useEffect(() => {
    if (!hasStarted) return;
    if (!lastCaptureHash) return;
    setPendingChatHash(lastCaptureHash);
  }, [hasStarted, lastCaptureHash]);

  useEffect(() => {
    if (!hasStarted) return;
    if (!pendingChatHash) return;
    if (isAnalyzing) return;
    if (!requestId) return;
    if (!transcript.trim()) return;

    const shouldWaitForSpeech = ttsEnabled && isSpeechSupported && speechStatus === "speaking";
    if (shouldWaitForSpeech) return;

    setChatOpen(true);
    if (ttsEnabled && isSpeechSupported && announcedChatHash !== pendingChatHash) {
      speak("Chat feature has been enabled, start by asking questions and our chat will answer.");
      setAnnouncedChatHash(pendingChatHash);
    }
    setPendingChatHash(null);
  }, [announcedChatHash, hasStarted, isAnalyzing, isSpeechSupported, pendingChatHash, requestId, speechStatus, speak, transcript, ttsEnabled]);

  if (!hasStarted) {
    return <LandingView onStart={handleStart} />;
  }

  return (
    <div className="min-h-svh app-surface text-foreground p-4 md:p-8 selection:bg-primary selection:text-primary-foreground">
      <ChatModal open={chatOpen} onOpenChange={setChatOpen} apiBase={apiBase} requestId={requestId} />
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-wrap justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-brutal-sm">
            <Activity className="text-primary-foreground w-5 h-5" aria-hidden="true" />
          </div>
          <h1 className="font-display text-xl md:text-2xl font-extrabold tracking-tighter">
            AI NARRATOR
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <button
            onClick={handleToggleLive}
            className={`p-3 border-thick rounded-xl transition-colors ${
              isLive
                ? "bg-destructive/20 border-destructive/40 hover:bg-destructive/30"
                : "bg-card border-border hover:border-primary"
            }`}
            aria-label={isLive ? "Stop camera feed" : "Start camera feed"}
          >
            <Power className="w-5 h-5" />
          </button>
          <button
            onClick={() => setChatOpen(true)}
            className="p-3 bg-card border-thick border-border rounded-xl hover:border-primary transition-colors"
            aria-label="Open chat"
          >
            <MessageSquare className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            className="p-3 bg-card border-thick border-border rounded-xl hover:border-primary transition-colors"
            aria-label="Open settings"
          >
            <Settings className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Camera + Transcript */}
        <section className="lg:col-span-8 space-y-6">
          <CameraFeed
            isLive={isLive}
            objects={currentObjects}
            onStartFeed={handleToggleLive}
            onCapture={() => captureAndAnalyze()}
            isAnalyzing={isAnalyzing}
            videoRef={videoRef}
          />
          <TranscriptPanel
            transcript={lastError ? `Error: ${lastError}` : transcript}
            onSpeak={() => speakTranscript()}
            isSpeaking={speechStatus === "speaking"}
          />
        </section>

        {/* Right: Sidebar panels */}
        <aside className="lg:col-span-4 space-y-6">
          <DetectedObjectsList objects={objects} />
          <SettingsPanel ttsEnabled={ttsEnabled} onTtsEnabledChange={setTtsEnabled} />
        </aside>
      </main>
    </div>
  );
};

export default Dashboard;
