import { useState, useEffect, useCallback } from 'react';

export interface DetectedObject {
  id: string;
  label: string;
  confidence: number;
  box: [number, number, number, number];
  timestamp: number;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

const MOCK_OBJECTS = [
  { label: "Coffee Mug", descriptions: ["a ceramic coffee mug on the desk", "a white coffee mug near the keyboard"] },
  { label: "MacBook Pro", descriptions: ["a laptop computer, appears to be a MacBook Pro", "an open laptop with the screen on"] },
  { label: "House Plant", descriptions: ["a small green potted plant", "a succulent in a terracotta pot"] },
  { label: "Glasses", descriptions: ["a pair of reading glasses on the table", "eyeglasses resting on a notebook"] },
  { label: "Smartphone", descriptions: ["a smartphone lying face-up", "a mobile phone next to the mug"] },
  { label: "Water Bottle", descriptions: ["a stainless steel water bottle", "a reusable water bottle, half full"] },
  { label: "Notebook", descriptions: ["a spiral-bound notebook, open", "a black notebook with handwritten notes"] },
  { label: "Pen", descriptions: ["a ballpoint pen next to the notebook", "a blue pen on the desk"] },
  { label: "Headphones", descriptions: ["over-ear headphones on the desk", "wireless headphones, charging"] },
  { label: "Keys", descriptions: ["a set of keys with a keychain", "car keys on the edge of the desk"] },
];

export const useNarrator = (isActive: boolean) => {
  const [objects, setObjects] = useState<DetectedObject[]>([]);
  const [transcript, setTranscript] = useState<string>("");
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isLoading, setIsLoading] = useState(false);

  const connect = useCallback(() => {
    if (status === 'connected') return;
    setStatus('connecting');
    setIsLoading(true);

    // Simulate connection delay
    setTimeout(() => {
      setStatus('connected');
      setIsLoading(false);
    }, 1500);
  }, [status]);

  const disconnect = useCallback(() => {
    setStatus('disconnected');
    setObjects([]);
    setTranscript("");
  }, []);

  useEffect(() => {
    if (!isActive || status !== 'connected') return;

    const interval = setInterval(() => {
      const mock = MOCK_OBJECTS[Math.floor(Math.random() * MOCK_OBJECTS.length)];
      const description = mock.descriptions[Math.floor(Math.random() * mock.descriptions.length)];

      const newObject: DetectedObject = {
        id: crypto.randomUUID(),
        label: mock.label,
        confidence: 0.82 + Math.random() * 0.17,
        box: [
          10 + Math.random() * 40,
          10 + Math.random() * 30,
          20 + Math.random() * 15,
          20 + Math.random() * 15,
        ],
        timestamp: Date.now(),
      };

      setObjects(prev => [newObject, ...prev].slice(0, 8));
      setTranscript(`I see ${description}.`);
    }, 2500);

    return () => clearInterval(interval);
  }, [isActive, status]);

  return { objects, transcript, status, isLoading, connect, disconnect };
};
