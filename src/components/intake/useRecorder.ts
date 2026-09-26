"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { encodeWav, nextLevel, pickMimeType, rms } from "./media";

export type RecorderError = "denied" | "unsupported" | "failed" | null;

type Options = {
  /** Called every animation frame with a smoothed 0..1 input level (write to the DOM, not state). */
  onLevel: (level: number) => void;
  onComplete: (audio: Blob) => void;
  maxSeconds?: number;
};

type Session = {
  stream: MediaStream;
  context: AudioContext;
  recorder?: MediaRecorder;
  wavChunks?: Float32Array[];
  processor?: ScriptProcessorNode;
  frame: number;
  timeout: ReturnType<typeof setTimeout>;
  tick: ReturnType<typeof setInterval>;
};

/**
 * Records one answer: MediaRecorder with the best supported format (webm/opus, or mp4 on iOS
 * Safari), or raw PCM encoded to WAV when MediaRecorder is missing. Stops on demand or after
 * `maxSeconds`. Nothing is kept once the blob is handed to `onComplete`.
 */
export function useRecorder({ onLevel, onComplete, maxSeconds = 60 }: Options) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<RecorderError>(null);
  const [secondsLeft, setSecondsLeft] = useState(maxSeconds);
  const session = useRef<Session | null>(null);
  const callbacks = useRef({ onLevel, onComplete });

  useEffect(() => {
    callbacks.current = { onLevel, onComplete };
  }, [onLevel, onComplete]);

  const teardown = useCallback(() => {
    const s = session.current;
    if (!s) return;
    session.current = null;
    cancelAnimationFrame(s.frame);
    clearTimeout(s.timeout);
    clearInterval(s.tick);
    s.processor?.disconnect();
    s.stream.getTracks().forEach((track) => track.stop());
    void s.context.close().catch(() => {});
    callbacks.current.onLevel(0);
    setListening(false);
  }, []);

  const stop = useCallback(() => {
    const s = session.current;
    if (!s) return;
    if (s.recorder && s.recorder.state !== "inactive") {
      s.recorder.stop(); // onstop hands over the blob, then tears down
      return;
    }
    if (s.wavChunks) {
      const blob = encodeWav(s.wavChunks, s.context.sampleRate);
      teardown();
      callbacks.current.onComplete(blob);
    }
  }, [teardown]);

  const start = useCallback(async () => {
    if (session.current) return;
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("unsupported");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      setError(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "failed");
      return;
    }

    try {
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const samples = new Float32Array(analyser.fftSize);

      let level = 0;
      const loop = () => {
        analyser.getFloatTimeDomainData(samples);
        level = nextLevel(level, rms(samples));
        callbacks.current.onLevel(level);
        if (session.current) session.current.frame = requestAnimationFrame(loop);
      };

      const s: Session = {
        stream,
        context,
        frame: 0,
        timeout: setTimeout(() => stop(), maxSeconds * 1000),
        tick: setInterval(() => setSecondsLeft((n) => Math.max(0, n - 1)), 1000),
      };

      const mime = pickMimeType(
        typeof MediaRecorder === "undefined" ? undefined : (t) => MediaRecorder.isTypeSupported(t),
      );
      if (typeof MediaRecorder !== "undefined") {
        const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: recorder.mimeType || mime || "audio/webm" });
          teardown();
          callbacks.current.onComplete(blob);
        };
        recorder.start();
        s.recorder = recorder;
      } else {
        // No MediaRecorder: capture PCM and encode WAV ourselves.
        const processor = context.createScriptProcessor(4096, 1, 1);
        const wavChunks: Float32Array[] = [];
        processor.onaudioprocess = (e) => wavChunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
        source.connect(processor);
        processor.connect(context.destination);
        s.processor = processor;
        s.wavChunks = wavChunks;
      }

      session.current = s;
      setSecondsLeft(maxSeconds);
      setListening(true);
      s.frame = requestAnimationFrame(loop);
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      setError("failed");
    }
  }, [maxSeconds, stop, teardown]);

  // Leaving the page mid-recording releases the microphone.
  useEffect(() => teardown, [teardown]);

  return { listening, error, secondsLeft, start, stop };
}
