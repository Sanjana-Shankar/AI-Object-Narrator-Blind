import { useState } from "react";
import { Activity, Settings, Power } from "lucide-react";
import { useNarrator } from "@/hooks/useNarrator";
import CameraFeed from "@/components/dashboard/CameraFeed";
import TranscriptPanel from "@/components/dashboard/TranscriptPanel";
import DetectedObjectsList from "@/components/dashboard/DetectedObjectsList";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import StatusBadge from "@/components/dashboard/StatusBadge";
import LandingView from "@/components/dashboard/LandingView";

const Dashboard = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const { objects, currentObjects, transcript, status, isAnalyzing, speechStatus, lastError, videoRef, connect, disconnect, captureAndAnalyze, speakTranscript } = useNarrator(isLive, { autoSpeak: ttsEnabled });

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

  if (!hasStarted) {
    return <LandingView onStart={handleStart} />;
  }

  return (
    <div className="min-h-svh app-surface text-foreground p-4 md:p-8 selection:bg-primary selection:text-primary-foreground">
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
