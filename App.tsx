
import React, { useState } from 'react';
import NameManager from './components/NameManager';
import LuckyDraw from './components/LuckyDraw';
import GroupGenerator from './components/GroupGenerator';
import { Participant, AppTab } from './types';

const App: React.FC = () => {
  const [names, setNames] = useState<Participant[]>([]);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.NAME_MANAGEMENT);

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-800">
      {/* 頂級裝飾條 */}
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500"></div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setActiveTab(AppTab.NAME_MANAGEMENT)}>
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-600/20 group-hover:rotate-6 transition-transform">🎁</div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none">幸運的抽獎箱</h1>
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.3em]">Lucky Toolbox</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-2xl">
            {[
              { id: AppTab.NAME_MANAGEMENT, label: '名單庫', icon: '📋' },
              { id: AppTab.LUCKY_DRAW, label: '大抽籤', icon: '🎁' },
              { id: AppTab.GROUPING, label: '智能分組', icon: '👥' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-white text-indigo-600 shadow-md scale-105' 
                    : 'text-slate-500 hover:bg-white/50'
                }`}
              >
                <span className="text-lg leading-none">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
          
          <div className="flex items-center gap-4">
             <div className="hidden lg:flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase">總人數</span>
                <span className="text-lg font-black text-slate-800">{names.length}</span>
             </div>
             <div className="w-px h-8 bg-slate-100 hidden lg:block"></div>
             <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-white shadow-inner">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-10">
        
        {/* Mobile Navigation */}
        <div className="md:hidden flex justify-between p-2 mb-8 glass-card rounded-2xl shadow-lg">
            {[
              { id: AppTab.NAME_MANAGEMENT, label: '名單', icon: '📋' },
              { id: AppTab.LUCKY_DRAW, label: '抽籤', icon: '🎁' },
              { id: AppTab.GROUPING, label: '分組', icon: '👥' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-all ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-lg scale-105' 
                    : 'text-slate-400'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="text-[10px] font-black mt-1 uppercase">{tab.label}</span>
              </button>
            ))}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          {activeTab === AppTab.NAME_MANAGEMENT && <NameManager names={names} setNames={setNames} />}
          {activeTab === AppTab.LUCKY_DRAW && (
            <LuckyDraw 
              names={names} 
              setNames={setNames} 
              onBackToHome={() => setActiveTab(AppTab.NAME_MANAGEMENT)} 
            />
          )}
          {activeTab === AppTab.GROUPING && <GroupGenerator names={names} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm font-bold text-slate-400">© 2024 <span className="text-slate-900">幸運的抽獎箱</span>. 全方位活動助手.</p>
          <div className="flex gap-10">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Status</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-slate-600">系統運行正常</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Engine</p>
              <span className="text-xs font-bold text-slate-600">Gemini 3 Flash</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;