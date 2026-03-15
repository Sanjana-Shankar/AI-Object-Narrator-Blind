import { motion, AnimatePresence } from "framer-motion";
import { DetectedObject } from "@/hooks/useNarrator";

interface CameraFeedProps {
  isLive: boolean;
  objects: DetectedObject[];
  onStartFeed: () => void;
}

const CameraFeed = ({ isLive, objects, onStartFeed }: CameraFeedProps) => {
  return (
    <div className="relative aspect-video bg-card rounded-2xl border-thick border-border overflow-hidden">
      {/* Mock camera feed background */}
      <div className="absolute inset-0 bg-secondary flex items-center justify-center">
        {!isLive ? (
          <button
            onClick={onStartFeed}
            className="px-8 py-5 bg-primary text-primary-foreground font-display font-extrabold rounded-xl text-lg md:text-xl shadow-brutal hover:scale-[1.02] active:scale-[0.98] transition-transform"
            aria-label="Start live camera feed"
          >
            START LIVE FEED
          </button>
        ) : (
          <>
            {/* Simulated camera view */}
            <div className="absolute inset-0 bg-gradient-to-br from-secondary via-card to-muted opacity-80" />
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
            {/* FPS counter */}
            <div className="absolute top-4 right-4 z-10 bg-background/60 backdrop-blur-sm px-3 py-1 rounded-lg">
              <span className="text-xs font-mono text-muted-foreground">30 FPS</span>
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
