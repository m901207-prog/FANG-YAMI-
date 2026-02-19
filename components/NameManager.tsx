
import React, { useState, useMemo } from 'react';
import { Participant } from '../types.ts';

interface NameManagerProps {
  names: Participant[];
  setNames: (names: Participant[] | ((prev: Participant[]) => Participant[])) => void;
}

const SAMPLE_DATA = ["王小明", "李美玲", "張大華", "陳靜宜", "林智強", "周杰倫", "蔡依林", "陳奕迅", "林俊傑", "張惠妹", "王小明"];

const NameManager: React.FC<NameManagerProps> = ({ names, setNames }) => {
  const [inputText, setInputText] = useState('');
  const [gsUrl, setGsUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isFullView, setIsFullView] = useState(false);
  const [isInputCollapsed, setIsInputCollapsed] = useState(false);

  // 計算哪些名字是重複的
  const duplicateMap = useMemo(() => {
    const counts: Record<string, number> = {};
    names.forEach(p => {
      counts[p.name] = (counts[p.name] || 0) + 1;
    });
    return counts;
  }, [names]);

  const hasDuplicates = useMemo(() => {
    return Object.values(duplicateMap).some(count => (count as number) > 1);
  }, [duplicateMap]);

  const addMany = (list: string[]) => {
    const fresh = list
      .map(n => n.trim())
      .filter(n => n !== '' && n.length < 50)
      .map(n => ({
        id: `P-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: n
      }));
    if (fresh.length > 0) setNames(prev => [...prev, ...fresh]);
  };

  const handleRemoveDuplicates = () => {
    const seen = new Set<string>();
    const uniqueList: Participant[] = [];
    names.forEach(p => {
      if (!seen.has(p.name)) {
        seen.add(p.name);
        uniqueList.push(p);
      }
    });
    setNames(uniqueList);
    alert(`✅ 已清理完畢，保留了 ${uniqueList.length} 位唯一成員。`);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      addMany(content.split(/\r?\n/));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleGoogleImport = async () => {
    if (!gsUrl.includes('docs.google.com/spreadsheets')) {
      alert("⚠️ 請提供有效的 Google 試算表連結！");
      return;
    }
    setIsImporting(true);
    try {
      const match = gsUrl.match(/\/d\/(.+?)\//);
      if (!match) throw new Error("網址解析失敗");
      const id = match[1];
      const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
      
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error("讀取失敗，請確認該表單已設定「知道連結的人均可查看」");
      
      const text = await res.text();
      const rows = text.split(/\r?\n/).map(row => {
        return row.split(',').map(cell => cell.replace(/^"|"$/g, '').trim());
      }).filter(row => row.length > 0 && row[0] !== "");

      if (rows.length === 0) throw new Error("試算表內沒有資料");

      const firstRow = rows[0];
      const nameKeywords = ["姓名", "name", "成員", "participant", "人名", "員工姓名"];
      let nameColIndex = 0;

      const detectedIndex = firstRow.findIndex(cell => 
        nameKeywords.some(kw => cell.toLowerCase().includes(kw.toLowerCase()))
      );

      let finalNames: string[] = [];
      if (detectedIndex !== -1) {
        nameColIndex = detectedIndex;
        finalNames = rows.slice(1).map(row => row[nameColIndex]).filter(Boolean);
      } else {
        finalNames = rows.map(row => row[0]).filter(Boolean);
      }

      addMany(finalNames);
      setGsUrl('');
    } catch (err) {
      alert(err instanceof Error ? err.message : "發生未知錯誤");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Input Section - Collapsible */}
      <section className="bg-white/90 border-4 border-black rounded-[2rem] shadow-[10px_10px_0px_#000] overflow-hidden transition-all duration-300">
        <div 
          className="flex justify-between items-center p-8 cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setIsInputCollapsed(!isInputCollapsed)}
        >
           <h2 className="text-2xl font-black flex items-center gap-3">
             <span className="text-3xl">🍄</span> 獲取名單金幣
           </h2>
           <div className="flex items-center gap-4">
              <button 
                onClick={(e) => { e.stopPropagation(); addMany(SAMPLE_DATA); }}
                className="hidden md:block px-4 py-2 bg-[#00A230] text-white rounded-xl text-xs font-black border-4 border-black shadow-[4px_4px_0px_#000] active:translate-y-1"
              >
                ✨ 填充範例名單
              </button>
              <div className="w-10 h-10 flex items-center justify-center border-4 border-black rounded-xl bg-white font-black">
                {isInputCollapsed ? '▼' : '▲'}
              </div>
           </div>
        </div>

        {!isInputCollapsed && (
          <div className="px-8 pb-8 animate-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div className="p-6 bg-slate-50 border-4 border-black rounded-2xl">
                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-3">1. 上傳 CSV / TXT</label>
                     <input type="file" accept=".csv,.txt" onChange={handleFile} className="w-full text-sm font-bold" />
                  </div>
                  <div className="p-6 bg-slate-50 border-4 border-black rounded-2xl">
                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-3">2. 快速手動輸入</label>
                     <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={inputText}
                         placeholder="輸入姓名並 Enter..."
                         onChange={e => setInputText(e.target.value)}
                         onKeyDown={e => { if(e.key==='Enter' && inputText.trim()){ addMany([inputText]); setInputText(''); } }}
                         className="flex-1 px-4 py-2 border-2 border-black rounded-lg font-bold outline-none focus:bg-[#FBD000]/10"
                       />
                       <button onClick={() => { if(inputText.trim()){ addMany([inputText]); setInputText(''); } }} className="mario-btn-yellow px-6 font-black rounded-lg">GO</button>
                     </div>
                  </div>
               </div>

               <div className="p-6 bg-[#00A230]/10 border-4 border-black rounded-2xl flex flex-col justify-between">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-[#00A230] mb-3">3. Google 試算表同步 (Warp Pipe)</label>
                    <textarea 
                      value={gsUrl}
                      onChange={e => setGsUrl(e.target.value)}
                      placeholder="在此貼上 Google 試算表網址..."
                      className="w-full h-24 p-4 border-4 border-black rounded-xl font-bold text-sm mb-4 outline-none focus:border-[#00A230]"
                    />
                  </div>
                  <button 
                    onClick={handleGoogleImport}
                    disabled={isImporting || !gsUrl}
                    className={`w-full py-3 rounded-xl font-black text-white border-4 border-black shadow-[4px_4px_0px_#000] active:translate-y-1 transition-all ${isImporting ? 'bg-slate-400' : 'bg-[#00A230] hover:bg-[#008026]'}`}
                  >
                    {isImporting ? '正在解析...' : '立即同步試算表'}
                  </button>
               </div>
            </div>
          </div>
        )}
      </section>

      {/* List Display Section */}
      <section className={`bg-white border-4 border-black p-8 rounded-[2rem] shadow-[10px_10px_0px_#000] flex flex-col transition-all ${isFullView ? 'min-h-[80vh]' : 'min-h-[500px]'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
           <h3 className="text-xl font-black flex items-center gap-4 text-black">
             PLAYER LIST 
             <span className="bg-[#0050AC] text-white px-4 py-1 rounded-full border-2 border-black text-sm">
               {names.length}
             </span>
             {hasDuplicates && (
               <span className="text-xs bg-[#E4000F] text-white px-3 py-1 rounded-full animate-pulse border-2 border-black">
                 偵測到重複項！
               </span>
             )}
           </h3>
           <div className="flex flex-wrap gap-4">
              {hasDuplicates && (
                <button 
                  onClick={handleRemoveDuplicates}
                  className="mario-btn-yellow px-4 py-2 text-xs font-black rounded-xl animate-bounce"
                >
                  🧹 移除重複姓名
                </button>
              )}
              <button onClick={() => setIsFullView(!isFullView)} className="px-4 py-2 bg-slate-100 border-4 border-black rounded-xl text-xs font-black shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-none">
                {isFullView ? '收起名單' : '全螢幕檢視'}
              </button>
           </div>
        </div>

        <div className={`flex-grow overflow-y-auto custom-scrollbar pr-4 grid gap-4 ${isFullView ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {names.length === 0 ? (
            <div className="col-span-full py-24 text-center">
              <div className="text-6xl mb-6 opacity-20">👻</div>
              <p className="text-slate-300 font-black italic text-xl">目前還沒有名單進入遊戲...</p>
            </div>
          ) : (
            names.map(p => {
              const isDup = (duplicateMap[p.name] as number) > 1;
              return (
                <div 
                  key={p.id} 
                  className={`p-4 border-4 rounded-xl flex justify-between items-center group transition-colors mario-shadow ${isDup ? 'bg-red-50 border-red-600' : 'bg-white border-black hover:bg-[#FBD000]'}`}
                >
                  <div className="flex flex-col overflow-hidden">
                    <span className={`font-black truncate ${isDup ? 'text-red-700' : 'text-black'}`}>{p.name}</span>
                    {isDup && <span className="text-[9px] font-black text-red-500 uppercase italic">Duplicate!</span>}
                  </div>
                  <button 
                    onClick={() => setNames(prev => prev.filter(n => n.id !== p.id))}
                    className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >✕</button>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
export default NameManager;
