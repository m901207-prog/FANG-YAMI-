
import React, { useState, useEffect, useRef } from 'react';
import NameManager from './components/NameManager.tsx';
import LuckyDraw from './components/LuckyDraw.tsx';
import GroupGenerator from './components/GroupGenerator.tsx';
import SeatPlanner from './components/SeatPlanner.tsx';
import { Participant, AppTab } from './types.ts';

const STORAGE_KEY = 'MARIO_HR_LIST_V2';

const App: React.FC = () => {
  const [names, setNames] = useState<Participant[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.NAME_MANAGEMENT);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING'>('IDLE');
  const saveTimerRef = useRef<number | null>(null);

  // 核心保存邏輯：防抖動處理
  useEffect(() => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    
    setSaveStatus('SAVING');
    saveTimerRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
        setSaveStatus('IDLE');
      } catch (e) {
        console.error("Storage Error:", e);
      }
    }, 800);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [names]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Banner */}
      <div className="h-4 w-full bg-[#E4000F] border-b-4 border-black"></div>

      {/* Header Area */}
      <header className="bg-[#0050AC] border-b-8 border-black sticky top-0 z-50 py-4 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div 
            className="flex items-center gap-4 cursor-pointer group"
            onClick={() => setActiveTab(AppTab.NAME_MANAGEMENT)}
          >
            <div className="w-14 h-14 bg-white border-4 border-black rounded-2xl flex items-center justify-center mario-shadow group-active:translate-y-1">
              <span className="text-[#E4000F] font-black text-3xl">M</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white italic tracking-tighter">幸運的抽獎箱 <span className="text-[#FBD000]">2.0</span></h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-white/60 tracking-widest uppercase">HR Professional Tool</span>
                <span className={`w-2 h-2 rounded-full ${saveStatus === 'SAVING' ? 'bg-[#FBD000] animate-pulse' : 'bg-[#00A230]'}`}></span>
              </div>
            </div>
          </div>
          
          <nav className="flex flex-wrap justify-center gap-2">
            {[
              { id: AppTab.NAME_MANAGEMENT, label: '名單庫' },
              { id: AppTab.LUCKY_DRAW, label: '大抽籤' },
              { id: AppTab.GROUPING, label: '智能分組' },
              { id: AppTab.SEAT_PLANNER, label: '隨機座次' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-xl text-sm font-black border-4 transition-all ${
                  activeTab === tab.id 
                    ? 'bg-[#FBD000] text-black border-black shadow-[4px_4px_0px_#000]' 
                    : 'bg-white/10 text-white border-transparent hover:bg-white/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
             <div className="text-right">
                <div className="text-[10px] font-black text-white/50 uppercase">Count</div>
                <div className="text-2xl font-black text-[#FBD000]">{names.length}</div>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-12">
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          {activeTab === AppTab.NAME_MANAGEMENT && (
            <NameManager 
              names={names} 
              setNames={setNames} 
            />
          )}
          {activeTab === AppTab.LUCKY_DRAW && <LuckyDraw names={names} setNames={setNames} />}
          {activeTab === AppTab.GROUPING && <GroupGenerator names={names} />}
          {activeTab === AppTab.SEAT_PLANNER && <SeatPlanner names={names} />}
        </div>
      </main>

      <footer className="bg-white border-t-8 border-black py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 opacity-50">
          <p className="font-black text-sm">© 2026 <span className="text-[#E4000F]">LUCKY TOOLBOX</span> V2.0</p>
          <p className="font-bold text-xs">SUPER CHARGED FOR HR AGENTS</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
