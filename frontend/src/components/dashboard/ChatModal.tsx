import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Mic, MicOff, Send } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/hooks/useSpeech";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

type ChatRole = "user" | "assistant";
type ChatItem = { role: ChatRole; content: string };

export function ChatModal(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiBase: string;
  requestId: string | null;
  defaultVoice?: boolean;
}) {
  const { open, onOpenChange, apiBase, requestId, defaultVoice = true } = props;

  const [items, setItems] = useState<ChatItem[]>([]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastHandledResultRef = useRef<string | null>(null);

  const { speak, status: speechStatus } = useSpeech();
  const recog = useSpeechRecognition();

  const canChat = !!requestId;

  const send = useCallback(async (message: string) => {
    const msg = (message || "").trim();
    if (!msg || !requestId) return;

    setIsSending(true);
    setError(null);
    const nextUserItem: ChatItem = { role: "user", content: msg };
    setItems((prev) => [...prev, nextUserItem]);
    setText("");

    try {
      const history = [...items, nextUserItem].slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, message: msg, history }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Chat failed (${res.status})`);
      }
      const data = await res.json();
      const answer = typeof data?.answer === "string" ? data.answer : "";
      if (!answer) throw new Error("Empty answer");
      setItems((prev) => [...prev, { role: "assistant", content: answer }]);
      speak(answer);
    } catch (e: any) {
      setError(e?.message ?? "Chat failed");
    } finally {
      setIsSending(false);
    }
  }, [apiBase, items, requestId, speak]);

  useEffect(() => {
    if (!open) return;
    if (!defaultVoice) return;
    if (!recog.isSupported) return;
    if (recog.isListening) return;
    if (!canChat) return;
    recog.start();
  }, [canChat, defaultVoice, open, recog]);

  useEffect(() => {
    if (!open) return;
    const r = (recog.lastResult || "").trim();
    if (!r) return;
    if (lastHandledResultRef.current === r) return;
    lastHandledResultRef.current = r;
    void send(r);
  }, [open, recog.lastResult, send]);

  useEffect(() => {
    if (!open) return;
    setItems([]);
    setError(null);
    setText("");
    lastHandledResultRef.current = null;
  }, [open, requestId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" aria-hidden="true" />
            Scene Chat
          </DialogTitle>
          <DialogDescription>
            Ask follow-up questions about what was detected in your most recent capture.
          </DialogDescription>
        </DialogHeader>

        {!canChat ? (
          <div className="bg-muted border border-border rounded-xl p-4 text-sm">
            Capture and analyze an image first to enable chat.
          </div>
        ) : (
          <ScrollArea className="h-[320px] rounded-xl border border-border bg-card">
            <div className="p-4 space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Try: "What is closest to me?" or "Is there anything to my right I should avoid?"
                </p>
              ) : (
                items.map((m, idx) => (
                  <div
                    key={idx}
                    className={
                      m.role === "user"
                        ? "ml-auto max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-4 py-3 shadow-brutal-sm"
                        : "mr-auto max-w-[85%] rounded-2xl bg-secondary text-secondary-foreground px-4 py-3 shadow-brutal-sm"
                    }
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        <div className="space-y-2">
          {error ? <div className="text-sm text-destructive">{error}</div> : null}
          {recog.lastError ? (
            <div className="text-xs text-muted-foreground">
              Voice input error: {recog.lastError}. You can still type your question.
            </div>
          ) : null}
        </div>

        <div className="grid gap-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a question (caretaker mode), or use voice by default."
            className="min-h-[92px] text-base"
            aria-label="Chat question input"
            disabled={!canChat || isSending}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => (recog.isListening ? recog.stop() : recog.start())}
                disabled={!recog.isSupported || !canChat}
                aria-label={recog.isListening ? "Stop listening" : "Start listening"}
              >
                {recog.isListening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                {recog.isListening ? "Stop Voice" : "Voice"}
              </Button>
              <div className="text-xs text-muted-foreground">
                {speechStatus === "speaking" ? "Speaking…" : null}
              </div>
            </div>
            <Button
              type="button"
              onClick={() => void send(text)}
              disabled={!canChat || isSending || !text.trim()}
              aria-label="Send chat message"
            >
              <Send className="w-4 h-4 mr-2" aria-hidden="true" />
              Ask
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

