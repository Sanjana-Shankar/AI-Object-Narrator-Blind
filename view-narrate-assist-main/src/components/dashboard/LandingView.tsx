import { motion } from "framer-motion";
import { Camera, Zap, Eye, Shield } from "lucide-react";

interface LandingViewProps {
  onStart: () => void;
}

const features = [
  { icon: Eye, title: "Real-Time Detection", desc: "Objects identified instantly from your camera feed" },
  { icon: Zap, title: "Low Latency", desc: "Under 50ms inference for immediate spoken feedback" },
  { icon: Shield, title: "Fully Accessible", desc: "High-contrast, screen-reader optimized interface" },
];

const LandingView = ({ onStart }: LandingViewProps) => {
  return (
    <div className="min-h-svh bg-background flex items-center justify-center p-6">
      <div className="max-w-2xl text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-primary rounded-full shadow-brutal"
        >
          <Camera className="w-12 h-12 text-primary-foreground" aria-hidden="true" />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="font-display text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 leading-[0.9]"
        >
          SEE THE WORLD
          <br />
          <span className="text-primary">THROUGH AI</span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-lg md:text-xl text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed"
        >
          Real-time object narration for the visually impaired. High-contrast, low-latency, and fully accessible.
        </motion.p>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          onClick={onStart}
          className="group relative px-10 py-5 bg-foreground text-background font-display font-extrabold text-xl md:text-2xl rounded-2xl shadow-brutal hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
          aria-label="Enable camera to start object narration"
        >
          ENABLE CAMERA
          <div className="absolute -inset-2 border-thick border-primary rounded-[1.25rem] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
        </motion.button>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-card border-thick border-border rounded-2xl p-6 text-left shadow-brutal-sm"
            >
              <f.icon className="w-8 h-8 text-primary mb-3" aria-hidden="true" />
              <h3 className="font-display font-bold text-base mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-snug">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default LandingView;
