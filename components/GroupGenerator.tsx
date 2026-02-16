
import React, { useState } from 'react';
import { Participant, GroupResult } from '../types';
import { generateCreativeGroupNames, CreativeGroupName } from '../services/geminiService';

interface GroupGeneratorProps {
  names: Participant[];
}

const GroupGenerator: React.FC<GroupGeneratorProps> = ({ names }) => {
  const [groupSize, setGroupSize] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<GroupResult[]>([]);
  const [context, setContext] = useState('');

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleGroup = async () => {
    if (names.length === 0) {
      alert('名單為空，請先匯入人員！');
      return;
    }
    
    setIsLoading(true);
    const shuffled = shuffleArray(names);
    const numGroups = Math.ceil(shuffled.length / groupSize);
    
    // 呼叫 Gemini 服務
    // Ensure result is treated as CreativeGroupName array
    const aiGroups: CreativeGroupName[] = await generateCreativeGroupNames(numGroups, context);
    
    const finalGroups: GroupResult[] = [];
    for (let i = 0; i < numGroups; i++) {
      // FIX: Explicitly type the mapping parameter as Participant to prevent 'unknown' type errors
      const members = shuffled.slice(i * groupSize, (i + 1) * groupSize).map((p: Participant) => p.name);
      
      // FIX: Access AI group information with safety checks
      const groupInfo = aiGroups[i] as CreativeGroupName | undefined;
      
      finalGroups.push({
        groupName: groupInfo?.name || `小組 ${i + 1}`,
        description: groupInfo?.description || '充滿潛力的團隊',
        members
      });
    }

    setResults(finalGroups);
    setIsLoading(false);
  };

  const downloadResults = () => {
    if (results.length === 0) return;
    
    let csvContent = "小組名稱,小組成員\n";
    results.forEach(group => {
      csvContent += `"${group.groupName}","${group.members.join('、')}"\n`;
    });
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `分組結果_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="glass-card p-10 rounded-3xl shadow-xl shadow-indigo-500/5">
        <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
          <span className="p-2 bg-emerald-500 rounded-xl text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </span>
          智能分組系統
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">每組期望人數</label>
            <input 
              type="number" 
              min="2" 
              value={groupSize} 
              onChange={(e) => setGroupSize(Math.max(2, parseInt(e.target.value) || 2))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
            />
          </div>
          <div className="lg:col-span-2 space-y-2">
            <label className="text-sm font-bold text-slate-600">活動屬性 (用於 AI 命名)</label>
            <input 
              type="text" 
              placeholder="例如：科技業年度大會、戶外攀岩挑戰、創意腦力激盪"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <button
            onClick={handleGroup}
            disabled={isLoading || names.length === 0}
            className={`w-full py-3.5 rounded-xl font-black transition-all shadow-lg active:scale-95 ${
              isLoading || names.length === 0 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 text-white hover:bg-emerald-600 shadow-emerald-500/20'
            }`}
          >
            {isLoading ? 'AI 正在規劃中...' : '開始智能分組'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-6 animate-in slide-in-from-bottom-10 duration-700">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-xl text-slate-800">分組結果</h3>
            <button 
              onClick={downloadResults}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              匯出 CSV 檔案
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((group, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-6 border border-slate-100 hover:border-indigo-300 transition-all group shadow-lg shadow-indigo-500/5">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-black text-indigo-700 leading-tight group-hover:text-indigo-800 transition-colors">
                    {group.groupName}
                  </h4>
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded uppercase tracking-wider">
                    {group.members.length} 人
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-6 italic min-h-[32px]">{group.description}</p>
                <div className="space-y-1.5">
                  {group.members.map((member, mIdx) => (
                    <div key={mIdx} className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg text-sm font-medium text-slate-700 border border-slate-50 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      {member}
                    </div>
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

export default GroupGenerator;
