
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
    if (names.length === 0) return;
    setIsLoading(true);
    const shuffled = shuffleArray(names);
    const numGroups = Math.ceil(shuffled.length / groupSize);
    
    const aiGroups: CreativeGroupName[] = await generateCreativeGroupNames(numGroups, context);
    
    const finalGroups: GroupResult[] = [];
    for (let i = 0; i < numGroups; i++) {
      const members = shuffled.slice(i * groupSize, (i + 1) * groupSize).map((p: Participant) => p.name);
      const groupInfo = aiGroups[i] as CreativeGroupName | undefined;
      
      finalGroups.push({
        groupName: groupInfo?.name || `WORLD ${i + 1}`,
        description: groupInfo?.description || 'A SUPER TEAM!',
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
    link.setAttribute("download", `TEAM_SPLIT_${new Date().toLocaleDateString()}.csv`);
    link.click();
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-10 rounded-[1.5rem] border-4 border-black shadow-[8px_8px_0px_#000]">
        <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-black">
          <span className="p-2 bg-[#00A230] border-2 border-black rounded-xl text-white">
            🍄
          </span>
          智能分組 (WARP ZONE)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase">每組人數</label>
            <input type="number" min="2" value={groupSize} onChange={(e) => setGroupSize(Math.max(2, parseInt(e.target.value) || 2))} className="w-full px-4 py-3 bg-slate-50 border-2 border-black rounded-xl focus:border-[#00A230] outline-none font-black" />
          </div>
          <div className="lg:col-span-2 space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase">活動背景</label>
            <input type="text" placeholder="例如：大亂鬥訓練營" value={context} onChange={(e) => setContext(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-black rounded-xl focus:border-[#00A230] outline-none font-black" />
          </div>
          <button onClick={handleGroup} disabled={isLoading || names.length === 0} className={`w-full py-4 rounded-xl font-black border-4 border-black transition-all shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-none ${isLoading || names.length === 0 ? 'bg-slate-200 text-slate-400' : 'bg-[#00A230] text-white hover:bg-[#008026]'}`}>
            {isLoading ? 'GENERATING...' : 'START TEAM SPLIT'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-6 animate-in slide-in-from-bottom-10 duration-700">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-black text-xl text-white drop-shadow-[2px_2px_0px_#000]">TEAM RESULTS</h3>
            <button onClick={downloadResults} className="flex items-center gap-2 px-4 py-2 bg-white border-4 border-black rounded-xl text-xs font-black text-black hover:bg-slate-100 transition-all shadow-[4px_4px_0px_#000]">
              DOWNLOAD DATA
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((group, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border-4 border-black hover:scale-105 transition-all shadow-[6px_6px_0px_#000] group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-[#00A230]"></div>
                <div className="flex items-start justify-between mb-4 mt-2">
                  <h4 className="text-xl font-black text-[#0050AC] leading-tight group-hover:text-[#E4000F] transition-colors">
                    {group.groupName}
                  </h4>
                  <span className="px-2 py-1 bg-[#FBD000] text-black text-[10px] font-black rounded border-2 border-black">
                    {group.members.length} P
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-6 italic min-h-[40px] font-medium leading-relaxed">"{group.description}"</p>
                <div className="space-y-2">
                  {group.members.map((member, mIdx) => (
                    <div key={mIdx} className="flex items-center gap-3 px-3 py-2 bg-slate-50 border-2 border-black rounded-lg text-sm font-black text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-[#00A230]"></span>
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
