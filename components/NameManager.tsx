
import React, { useState, useEffect, useRef } from 'react';
import { Participant } from '../types.ts';

interface NameManagerProps {
  names: Participant[];
  setNames: (names: Participant[] | ((prev: Participant[]) => Participant[])) => void;
}

const MOCK_DATA_SET = [
  "王小明", "李美玲", "張大華", "陳靜宜", "林智強", 
  "周杰倫", "蔡依林", "五月天", "郭台銘", "張忠謀", 
  "黃仁勳", "蘇姿丰", "馬斯克", "賈伯斯", "比爾蓋茲"
];

const NameManager: React.FC<NameManagerProps> = ({ names, setNames }) => {
  const [inputText, setInputText] = useState('');
  const [googleUrl, setGoogleUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isImportCollapsed, setIsImportCollapsed] = useState(false);
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nameCount = new Map<string, number>();
    names.forEach(p => {
      nameCount.set(p.name, (nameCount.get(p.name) || 0) + 1);
    });

    const updatedNames = names.map(p => ({
      ...p,
      isDuplicate: (nameCount.get(p.name) || 0) > 1
    }));

    const currentIsDuplicateStr = names.map(n => n.isDuplicate).join(',');
    const nextIsDuplicateStr = updatedNames.map(n => n.isDuplicate).join(',');
    
    if (currentIsDuplicateStr !== nextIsDuplicateStr) {
      setNames(updatedNames);
    }
  }, [names.length]); // 僅在長度變化時檢測重複，避免 setNames 無限迴圈

  const addParticipants = (rawNames: string[]) => {
    const newParticipants = rawNames
      .map(n => n.trim())
      .filter(n => n !== '' && n.length < 50)
      .map(n => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: n
      }));

    if (newParticipants.length > 0) {
      setNames(prev => [...prev, ...newParticipants]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      addParticipants(text.split(/\r?\n/));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleGoogleImport = async () => {
    if (!googleUrl) return;
    setIsImporting(true);
    try {
      let exportUrl = googleUrl;
      const sheetIdMatch = googleUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (sheetIdMatch) exportUrl = `https://docs.google.com/spreadsheets/d/${sheetIdMatch[1]}/export?format=csv`;
      const response = await fetch(exportUrl);
      if (!response.ok) throw new Error('無法讀取該試算表。');
      const text = await response.text();
      const rows = text.split(/\r?\n/).map(row => row.split(',').map(cell => cell.replace(/"/g, '').trim()));
      if (rows.length === 0) return;
      const headers = rows[0];
      let nameColIndex = headers.findIndex(h => h.includes('姓名') || h.toLowerCase().includes('name'));
      if (nameColIndex === -1) nameColIndex = 0;
      addParticipants(rows.slice(1).map(row => row[nameColIndex]).filter(n => n));
      setGoogleUrl('');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const removeDuplicates = () => {
    const seen = new Set();
    setNames(prev => prev.filter(p => {
      const isNew = !seen.has(p.name);
      seen.add(p.name);
      return isNew;
    }));
  };

  const clearAllNames = () => {
    if (confirm("確定要清空所有名單嗎？此動作不可撤銷。")) {
      setNames([]);
    }
  };

  const exportNames = () => {
    if (names.length === 0) return;
    const csvContent = "姓名\n" + names.map(p => p.name).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `PLAYER_LIST_${new Date().toISOString().slice(0,10)}.csv`);
    link.click();
  };

  const duplicateCount = names.filter(p => p.isDuplicate).length;

  return (
    <div className="flex flex-col gap-8 w-full relative">
      
      {/* 頂部：匯入區塊 */}
      <div className={`transition-all duration-700 ease-in-out overflow-hidden ${isPreviewMaximized ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-[1200px] opacity-100'}`}>
        <div className="glass-card p-8 rounded-[1.5rem] relative overflow-hidden bg-[#FBD000]/10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black flex items-center gap-3 cursor-pointer select-none group" onClick={() => setIsImportCollapsed(!isImportCollapsed)}>
              <span className="p-2.5 bg-[#FBD000] border-4 border-black rounded-xl text-black shadow-[4px_4px_0px_#000]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
              </span>
              獲取名單金幣
              <svg className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isImportCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
            </h2>
            <button onClick={() => addParticipants(MOCK_DATA_SET)} className="px-5 py-2.5 bg-[#00A230] text-white rounded-xl text-sm font-black border-4 border-black shadow-[4px_4px_0px_#000] hover:translate-y-1 hover:shadow-none transition-all">✨ 範例名單</button>
          </div>

          <div className={`transition-all duration-500 ease-in-out ${isImportCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100 mt-8'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Google Sheet */}
              <div className="bg-white p-6 rounded-2xl border-4 border-black shadow-[4px_4px_0px_#000] flex flex-col justify-between">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-3">Google 試算表 (雲端關卡)</label>
                  <input type="text" value={googleUrl} onChange={(e) => setGoogleUrl(e.target.value)} placeholder="貼上共用連結..." className="w-full px-5 py-3 text-sm bg-slate-50 border-2 border-black rounded-xl focus:border-[#E4000F] outline-none mb-4" />
                </div>
                <button onClick={handleGoogleImport} disabled={isImporting || !googleUrl} className="w-full py-3 bg-[#0050AC] text-white rounded-xl font-black text-sm border-2 border-black hover:bg-[#004080]">{isImporting ? 'LOADING...' : '讀取雲端'}</button>
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-2xl border-4 border-black shadow-[4px_4px_0px_#000]">
                  <label className="block text-sm font-black text-slate-700 mb-3">上傳 CSV / TXT</label>
                  <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-black file:text-xs file:font-black file:bg-[#FBD000] file:text-black cursor-pointer" />
                </div>
                <div className="bg-white p-6 rounded-2xl border-4 border-black shadow-[4px_4px_0px_#000] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-700">重複項警報</span>
                    <span className={`text-[10px] font-black ${duplicateCount > 0 ? 'text-[#E4000F]' : 'text-slate-400'}`}>{duplicateCount > 0 ? `⚠️ 偵測到 ${duplicateCount} 筆重複` : '名單無重複'}</span>
                  </div>
                  {duplicateCount > 0 && <button onClick={removeDuplicates} className="px-4 py-2 bg-[#E4000F] text-white text-[10px] font-black rounded-lg border-2 border-black animate-pulse">排除</button>}
                </div>
              </div>

              {/* Text Input */}
              <div className="bg-white p-6 rounded-2xl border-4 border-black shadow-[4px_4px_0px_#000] lg:col-span-1">
                <label className="block text-sm font-black text-slate-700 mb-3">快速加入姓名</label>
                <textarea className="w-full h-24 p-4 text-sm border-2 border-black rounded-xl focus:border-[#FBD000] outline-none transition-all resize-none bg-slate-50 mb-3" placeholder="一行一個名字..." value={inputText} onChange={(e) => setInputText(e.target.value)} />
                <button onClick={() => { addParticipants(inputText.split(/\r?\n/)); setInputText(''); }} disabled={!inputText.trim()} className="w-full bg-black text-white py-3 rounded-xl hover:bg-slate-800 disabled:bg-slate-300 transition-all font-black text-sm">確認加入</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 下方：名單預覽區塊 */}
      <div className={`transition-all duration-700 ease-in-out w-full ${isPreviewMaximized ? 'h-[calc(100vh-200px)]' : 'min-h-[500px]'}`}>
        <div className={`glass-card p-8 rounded-[1.5rem] flex flex-col h-full border-4 border-black ${isPreviewMaximized ? 'bg-white' : ''}`}>
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsPreviewMaximized(!isPreviewMaximized)}
                className={`p-3 rounded-xl border-2 border-black transition-all flex items-center gap-2 group ${isPreviewMaximized ? 'bg-[#0050AC] text-white' : 'bg-white text-black hover:bg-slate-100'}`}
              >
                <svg className={`w-6 h-6 transition-transform duration-500 ${isPreviewMaximized ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={isPreviewMaximized ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                </svg>
                <span className="text-xs font-black uppercase tracking-widest">{isPreviewMaximized ? "退出全螢幕" : "名單大預覽"}</span>
              </button>
              <h3 className="font-black text-black text-xl flex items-center gap-2">
                PLAYER LIST
                <span className="px-3 py-1 bg-[#FBD000] text-black text-sm rounded-lg border-2 border-black font-black">{names.length}</span>
              </h3>
            </div>
            
            <div className="flex gap-4">
              {names.length > 0 && (
                <>
                  <button onClick={exportNames} className="px-6 py-2.5 bg-[#00A230] text-white hover:bg-[#008026] border-4 border-black rounded-xl text-sm font-black transition-all shadow-[4px_4px_0px_#000] active:shadow-none active:translate-y-1">
                    💾 導出目前名單 (手動存檔)
                  </button>
                  <button onClick={clearAllNames} className="px-6 py-2.5 bg-white text-[#E4000F] hover:bg-[#E4000F] hover:text-white border-4 border-[#E4000F] rounded-xl text-sm font-black transition-all">
                    GAME OVER (清空)
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div ref={scrollRef} className={`flex-grow overflow-y-auto custom-scrollbar pr-2 grid gap-5 ${isPreviewMaximized ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
            {names.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-300 text-center col-span-full h-full py-20">
                <p className="text-lg font-black text-white drop-shadow-[2px_2px_0px_#000]">名單目前是空的...</p>
                <p className="text-xs text-white/50 uppercase mt-2 font-black tracking-widest">NO PLAYERS IMPORTED</p>
              </div>
            ) : (
              names.map((p) => (
                <div key={p.id} className={`group flex justify-between items-center p-4 rounded-xl border-4 transition-all ${p.isDuplicate ? 'bg-[#E4000F]/10 border-[#E4000F]' : 'bg-white border-black hover:bg-[#FBD000]/10 hover:-translate-y-1 shadow-[2px_2px_0px_#000]'}`}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-black border-2 border-black ${p.isDuplicate ? 'bg-[#E4000F] text-white' : 'bg-[#00A230] text-white'}`}>
                      {p.name.charAt(0)}
                    </div>
                    <span className={`text-sm font-black truncate ${p.isDuplicate ? 'text-[#E4000F]' : 'text-black'}`}>{p.name}</span>
                  </div>
                  <button onClick={() => setNames(prev => prev.filter(n => n.id !== p.id))} className="p-1 text-slate-300 hover:text-[#E4000F] transition-all opacity-0 group-hover:opacity-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default NameManager;
