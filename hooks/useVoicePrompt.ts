"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useVoicePrompt() {
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem("voice_muted");
    if (stored === "true") {
      setIsMuted(true);
      isMutedRef.current = true;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Pre-load voices
      window.speechSynthesis.getVoices();
      // Handle async loading of voices on some browsers
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      localStorage.setItem("voice_muted", String(next));
      if (next && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  }, []);

  const speak = useCallback((text: string) => {
    if (isMutedRef.current) return;
    
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Try to resume if it's in a stuck state
      if (window.speechSynthesis.paused) {
         window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        
        const enVoice =
          voices.find(
            (v) =>
              v.lang.startsWith("en") &&
              (v.name.toLowerCase().includes("female") ||
                v.name.toLowerCase().includes("woman"))
          ) || voices.find((v) => v.lang.startsWith("en"));
          
        if (enVoice) {
          utterance.voice = enVoice;
        }
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        
        window.speechSynthesis.speak(utterance);
      }
    },
    [isMuted]
  );

  return { speak, isMuted, toggleMute };
}
