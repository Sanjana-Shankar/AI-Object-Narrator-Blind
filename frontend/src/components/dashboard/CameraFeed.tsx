import { motion, AnimatePresence } from "framer-motion";
import { DetectedObject } from "@/hooks/useNarrator";
import { Camera } from "lucide-react";
import type React from "react";

interface CameraFeedProps {
  isLive: boolean;
  objects: DetectedObject[];
  onStartFeed: () => void | Promise<void>;
  onCapture: () => void | Promise<void>;
  isAnalyzing: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const CameraFeed = ({ isLive, objects, onStartFeed, onCapture, isAnalyzing, videoRef }: CameraFeedProps) => {
  return (
    <div className="relative aspect-[4/5] sm:aspect-video bg-card rounded-2xl border-thick border-border overflow-hidden">
      {/* Live camera preview */}
      <div className="absolute inset-0 bg-secondary flex items-center justify-center">
        {!isLive ? (
          <button
            onClick={onStartFeed}
            className="px-7 py-4 sm:px-8 sm:py-5 bg-primary text-primary-foreground font-display font-extrabold rounded-xl text-base sm:text-lg md:text-xl shadow-brutal hover:scale-[1.02] active:scale-[0.98] transition-transform"
            aria-label="Start live camera feed"
          >
            START LIVE FEED
          </button>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              aria-label="Live camera preview"
            />
            {/* Grid overlay for camera feel */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "linear-gradient(hsl(var(--foreground) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.1) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
              aria-hidden="true"
            />
            {/* REC indicator */}
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-destructive">REC</span>
            </div>
            {/* Capture */}
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3">
              <button
                onClick={onCapture}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 px-4 py-3 sm:px-5 bg-background/80 backdrop-blur-sm border-thick border-border rounded-xl shadow-brutal-sm hover:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="Capture photo and analyze"
              >
                <Camera className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm font-bold uppercase tracking-wide">
                  {isAnalyzing ? "ANALYZING..." : "CAPTURE + ANALYZE"}
                </span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Detection bounding boxes */}
      <AnimatePresence>
        {isLive &&
          objects.slice(0, 3).map((obj) => (
            <motion.div
              key={obj.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute border-thick border-primary bg-primary/5"
              style={{
                left: `${obj.box[0]}%`,
                top: `${obj.box[1]}%`,
                width: `${obj.box[2]}%`,
                height: `${obj.box[3]}%`,
              }}
              aria-hidden="true"
            >
              <span className="absolute -top-7 left-0 bg-primary text-primary-foreground px-2 py-0.5 text-[11px] font-bold rounded whitespace-nowrap">
                {obj.label} {(obj.confidence * 100).toFixed(0)}%
              </span>
              {/* Corner markers */}
              <span className="absolute top-0 left-0 w-3 h-3 border-t-[3px] border-l-[3px] border-primary" />
              <span className="absolute top-0 right-0 w-3 h-3 border-t-[3px] border-r-[3px] border-primary" />
              <span className="absolute bottom-0 left-0 w-3 h-3 border-b-[3px] border-l-[3px] border-primary" />
              <span className="absolute bottom-0 right-0 w-3 h-3 border-b-[3px] border-r-[3px] border-primary" />
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
};

export default CameraFeed;
