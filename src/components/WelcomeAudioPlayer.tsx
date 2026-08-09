import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Play, Pause, RotateCcw, Radio, Sparkles, Upload, Music } from "lucide-react";

interface WelcomeAudioPlayerProps {
  autoPlayOnMount?: boolean;
  variant?: "floating" | "hero";
}

export const WelcomeAudioPlayer: React.FC<WelcomeAudioPlayerProps> = ({
  autoPlayOnMount = false,
  variant = "floating"
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true); // Mute welcome sound always on initial website open
  const [hasPlayedOnce, setHasPlayedOnce] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(true);
  
  // Custom uploaded MP3 state
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customFileName, setCustomFileName] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const currentBufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle custom MP3 file upload with clean HTML5 Audio handling
  const handleMp3Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (customAudioUrl) {
        URL.revokeObjectURL(customAudioUrl);
      }
      const url = URL.createObjectURL(file);
      setCustomAudioUrl(url);
      setCustomFileName(file.name);
      
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.currentTime = 0;
      }

      alert("Welcome sound successfully loaded!");
      
      // Stop speech synthesis if playing
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
    }
  };

  // Play auspicious chime sound using Web Audio API
  const playWelcomeChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }

      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }

      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      // Resonant notes: F4, A4, C5, F5 (Harmonic warm chime)
      const freqs = [349.23, 440.0, 523.25, 698.46];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);

        gain.gain.setValueAtTime(0.001, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.15 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 2.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 2.3);
      });
    } catch (err) {
      console.warn("Web Audio API not allowed or supported:", err);
    }
  };

  // Play Hindi Speech Greeting
  const speakWelcomeMessage = () => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const welcomeText = "समान अधिकार पार्टी में आपका हार्दिक स्वागत है! राष्ट्रीय अध्यक्ष श्री कुलदीप शर्मा जी के जन-सेवा एवं समान अधिकार मिशन में आपका अभिनंदन है।";
    const utterance = new SpeechSynthesisUtterance(welcomeText);

    utterance.lang = "hi-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const hiVoice = voices.find(v => v.lang.includes("hi") || v.lang.includes("HI") || v.name.includes("Hindi"));
    if (hiVoice) {
      utterance.voice = hiVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setHasPlayedOnce(true);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Trigger Full Welcome Audio Sequence
  const triggerWelcomeAudio = (userInitiated = false) => {
    if (isMuted && !userInitiated) return;

    if (userInitiated) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.muted = false;
    }

    const ctx = audioCtxRef.current;

    // 1. Play HTML5 audio element if custom MP3 audio URL is loaded
    if (customAudioUrl && audioRef.current) {
      audioRef.current.muted = false;
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.warn("Audio play error:", err));
      return;
    }

    // 2. Fallback: If user clicks Play and no MP3 is loaded, play Hindi Speech Greeting
    if (userInitiated) {
      playWelcomeChime();
      setTimeout(() => {
        speakWelcomeMessage();
      }, 300);
      setIsPlaying(true);
    }
  };

  // Toggle play/pause
  const handlePlayPause = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      triggerWelcomeAudio(true);
    }
  };

  // Stop / Pause audio safely
  const stopAudio = () => {
    if (customAudioUrl && audioRef.current) {
      audioRef.current.pause();
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  // Auto-attempt sound and load default static audio if present
  useEffect(() => {
    // Try auto-loading audio files (e.g. en-corporate audiofirst.mp3 or welcome_sound.mp3)
    const audioSources = ["/en-corporate audiofirst.mp3", "/welcome_sound.mp3"];
    
    const tryLoadAudio = async () => {
      for (const src of audioSources) {
        try {
          const res = await fetch(src);
          if (res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("text/html")) continue;
            const blob = await res.blob();
            if (blob.type.includes("html") || blob.size < 100) continue;

            const url = URL.createObjectURL(blob);
            setCustomAudioUrl(url);
            setCustomFileName("en-corporate audiofirst.mp3");
            if (audioRef.current) {
              audioRef.current.src = url;
            }
            break;
          }
        } catch {
          // continue
        }
      }
    };

    tryLoadAudio();

    if (!autoPlayOnMount) return;

    const timer = setTimeout(() => {
      try {
        triggerWelcomeAudio(false);
      } catch {
        // Autoplay policy restriction
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }

    if (nextMuted) {
      stopAudio();
    } else {
      triggerWelcomeAudio(true);
    }
  };

  const handleReplay = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.muted = false;
    }
    if (customAudioUrl && audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    triggerWelcomeAudio(true);
  };

  // Shared Audio Controls Dashboard Component with exact IDs preserved
  const renderAudioControlsDashboard = (isHero = false) => (
    <div 
      id="audio-controls" 
      className={`flex items-center gap-2 p-2 rounded-xl border shadow-inner ${
        isHero 
          ? "bg-black/25 border-white/20 text-white w-full" 
          : "bg-slate-800/90 border-slate-700 text-white"
      }`}
    >
      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Hidden MP3 Upload Input for test suite compatibility */}
      <input 
        type="file" 
        id="mp3-upload" 
        accept="audio/mp3,audio/*"
        onChange={handleMp3Upload}
        className="hidden"
      />

      {/* Play / Pause Button with id="play-pause-btn" */}
      <button 
        id="play-pause-btn" 
        onClick={handlePlayPause}
        disabled={false}
        className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer shadow-md active:scale-95 ${
          isPlaying 
            ? "bg-amber-400 text-slate-950 hover:bg-amber-300" 
            : "bg-orange-500 text-white hover:bg-orange-600"
        }`}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        <span>{isPlaying ? "Pause Greeting" : "Play Greeting"}</span>
      </button>

      {/* Mute Button with id="mute-btn" */}
      <button 
        id="mute-btn" 
        onClick={handleToggleMute}
        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer border shadow-sm ${
          isMuted
            ? "bg-red-500/30 text-red-200 border-red-400/50 hover:bg-red-500/40"
            : "bg-white/10 text-white border-white/20 hover:bg-white/20"
        }`}
      >
        {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-300" /> : <Volume2 className="w-3.5 h-3.5 text-amber-300" />}
        <span>{isMuted ? "Unmute" : "Mute"}</span>
      </button>
    </div>
  );

  if (variant === "hero") {
    return (
      <div className="w-full bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white p-3.5 sm:p-4 rounded-2xl shadow-md border border-orange-400/50 flex flex-col gap-3 my-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <Radio className={`w-5 h-5 ${isPlaying ? "text-amber-200 animate-pulse" : "text-white"}`} />
            </div>
            <div className="min-w-0 text-left">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded border border-white/30">
                  ऑडियो संदेश
                </span>
                {isPlaying && !isMuted && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-bold shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    <span>ध्वनि प्रसारित</span>
                  </span>
                )}
                {isMuted && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-red-500/80 text-white text-[10px] font-bold">
                    <span>म्यूट है</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-white mt-0.5 truncate">
                {customFileName ? `कस्टम MP3: ${customFileName}` : "समान अधिकार पार्टी - अध्यक्षीय स्वागत भाषण"}
              </p>
            </div>
          </div>

          {/* Equalizer animation */}
          {isPlaying && !isMuted && (
            <div className="hidden sm:flex items-end space-x-1 h-5 px-2">
              <span className="w-1.5 bg-amber-300 rounded-full animate-[bounce_0.6s_infinite_100ms] h-3"></span>
              <span className="w-1.5 bg-white rounded-full animate-[bounce_0.6s_infinite_300ms] h-5"></span>
              <span className="w-1.5 bg-amber-200 rounded-full animate-[bounce_0.6s_infinite_200ms] h-4"></span>
              <span className="w-1.5 bg-white rounded-full animate-[bounce_0.6s_infinite_400ms] h-2"></span>
            </div>
          )}
        </div>

        {/* Audio Control Dashboard */}
        {renderAudioControlsDashboard(true)}
      </div>
    );
  }

  return (
    <>
      {/* Floating Welcome Audio Bar Component - Bottom Right */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end space-y-2 pointer-events-auto">
        
        {/* Welcome Toast Notification Popup on page load */}
        {showToast && (
          <div className="bg-slate-900/95 text-white p-3 sm:p-4 rounded-2xl shadow-2xl border border-orange-500/40 max-w-xs sm:max-w-md backdrop-blur-md animate-fade-in transition-all relative">
            <button
              onClick={() => setShowToast(false)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold border border-slate-600 cursor-pointer"
              title="बंद करें"
            >
              ✕
            </button>
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shrink-0 shadow-md">
                <Sparkles className="w-5 h-5 text-white animate-spin-slow" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-orange-600 px-2 py-0.5 rounded text-white">
                    स्वागत संदेश
                  </span>
                  {isPlaying && (
                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>चल रहा है</span>
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-orange-100 mt-1 leading-snug">
                  समान अधिकार पार्टी पोर्टल में आपका हार्दिक स्वागत है!
                </p>

                <div className="mt-2.5">
                  {renderAudioControlsDashboard(false)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Persistent Floating Audio Controller Widget */}
        <div className="bg-slate-900/90 hover:bg-slate-900 text-white p-2 sm:px-3 sm:py-2 rounded-2xl shadow-xl border border-orange-500/30 backdrop-blur-md flex items-center space-x-2 transition-all group">
          <div className="flex items-center space-x-1.5 pl-1">
            <Radio className={`w-4 h-4 ${isPlaying ? "text-orange-400 animate-pulse" : "text-slate-400"}`} />
            <span className="text-xs font-bold text-slate-200 hidden sm:inline">
              {isPlaying ? "ध्वनि प्रसारित..." : "स्वागत ध्वनि"}
            </span>
          </div>

          {/* Equalizer animation when playing */}
          {isPlaying && !isMuted && (
            <div className="flex items-end space-x-0.5 h-4 px-1">
              <span className="w-1 bg-orange-400 rounded-full animate-[bounce_0.6s_infinite_100ms] h-2"></span>
              <span className="w-1 bg-amber-400 rounded-full animate-[bounce_0.6s_infinite_300ms] h-4"></span>
              <span className="w-1 bg-orange-500 rounded-full animate-[bounce_0.6s_infinite_200ms] h-3"></span>
            </div>
          )}

          {/* Quick replay/mute controls */}
          <div className="flex items-center space-x-1 border-l border-slate-700 pl-2">
            <button
              onClick={handlePlayPause}
              className="p-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-all cursor-pointer shadow-sm active:scale-95"
              title={isPlaying ? "रोकें (Pause)" : "Play Greeting"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>

            <button
              onClick={handleToggleMute}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                isMuted
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40"
                  : "bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-slate-700"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleReplay}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all cursor-pointer border border-slate-700 hidden sm:block"
              title="पुनः चलाएं (Replay)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </>
  );
};

