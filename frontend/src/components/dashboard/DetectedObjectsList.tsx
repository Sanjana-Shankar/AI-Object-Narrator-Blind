import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { DetectedObject } from "@/hooks/useNarrator";

interface DetectedObjectsListProps {
  objects: DetectedObject[];
}

const DetectedObjectsList = ({ objects }: DetectedObjectsListProps) => {
  return (
    <div
      className="bg-card border-thick border-border rounded-2xl p-4 sm:p-6"
      role="region"
      aria-label="Recently detected objects"
    >
      <h2 className="font-display text-base font-bold mb-4 flex items-center gap-2 uppercase tracking-wide">
        <ShieldCheck className="w-5 h-5 text-primary" aria-hidden="true" />
        Recent Detections
      </h2>
      <div className="space-y-2" aria-live="polite">
        {objects.length === 0 ? (
          <p className="text-muted-foreground py-4 italic text-sm">No objects detected yet.</p>
        ) : (
          <AnimatePresence initial={false}>
            {objects.map((obj) => (
              <motion.div
                layout
                key={obj.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.25 }}
                className="flex justify-between items-center p-3.5 bg-background border border-border rounded-xl"
              >
                <span className="font-semibold text-sm">{obj.label}</span>
                <span className="text-[11px] font-mono bg-muted text-muted-foreground px-2.5 py-1 rounded-lg">
                  {(obj.confidence * 100).toFixed(0)}%
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default DetectedObjectsList;
