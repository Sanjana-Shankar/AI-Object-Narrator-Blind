import { motion, AnimatePresence } from "framer-motion";
import { Volume2 } from "lucide-react";

interface TranscriptPanelProps {
  transcript: string;
}

const TranscriptPanel = ({ transcript }: TranscriptPanelProps) => {
  return (
    <div
      className="bg-card border-thick border-border rounded-2xl p-6 min-h-[120px] flex items-start gap-4"
      role="region"
      aria-label="Voice narration transcript"
    >
      <div className="p-3 bg-accent/20 rounded-xl flex-shrink-0" aria-hidden="true">
        <Volume2 className="text-accent w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-2">
          Voice Narration
        </p>
        <div aria-live="polite" aria-atomic="true">
          <AnimatePresence mode="wait">
            <motion.p
              key={transcript || "empty"}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="text-xl md:text-2xl font-medium leading-snug"
            >
              {transcript || (
                <span className="text-muted-foreground italic">Waiting for objects…</span>
              )}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TranscriptPanel;
