
import React, { useState, useEffect, useRef } from 'react';
import { Participant, LuckyDrawRecord } from '../types.ts';

declare var confetti: any;
// ... 其餘代碼保持不變 ...
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
  const [currentWinners, setCurrentWinners] = useState<string[]>([]);
  const [currentPrizeDisplay, setCurrentPrizeDisplay] = useState('');
  const [history, setHistory] = useState<LuckyDrawRecord[]>([]);
  
  // 抽獎設定
  const [prizeName, setPrizeName] = useState('幸運金幣獎');
  const [drawCount, setDrawCount] = useState(1);
  const [allowRepeat, setAllowRepeat] = useState(false);
  
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8); 
  const [speechRate, setSpeechRate] = useState(1.0); 

  const volumeRef = useRef(0.8);
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
      audioTenseRef.current.volume = volume * 0.25; 
    }
    if (audioWinRef.current) {
      audioWinRef.current.muted = isMuted;
      audioWinRef.current.volume = volume;
    }
    if (audioDingRef.current) {
      audioDingRef.current.muted = isMuted;
      audioDingRef.current.volume = Math.min(1.0, volume * 1.2); 
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
    utterance.rate = speechRateRef.current * rateMultiplier;
    utterance.pitch = 1.4 + (rateMultiplier * 0.1); 
    utterance.volume = 1.0; 
    window.speechSynthesis.speak(utterance);
  };

  const startDraw = () => {
    if (names.length === 0) {
      alert("名單已空！");
      return;
    }
    if (drawCount > names.length) {
      alert(`剩餘人數不足以抽取 ${drawCount} 位中獎者！`);
      return;
    }
    if (isSpinning) return;

    setIsSpinning(true);
    setCurrentWinners([]);
    setCurrentPrizeDisplay('');
    setCountdown(null);
    stopAllTimers();

    if (audioTenseRef.current) {
      audioTenseRef.current.currentTime = 0;
      audioTenseRef.current.play().catch(() => {});
    }

    const startVisualSpin = (interval: number) => {
      const spin = () => {
        setDisplayIndex(Math.floor(Math.random() * names.length));
        visualTimerRef.current = window.setTimeout(spin, interval);
      };
      spin();
    };

    startVisualSpin(50);

    const sequence: [number, number, number][] = [
      [5, 1.0, 1.0],   
      [4, 1.0, 1.0],   
      [3, 0.75, 1.3],  
      [2, 0.75, 1.3],  
      [1, 0.5, 1.8]    
    ];

    let currentStep = 0;

    const runSequence = () => {
      if (currentStep < sequence.length) {
        const [num, baseDelay, rateMult] = sequence[currentStep];
        setCountdown(num);
        playDing();
        speak(num.toString(), rateMult);

        stopAllTimers();
        const visualInterval = 50 + (currentStep * 40);
        startVisualSpin(visualInterval);

        currentStep++;
        const actualDelay = (baseDelay * 1000) / speechRateRef.current;
        timerRef.current = window.setTimeout(runSequence, actualDelay);
      } else {
        const finalDelay = (500) / speechRateRef.current;
        timerRef.current = window.setTimeout(revealWinner, finalDelay);
      }
    };

    timerRef.current = window.setTimeout(runSequence, 1200);
  };

  const revealWinner = () => {
    stopAllTimers();
    if (audioTenseRef.current) audioTenseRef.current.pause();
    
    const pool = [...names];
    const winners: string[] = [];
    const winnerIds: string[] = [];

    for (let i = 0; i < drawCount; i++) {
      const winnerIndex = Math.floor(Math.random() * pool.length);
      const winner = pool.splice(winnerIndex, 1)[0];
      winners.push(winner.name);
      winnerIds.push(winner.id);
    }
    
    setCurrentWinners(winners);
    setCurrentPrizeDisplay(prizeName);
    setCountdown(null);
    setIsSpinning(false);

    const record: LuckyDrawRecord = {
      id: Date.now().toString(),
      prizeName: prizeName,
      winners: winners,
      timestamp: new Date().toLocaleTimeString()
    };
    setHistory(prev => [record, ...prev]);

    if (audioWinRef.current) {
      audioWinRef.current.currentTime = 0;
      audioWinRef.current.play().catch(() => {});
    }

    triggerConfetti();

    if (!allowRepeat) {
      setNames(names.filter(n => !winnerIds.includes(n.id)));
    }
  };

  const triggerConfetti = () => {
    const end = Date.now() + 3000;
    const colors = ['#E4000F', '#0050AC', '#FBD000', '#00A230'];
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 65, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 65, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-5xl font-black text-white drop-shadow-[4px_4px_0px_#000] tracking-wider flex items-center justify-center gap-4 mb-8">
           <span className="text-5xl animate-bounce">⭐</span> 幸運大抽獎
        </h2>
        
        {/* 控制與設定面板 - 經典藍白塊狀 */}
        <div className="bg-white p-8 rounded-[1.5rem] border-4 border-black shadow-[8px_8px_0px_#000] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-black text-[#0050AC] uppercase tracking-widest px-1">獎項名稱</span>
            <input type="text" value={prizeName} onChange={(e) => setPrizeName(e.target.value)} placeholder="例如：金幣獎" className="w-full px-5 py-3 bg-slate-50 border-2 border-black rounded-xl focus:border-[#FBD000] outline-none font-black text-slate-700" />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between px-1">
              <span className="text-[11px] font-black text-[#0050AC] uppercase tracking-widest">抽取人數</span>
              <span className="text-xs font-black text-[#E4000F]">{drawCount} PLAYERS</span>
            </div>
            <input type="range" min="1" max={Math.max(1, Math.min(20, names.length))} step="1" value={drawCount} onChange={(e) => setDrawCount(parseInt(e.target.value))} className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#E4000F]" />
          </div>

          <div className="flex flex-col gap-3">
             <span className="text-[11px] font-black text-[#0050AC] uppercase tracking-widest">音量設定</span>
             <div className="flex items-center gap-2">
                <button onClick={() => setIsMuted(!isMuted)} className={`p-2 rounded-lg border-2 border-black transition-all ${isMuted ? 'bg-slate-300 text-white' : 'bg-[#FBD000] text-black'}`}>
                  {isMuted ? '🔇' : '🔊'}
                </button>
                <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0050AC]" />
             </div>
          </div>

          <div className="flex items-center justify-center">
             <label className="flex items-center gap-3 cursor-pointer select-none group">
                <input type="checkbox" checked={allowRepeat} onChange={(e) => setAllowRepeat(e.target.checked)} className="w-6 h-6 border-4 border-black rounded-lg checked:bg-[#00A230] appearance-none" />
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">允許重複</span>
              </label>
          </div>

        </div>
      </div>

      <div className="relative">
        <div className="bg-[#0050AC] border-4 border-black p-10 rounded-[2rem] shadow-[8px_8px_0px_#000] flex flex-col items-center min-h-[500px]">
          
          <div className={`w-full flex-grow rounded-2xl mb-8 flex flex-col items-center justify-center overflow-hidden border-4 border-black relative transition-all duration-700 ${isSpinning ? 'bg-black/60' : 'bg-[#5C94FC] shadow-inner'}`}>
            {isSpinning ? (
              <div className="flex flex-col items-center text-center px-4 w-full h-full justify-center">
                 <div className="text-4xl md:text-5xl font-black text-white/40 italic tracking-tighter mb-8 animate-pulse uppercase">
                  {names[displayIndex]?.name}
                </div>
                {countdown !== null && (
                  <div className="text-[14rem] font-black text-[#FBD000] drop-shadow-[6px_6px_0px_#000] leading-none animate-in zoom-in duration-300">
                    {countdown}
                  </div>
                )}
              </div>
            ) : currentWinners.length > 0 ? (
              <div className="text-center w-full px-8 animate-in fade-in zoom-in duration-500">
                <div className="bg-[#FBD000] text-black px-8 py-3 border-4 border-black rounded-xl inline-block text-lg font-black tracking-widest uppercase mb-8 shadow-[4px_4px_0px_#000]">
                  {currentPrizeDisplay} WINNERS!
                </div>
                
                <div className={`grid gap-6 items-center justify-center ${currentWinners.length > 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
                  {currentWinners.map((winner, idx) => (
                    <div key={idx} className="bg-white border-4 border-black p-6 rounded-2xl shadow-[4px_4px_0px_#000] transform hover:scale-105 transition-transform">
                      <div className="text-3xl md:text-5xl font-black text-black">
                        {winner}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-10 text-[#FBD000] text-xl font-black tracking-widest uppercase animate-bounce drop-shadow-[2px_2px_0px_#000]">
                  CONGRATULATIONS!
                </div>
              </div>
            ) : (
              <div className="text-white text-center space-y-6">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/20">
                  <span className="text-5xl">❔</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-black tracking-[0.4em] uppercase">Ready to Start</p>
                  <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">Left in Pool: {names.length}</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={startDraw}
            disabled={isSpinning || names.length === 0}
            className={`w-full max-w-md py-6 rounded-xl text-3xl font-black border-4 border-black transition-all transform active:scale-95 mario-shadow mario-shadow-active ${isSpinning || names.length === 0 ? 'bg-slate-400 text-slate-600' : 'bg-[#E4000F] text-white hover:bg-[#C3000D]'}`}
          >
            {isSpinning ? 'SPINNING...' : 'PRESS START'}
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="bg-white p-8 rounded-2xl border-4 border-black shadow-[8px_8px_0px_#000] space-y-8">
          <div className="flex justify-between items-center pb-4 border-b-4 border-slate-100">
            <h3 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-3">
              <span className="w-4 h-4 bg-[#FBD000] border-2 border-black rounded-full"></span>
              WINNER LOGS ({history.length})
            </h3>
            <button onClick={() => setHistory([])} className="text-[10px] font-black text-slate-300 hover:text-[#E4000F] uppercase transition-colors underline">Clear All</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {history.map((record) => (
              <div key={record.id} className="bg-slate-50 border-4 border-black p-6 rounded-xl flex flex-col gap-4 hover:bg-[#FBD000]/5 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-[#0050AC] uppercase block mb-1">{record.prizeName}</span>
                    <h4 className="font-black text-black text-lg">{record.timestamp}</h4>
                  </div>
                  <span className="text-[20px]">⭐</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {record.winners.map((winner, idx) => (
                    <span key={idx} className="bg-white border-2 border-black px-4 py-2 rounded-lg text-sm font-black text-black flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#00A230] rounded-full"></span>
                      {winner}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default LuckyDraw;
