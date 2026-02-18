
import React, { useState, useEffect } from 'react';
import NameManager from './components/NameManager.tsx';
import LuckyDraw from './components/LuckyDraw.tsx';
import GroupGenerator from './components/GroupGenerator.tsx';
import { Participant, AppTab } from './types.ts';

const STORAGE_KEY = 'lucky_toolbox_names_v1';

const App: React.FC = () => {
  // 從 LocalStorage 初始化名單
  const [names, setNames] = useState<Participant[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.NAME_MANAGEMENT);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved'>('saved');

  // 當名單變更時自動存檔
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
      setSaveStatus('saved');
    }, 500);
    return () => clearTimeout(timer);
  }, [names]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* 頂級裝飾條 - 馬力歐紅白配色 */}
      <div className="h-2 w-full bg-[#E4000F]"></div>

      {/* Header */}
      <header className="bg-[#0050AC] border-b-4 border-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setActiveTab(AppTab.NAME_MANAGEMENT)}>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#E4000F] font-black text-2xl border-4 border-black shadow-[4px_4px_0px_#000] group-hover:scale-110 transition-transform">M</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white leading-none tracking-wider">幸運的抽獎箱</h1>
                {/* 存檔狀態燈 */}
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border-2 border-black text-[9px] font-black uppercase transition-colors ${saveStatus === 'saved' ? 'bg-[#00A230] text-white' : 'bg-[#FBD000] text-black animate-pulse'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full bg-white ${saveStatus === 'saving' ? 'animate-ping' : ''}`}></span>
                  {saveStatus === 'saved' ? 'Auto-Saved' : 'Saving...'}
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#FBD000] uppercase tracking-[0.3em]">Lucky Toolbox</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-2 p-1.5 bg-black/20 rounded-xl">
            {[
              { id: AppTab.NAME_MANAGEMENT, label: '名單庫', icon: '📋' },
              { id: AppTab.LUCKY_DRAW, label: '大抽籤', icon: '🍄' },
              { id: AppTab.GROUPING, label: '智能分組', icon: '⭐' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2 rounded-lg text-sm font-black transition-all flex items-center gap-2 border-2 ${
                  activeTab === tab.id 
                    ? 'bg-[#FBD000] text-black border-black shadow-[2px_2px_0px_#000]' 
                    : 'text-white border-transparent hover:bg-white/10'
                }`}
              >
                <span className="text-lg leading-none">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
          
          <div className="flex items-center gap-4">
             <div className="hidden lg:flex flex-col items-end">
                <span className="text-[10px] font-bold text-white/60 uppercase">PLAYER COUNT</span>
                <span className="text-lg font-black text-[#FBD000] drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">{names.length}</span>
             </div>
             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#0050AC] border-2 border-black">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-10">
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          {activeTab === AppTab.NAME_MANAGEMENT && <NameManager names={names} setNames={setNames} />}
          {activeTab === AppTab.LUCKY_DRAW && (
            <LuckyDraw 
              names={names} 
              setNames={setNames} 
            />
          )}
          {activeTab === AppTab.GROUPING && <GroupGenerator names={names} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t-4 border-black py-10 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm font-black text-slate-400">© 2026 <span className="text-[#E4000F]">Lucky Toolbox</span>. 1UP FOR HR AGENTS.</p>
          <div className="flex gap-10">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">WORLD</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-[#00A230] rounded-full"></div>
                <span className="text-xs font-black text-[#00A230]">ONLINE</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">ENGINE</p>
              <span className="text-xs font-black text-[#0050AC]">SUPER GEMINI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
