
import React, { useState, useEffect, useRef } from 'react';
import { Participant, LuckyDrawRecord } from '../types.ts';

declare var confetti: any;

const SOUNDS = {
  TENSE: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  WIN: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
  DING: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
};

const LuckyDraw: React.FC<{ names: Participant[]; setNames: (n: Participant[]) => void }> = ({ names, setNames }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [winners, setWinners] = useState<string[]>([]);
  
  // 5 個獎項槽位，最後一個預設為驚喜加碼獎
  const [prizeSlots, setPrizeSlots] = useState<string[]>(['', '', '', '', '🎁 驚喜加碼獎']);
  const [selectedPrizeIndex, setSelectedPrizeIndex] = useState(4); // 預設選中最後一個
  
  const [count, setCount] = useState(1);
  const [allowRepeat, setAllowRepeat] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [randomName, setRandomName] = useState('');
  const [history, setHistory] = useState<LuckyDrawRecord[]>([]);

  const audios = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    Object.entries(SOUNDS).forEach(([key, url]) => {
      audios.current[key] = new Audio(url);
    });
    return () => {
      (Object.values(audios.current) as HTMLAudioElement[]).forEach(a => a.pause());
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = (txt: string) => {
    const u = new SpeechSynthesisUtterance(txt);
    u.rate = 1.2; u.pitch = 1.1;
    window.speechSynthesis.speak(u);
  };

  const updatePrizeSlot = (index: number, value: string) => {
    const newSlots = [...prizeSlots];
    newSlots[index] = value;
    setPrizeSlots(newSlots);
  };

  const getEffectivePrizeName = (index: number) => {
    return prizeSlots[index].trim() || `獎項 ${index + 1} (未填寫)`;
  };

  const startDraw = () => {
    if (names.length === 0) return alert("名單為空！");
    if (!allowRepeat && count > names.length) return alert(`剩餘名額不足以抽出 ${count} 人！`);
    
    setIsDrawing(true);
    setWinners([]);
    setCountdown(null);

    audios.current.TENSE.currentTime = 0;
    audios.current.TENSE.loop = true;
    audios.current.TENSE.play().catch(() => {});

    const spinInterval = setInterval(() => {
      setRandomName(names[Math.floor(Math.random() * names.length)].name);
    }, 60);

    const runCountdown = (n: number) => {
      if (n > 0) {
        setCountdown(n);
        audios.current.DING.currentTime = 0;
        audios.current.DING.play().catch(() => {});
        speak(n.toString());
        setTimeout(() => runCountdown(n - 1), 1000);
      } else {
        clearInterval(spinInterval);
        finishDraw();
      }
    };

    runCountdown(3);
  };

  const finishDraw = () => {
    audios.current.TENSE.pause();
    
    let selected: Participant[] = [];
    if (allowRepeat) {
      for(let i=0; i<count; i++) {
        selected.push(names[Math.floor(Math.random() * names.length)]);
      }
    } else {
      const shuffled = [...names].sort(() => Math.random() - 0.5);
      selected = shuffled.slice(0, count);
    }
    
    const winnerNames = selected.map(p => p.name);
    const winnerIds = selected.map(p => p.id);
    
    setWinners(winnerNames);
    setCountdown(null);
    setIsDrawing(false);

    audios.current.WIN.currentTime = 0;
    audios.current.WIN.play().catch(() => {});
    
    const currentPrizeName = getEffectivePrizeName(selectedPrizeIndex);
    
    const h: LuckyDrawRecord = {
      id: Date.now().toString(),
      prizeName: currentPrizeName,
      winners: winnerNames,
      timestamp: new Date().toLocaleTimeString()
    };
    setHistory(prev => [h, ...prev]);

    confetti({ 
      particleCount: Math.min(200, 100 + winnerNames.length), 
      spread: 80, 
      origin: { y: 0.6 } 
    });
    
    if (!allowRepeat) {
      setNames(names.filter(n => !winnerIds.includes(n.id)));
    }
    
    if (winnerNames.length <= 5) {
      speak(`恭喜中獎者：${winnerNames.join('、')}`);
    } else {
      speak(`恭喜以上 ${winnerNames.length} 位獲獎者！`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="text-center">
        <h2 className="text-6xl font-black text-white italic drop-shadow-[6px_6px_0px_#000] mb-12 animate-bounce">⭐ LUCKY DRAW</h2>
        
        <div className="bg-white border-8 border-black p-8 rounded-[3rem] shadow-[12px_12px_0px_#000] space-y-10">
           
           {/* Step 1: Prize Slots Configuration */}
           <div className="text-left space-y-4">
              <h3 className="text-sm font-black text-[#0050AC] flex items-center gap-2">
                <span className="w-6 h-6 bg-[#0050AC] text-white rounded-full flex items-center justify-center text-[10px]">1</span>
                配置獎項清單 (最多五個)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {prizeSlots.map((slot, idx) => (
                  <div key={idx} className="relative group">
                    <input 
                      type="text"
                      value={slot}
                      placeholder={`獎項 ${idx + 1}`}
                      onChange={(e) => updatePrizeSlot(idx, e.target.value)}
                      className={`w-full px-4 py-3 border-4 rounded-xl font-black text-xs outline-none transition-all ${idx === 4 ? 'border-[#E4000F] bg-red-50' : 'border-[#FBD000] focus:bg-[#FBD000]/10'}`}
                    />
                    {idx === 4 && <div className="absolute -top-2 -right-2 bg-[#E4000F] text-white text-[8px] px-2 py-0.5 rounded-full font-black border-2 border-black">FIXED</div>}
                  </div>
                ))}
              </div>
           </div>

           <hr className="border-2 border-black border-dashed opacity-20" />

           {/* Step 2: Drawing Settings */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
              <div className="text-left space-y-2">
                 <label className="text-[10px] font-black uppercase text-[#0050AC] flex items-center gap-2">
                    <span className="w-5 h-5 bg-[#0050AC] text-white rounded-full flex items-center justify-center text-[8px]">2</span>
                    選擇目前抽取的獎項
                 </label>
                 <div className="relative">
                    <select 
                      value={selectedPrizeIndex} 
                      onChange={e => setSelectedPrizeIndex(parseInt(e.target.value))} 
                      className="w-full px-6 py-4 border-4 border-black rounded-2xl font-black text-lg outline-none bg-white appearance-none cursor-pointer focus:bg-[#FBD000]/10 transition-colors"
                    >
                      {prizeSlots.map((_, idx) => (
                        <option key={idx} value={idx}>
                          {getEffectivePrizeName(idx)}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-black text-xl">▼</div>
                 </div>
              </div>

              <div className="text-left space-y-2">
                 <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-slate-400">抽取人數</label>
                    <span className="bg-black text-white px-2 py-1 rounded-md text-xs font-black">{count} 人</span>
                 </div>
                 <div className="pt-2">
                  <input 
                    type="range" 
                    min="1" 
                    max={Math.min(100, names.length || 1)} 
                    value={count} 
                    onChange={e => setCount(parseInt(e.target.value))} 
                    className="w-full h-4 bg-slate-200 rounded-full appearance-none accent-[#E4000F] cursor-pointer" 
                  />
                  <div className="flex justify-between mt-1 text-[8px] font-black text-slate-300">
                    <span>1</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                 </div>
              </div>

              <div className="text-left">
                 <button 
                  onClick={() => setAllowRepeat(!allowRepeat)}
                  className={`w-full flex items-center justify-between px-6 py-4 border-4 border-black rounded-2xl font-black text-xs transition-all ${allowRepeat ? 'bg-[#00A230] text-white shadow-[4px_4px_0px_#000]' : 'bg-slate-100 text-slate-400'}`}
                 >
                   <span>允許重複中獎</span>
                   <span className="text-lg font-black">{allowRepeat ? 'ON' : 'OFF'}</span>
                 </button>
              </div>
           </div>

           {/* Drawing Area */}
           <div className={`w-full min-h-[420px] border-8 border-black rounded-[2rem] flex flex-col items-center justify-center transition-all ${isDrawing ? 'bg-black text-white' : 'bg-[#5C94FC] text-white'} relative overflow-hidden`}>
              <div className="absolute top-6 left-8 bg-white/20 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest text-white/70 border-2 border-white/10 z-20">
                Current Prize: {getEffectivePrizeName(selectedPrizeIndex)}
              </div>
              
              {isDrawing ? (
                <div className="text-center z-10">
                  <div className="text-3xl font-black opacity-30 mb-4 animate-pulse uppercase tracking-widest">{randomName}</div>
                  <div className="text-[12rem] font-black leading-none italic drop-shadow-[8px_8px_0px_#E4000F]">{countdown}</div>
                </div>
              ) : winners.length > 0 ? (
                <div className="w-full h-full p-8 flex flex-col items-center animate-in zoom-in-75 duration-300 overflow-hidden">
                  <div className="bg-[#FBD000] text-black px-8 py-3 border-4 border-black rounded-xl font-black inline-block mb-6 uppercase tracking-[0.2em] shadow-[4px_4px_0px_#000] sticky top-0 z-10">Winners Revealed! ({winners.length})</div>
                  
                  <div className="flex-grow w-full overflow-y-auto custom-scrollbar px-4">
                    <div className={`grid gap-4 justify-center pb-6 ${
                      winners.length > 30 ? 'grid-cols-4 md:grid-cols-6 lg:grid-cols-10' : 
                      winners.length > 12 ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6' : 
                      'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    }`}>
                      {winners.map((w, i) => (
                        <div key={i} className={`bg-white text-black border-4 border-black rounded-xl font-black mario-shadow flex items-center justify-center text-center transition-transform hover:scale-105 ${
                          winners.length > 30 ? 'px-2 py-3 text-xs' : 
                          winners.length > 12 ? 'px-4 py-4 text-sm' : 
                          'px-8 py-5 text-2xl'
                        }`}>
                          {w}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center opacity-30 p-10">
                  <div className="text-[15rem] font-black leading-none mb-6">?</div>
                  <p className="font-black italic text-xl">名單人數：{names.length}</p>
                </div>
              )}
           </div>

           <div className="flex flex-col md:flex-row gap-6 mt-6">
             <button 
               onClick={startDraw} 
               disabled={isDrawing || names.length === 0}
               className={`flex-grow py-10 rounded-[2.5rem] text-5xl font-black border-8 border-black shadow-[12px_12px_0px_#000] active:translate-y-2 active:shadow-none transition-all ${isDrawing ? 'bg-slate-400' : 'bg-[#E4000F] text-white hover:bg-red-700'}`}
             >
               {isDrawing ? 'SPINNING...' : 'PUSH TO START'}
             </button>
           </div>
        </div>
      </div>

      {/* Record History */}
      {history.length > 0 && (
        <div className="bg-black/10 border-4 border-dashed border-black/30 p-8 rounded-[2rem] space-y-6">
           <h3 className="font-black text-white text-xl uppercase italic tracking-wider">Draw Records History</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {history.map(h => (
               <div key={h.id} className="bg-white border-4 border-black p-5 rounded-2xl flex flex-col justify-between hover:mario-shadow transition-all">
                 <div className="space-y-2">
                   <div className="flex justify-between items-start">
                     <span className="text-[9px] font-black uppercase text-[#0050AC] bg-[#0050AC]/10 px-2 py-0.5 rounded">{h.timestamp}</span>
                     <span className="text-[#FBD000] drop-shadow-[1px_1px_0px_#000]">★</span>
                   </div>
                   <div className="font-black text-[#E4000F] text-xs uppercase">{h.prizeName} ({h.winners.length} 人)</div>
                   <div className="font-black text-sm text-slate-800 line-clamp-2">{h.winners.join(', ')}</div>
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
