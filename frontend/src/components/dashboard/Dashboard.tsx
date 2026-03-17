import { useMemo, useState } from "react";
import { Activity, Settings, Power, ScanEye, Sliders, Sparkles } from "lucide-react";
import { useNarrator } from "@/hooks/useNarrator";
import CameraFeed from "@/components/dashboard/CameraFeed";
import TranscriptPanel from "@/components/dashboard/TranscriptPanel";
import DetectedObjectsList from "@/components/dashboard/DetectedObjectsList";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import StatusBadge from "@/components/dashboard/StatusBadge";
import LandingView from "@/components/dashboard/LandingView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [userGoal, setUserGoal] = useState("");
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

  const avgConfidence = useMemo(() => {
    if (!currentObjects.length) return null;
    const total = currentObjects.reduce((sum, o) => sum + o.confidence, 0);
    return total / currentObjects.length;
  }, [currentObjects]);

  const confidenceTone = avgConfidence === null
    ? "bg-muted text-muted-foreground border-border"
    : avgConfidence >= 0.6
      ? "bg-success/15 text-success border-success/30"
      : avgConfidence >= 0.4
        ? "bg-accent/15 text-accent-foreground border-accent/30"
        : "bg-destructive/10 text-destructive border-destructive/30";

  const confidenceLabel = avgConfidence === null
    ? "No detections yet"
    : avgConfidence >= 0.6
      ? "High confidence"
      : avgConfidence >= 0.4
        ? "Medium confidence"
        : "Low confidence";

  const quickGoals = ["Find the door", "Locate my keys", "Identify obstacles"];

  if (!hasStarted) {
    return <LandingView onStart={handleStart} />;
  }

  return (
    <div className="min-h-svh app-surface text-foreground p-4 md:p-8 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-wrap justify-between items-center mb-6 md:mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-brutal-sm">
            <Activity className="text-primary-foreground w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold">
              Object Narrator
            </p>
            <h1 className="font-display text-xl md:text-2xl font-extrabold tracking-tighter">
              AI NARRATOR
            </h1>
          </div>
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
      <main className="max-w-7xl mx-auto">
        {/* Mobile layout */}
        <div className="lg:hidden">
          <Tabs defaultValue="live">
            <TabsList className="grid grid-cols-3 w-full h-12 rounded-2xl p-1 bg-card border-thick border-border shadow-brutal-sm">
              <TabsTrigger value="live" className="gap-2 text-xs font-bold uppercase tracking-widest">
                <ScanEye className="w-4 h-4" aria-hidden="true" />
                Live
              </TabsTrigger>
              <TabsTrigger value="detections" className="gap-2 text-xs font-bold uppercase tracking-widest">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                Detections
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2 text-xs font-bold uppercase tracking-widest">
                <Sliders className="w-4 h-4" aria-hidden="true" />
                Settings
              </TabsTrigger>
            </TabsList>
            <TabsContent value="live" className="mt-4 space-y-4">
              <CameraFeed
                isLive={isLive}
                objects={currentObjects}
                onStartFeed={handleToggleLive}
                onCapture={() => captureAndAnalyze(userGoal)}
                isAnalyzing={isAnalyzing}
                videoRef={videoRef}
              />
              <TranscriptPanel
                transcript={lastError ? `Error: ${lastError}` : transcript}
                onSpeak={() => speakTranscript()}
                isSpeaking={speechStatus === "speaking"}
              />
              <section className="bg-card border-thick border-border rounded-2xl p-4 space-y-3" aria-label="Guided capture">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">
                    Capture Goal
                  </p>
                  <span className={`text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${confidenceTone}`}>
                    {confidenceLabel}
                  </span>
                </div>
                <input
                  value={userGoal}
                  onChange={(e) => setUserGoal(e.target.value)}
                  placeholder="Example: Find the exit"
                  className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Goal for the next capture"
                />
                <div className="flex flex-wrap gap-2">
                  {quickGoals.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setUserGoal(goal)}
                      className="px-3 py-2 text-xs font-bold uppercase tracking-wide border border-border rounded-full bg-muted/40 hover:bg-muted"
                    >
                      {goal}
                    </button>
                  ))}
                </div>
                {avgConfidence !== null && avgConfidence < 0.4 && (
                  <p className="text-xs text-muted-foreground">
                    Tip: move closer or improve lighting for clearer detections.
                  </p>
                )}
              </section>
            </TabsContent>
            <TabsContent value="detections" className="mt-4">
              <DetectedObjectsList objects={objects} />
            </TabsContent>
            <TabsContent value="settings" className="mt-4">
              <SettingsPanel ttsEnabled={ttsEnabled} onTtsEnabledChange={setTtsEnabled} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop layout */}
        <div className="hidden lg:grid grid-cols-12 gap-6">
          <section className="lg:col-span-8 space-y-6">
            <CameraFeed
              isLive={isLive}
              objects={currentObjects}
              onStartFeed={handleToggleLive}
              onCapture={() => captureAndAnalyze(userGoal)}
              isAnalyzing={isAnalyzing}
              videoRef={videoRef}
            />
            <TranscriptPanel
              transcript={lastError ? `Error: ${lastError}` : transcript}
              onSpeak={() => speakTranscript()}
              isSpeaking={speechStatus === "speaking"}
            />
            <section className="bg-card border-thick border-border rounded-2xl p-6 space-y-3" aria-label="Guided capture">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">
                  Capture Goal
                </p>
                <span className={`text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${confidenceTone}`}>
                  {confidenceLabel}
                </span>
              </div>
              <input
                value={userGoal}
                onChange={(e) => setUserGoal(e.target.value)}
                placeholder="Example: Find the exit"
                className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Goal for the next capture"
              />
              <div className="flex flex-wrap gap-2">
                {quickGoals.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setUserGoal(goal)}
                    className="px-3 py-2 text-xs font-bold uppercase tracking-wide border border-border rounded-full bg-muted/40 hover:bg-muted"
                  >
                    {goal}
                  </button>
                ))}
              </div>
              {avgConfidence !== null && avgConfidence < 0.4 && (
                <p className="text-xs text-muted-foreground">
                  Tip: move closer or improve lighting for clearer detections.
                </p>
              )}
            </section>
          </section>

          <aside className="lg:col-span-4 space-y-6">
            <DetectedObjectsList objects={objects} />
            <SettingsPanel ttsEnabled={ttsEnabled} onTtsEnabledChange={setTtsEnabled} />
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
