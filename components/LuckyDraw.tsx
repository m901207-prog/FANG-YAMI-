
import React, { useState, useEffect, useRef } from 'react';
import { Participant } from '../types';

declare var confetti: any;

interface LuckyDrawProps {
  names: Participant[];
  setNames: (names: Participant[]) => void;
  onBackToHome?: () => void;
}

const TENSE_MUSIC_URL = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'; 
const WIN_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3'; 
const DING_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'; 

const LuckyDraw: React.FC<LuckyDrawProps> = ({ names, setNames, onBackToHome }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [allowRepeat, setAllowRepeat] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [speechRate, setSpeechRate] = useState(1.0); // 基準語速 1.0x

  const volumeRef = useRef(0.7);
  const speechRateRef = useRef(1.0);
  const isMutedRef = useRef(false);
  
  const timerRef = useRef<number | null>(null);
  const visualTimerRef = useRef<number | null>(null);
  const audioTenseRef = useRef<HTMLAudioElement | null>(null);
  const audioWinRef = useRef<HTMLAudioElement | null>(null);
  const audioDingRef = useRef<HTMLAudioElement | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    audioTenseRef.current = new Audio(TENSE_MUSIC_URL);
    audioTenseRef.current.loop = true;
    audioWinRef.current = new Audio(WIN_SOUND_URL);
    audioDingRef.current = new Audio(DING_SOUND_URL);
    
    audioTenseRef.current.load();
    audioWinRef.current.load();
    audioDingRef.current.load();
    
    return () => {
      stopAllTimers();
      audioTenseRef.current?.pause();
      audioWinRef.current?.pause();
      audioDingRef.current?.pause();
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    volumeRef.current = volume;
    isMutedRef.current = isMuted;
    if (audioTenseRef.current) {
      audioTenseRef.current.muted = isMuted;
      audioTenseRef.current.volume = volume * 0.4;
    }
    if (audioWinRef.current) {
      audioWinRef.current.muted = isMuted;
      audioWinRef.current.volume = volume * 0.9;
    }
    if (audioDingRef.current) {
      audioDingRef.current.muted = isMuted;
      audioDingRef.current.volume = volume * 0.7;
    }
  }, [isMuted, volume]);

  useEffect(() => {
    speechRateRef.current = speechRate;
  }, [speechRate]);

  const stopAllTimers = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (visualTimerRef.current) window.clearTimeout(visualTimerRef.current);
  };

  const playDing = () => {
    if (isMutedRef.current || !audioDingRef.current) return;
    audioDingRef.current.currentTime = 0;
    audioDingRef.current.play().catch(() => {});
  };

  const speak = (text: string, rateMultiplier: number = 1) => {
    if (isMutedRef.current) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // 語音速度隨滑桿與階段調整
    utterance.rate = speechRateRef.current * rateMultiplier;
    utterance.pitch = 1.2 + (rateMultiplier * 0.2); 
    utterance.volume = volumeRef.current;
    window.speechSynthesis.speak(utterance);
  };

  const startDraw = () => {
    if (names.length === 0) return;
    if (isSpinning) return;

    setIsSpinning(true);
    setCurrentWinner(null);
    setCountdown(null);
    stopAllTimers();

    if (audioTenseRef.current) {
      audioTenseRef.current.currentTime = 0;
      audioTenseRef.current.play().catch(() => {});
    }

    // 視覺滾動邏輯：名字不斷變換
    const startVisualSpin = (interval: number) => {
      const spin = () => {
        setDisplayIndex(Math.floor(Math.random() * names.length));
        visualTimerRef.current = window.setTimeout(spin, interval);
      };
      spin();
    };

    // 第一階段：快速隨機滾動 (持續約 1.5 秒)
    startVisualSpin(50);

    // 定義倒數序列：[數字, 基準間隔(秒), 語速倍率]
    const sequence: [number, number, number][] = [
      [5, 1.0, 1.0],   // 第一段：1.0s
      [4, 1.0, 1.0],   // 第一段：1.0s
      [3, 0.75, 1.3],  // 第二段：0.75s
      [2, 0.75, 1.3],  // 第二段：0.75s
      [1, 0.5, 1.8]    // 第三段：0.5s
    ];

    let currentStep = 0;

    const runSequence = () => {
      if (currentStep < sequence.length) {
        const [num, baseDelay, rateMult] = sequence[currentStep];
        
        // 更新 UI 倒數數字
        setCountdown(num);
        playDing();
        speak(num.toString(), rateMult);

        // 視覺滾動隨倒數變慢
        stopAllTimers();
        const visualInterval = 50 + (currentStep * 40);
        startVisualSpin(visualInterval);

        currentStep++;
        // 根據滑桿縮放實際間隔
        const actualDelay = (baseDelay * 1000) / speechRateRef.current;
        timerRef.current = window.setTimeout(runSequence, actualDelay);
      } else {
        // 最後衝刺 0.5 秒後揭曉
        const finalDelay = (500) / speechRateRef.current;
        timerRef.current = window.setTimeout(revealWinner, finalDelay);
      }
    };

    // 1.5 秒後開始進入 sequence 倒數
    timerRef.current = window.setTimeout(runSequence, 1500);
  };

  const revealWinner = () => {
    stopAllTimers();
    if (audioTenseRef.current) audioTenseRef.current.pause();
    
    const winnerIndex = Math.floor(Math.random() * names.length);
    const winner = names[winnerIndex];
    
    setCurrentWinner(winner.name);
    setCountdown(null);
    setHistory(prev => [winner.name, ...prev]);
    setIsSpinning(false);

    if (audioWinRef.current) {
      audioWinRef.current.currentTime = 0;
      audioWinRef.current.play().catch(() => {});
    }

    triggerConfetti();

    if (!allowRepeat) {
      setNames(names.filter(n => n.id !== winner.id));
    }
  };

  const triggerConfetti = () => {
    const end = Date.now() + 3000;
    const colors = ['#4f46e5', '#818cf8', '#fbbf24', '#10b981'];
    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center">
        <h2 className="text-5xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-4 mb-10">
           <span className="text-5xl animate-bounce">🎁</span> 幸運的抽獎箱
        </h2>
        
        {/* 控制面板 */}
        <div className="flex flex-wrap items-center justify-center gap-10 bg-white/50 backdrop-blur-md p-8 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-indigo-500/5 w-fit mx-auto transition-all hover:bg-white/80">
          <div className="flex flex-col items-center gap-4">
            <div className="flex justify-between w-full min-w-[160px] px-1">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">音量控制</span>
              <span className="text-xs font-black text-indigo-600">{Math.round(volume * 100)}%</span>
            </div>
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-44 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <div className="flex justify-between w-full min-w-[160px] px-1">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">基準語速 (影響間隔)</span>
              <span className="text-xs font-black text-indigo-600">{speechRate.toFixed(1)}x</span>
            </div>
            <div className="relative w-44">
              <input type="range" min="0.5" max="4" step="0.1" value={speechRate} onChange={(e) => setSpeechRate(parseFloat(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
              <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-0.5">
                <span className="text-[9px] font-black text-slate-300">0.5s (慢)</span>
                <span className="text-[9px] font-black text-slate-300">標準 1.0</span>
                <span className="text-[9px] font-black text-slate-300">4.0 (極速)</span>
              </div>
            </div>
          </div>

          <div className="w-px h-12 bg-slate-200 hidden sm:block"></div>

          <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-2xl border-2 transition-all ${isMuted ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-indigo-600 border-indigo-700 text-white shadow-lg active:scale-90'}`}>
            {isMuted ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>}
          </button>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute -inset-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[50px] blur-3xl opacity-5"></div>
        <div className="relative glass-card p-12 rounded-[40px] shadow-2xl flex flex-col items-center border border-white/50 overflow-hidden">
          <div className={`w-full h-80 rounded-[2.5rem] mb-12 flex flex-col items-center justify-center overflow-hidden border-8 shadow-2xl relative transition-all duration-700 ${isSpinning ? 'bg-indigo-950 border-indigo-400/30' : 'bg-slate-900 border-slate-800'}`}>
            {isSpinning ? (
              <div className="flex flex-col items-center text-center px-4">
                 <div className="text-5xl md:text-7xl font-black text-white/40 italic tracking-tighter mb-4 animate-pulse">
                  {names[displayIndex]?.name}
                </div>
                {countdown !== null && (
                  <div className="text-[12rem] font-black text-indigo-400 drop-shadow-[0_0_40px_rgba(129,140,248,0.8)] leading-none animate-in zoom-in duration-300">
                    {countdown}
                  </div>
                )}
              </div>
            ) : currentWinner ? (
              <div className="text-center animate-float">
                <div className="text-indigo-400 text-xs font-black tracking-[0.5em] uppercase mb-5">CONGRATULATIONS</div>
                <div className="text-7xl md:text-9xl font-black text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.6)]">
                  {currentWinner}
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                  <svg className="w-10 h-10 text-indigo-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-sm font-black tracking-[0.3em] text-slate-400 uppercase">READY FOR DRAW</p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-8 w-full max-w-sm">
            <button
              onClick={startDraw}
              disabled={isSpinning || names.length === 0}
              className={`w-full py-7 rounded-[2rem] text-2xl font-black transition-all transform active:scale-95 shadow-2xl relative overflow-hidden ${isSpinning || names.length === 0 ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:bg-indigo-700 hover:-translate-y-1'}`}
            >
              {isSpinning ? '緊張抽籤中...' : '啟動抽籤'}
            </button>

            <label className="flex items-center gap-4 cursor-pointer select-none group">
              <div className="relative">
                <input type="checkbox" checked={allowRepeat} onChange={(e) => setAllowRepeat(e.target.checked)} className="peer sr-only" />
                <div className="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-indigo-600 transition-colors"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
              </div>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-600">允許重複中獎</span>
            </label>
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="glass-card p-10 rounded-[2.5rem] border border-slate-100 shadow-xl">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-50">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
              幸運光榮榜 ({history.length})
            </h3>
            <button onClick={() => setHistory([])} className="text-[10px] font-black text-slate-300 hover:text-rose-500 uppercase tracking-widest">清空</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {history.map((name, idx) => (
              <div key={idx} className={`p-4 rounded-xl text-center font-black transition-all ${idx === 0 ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white text-slate-700 border border-slate-100'}`}>
                {name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LuckyDraw;
