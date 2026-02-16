
import React, { useState, useEffect, useRef } from 'react';
import { Participant } from '../types';

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
  }, [names.length, setNames]);

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
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
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
    setNames([]);
  };

  const duplicateCount = names.filter(p => p.isDuplicate).length;

  return (
    <div className="flex flex-col gap-8 w-full transition-all duration-700 ease-in-out relative">
      
      {/* 頂部：匯入區塊 */}
      <div className={`transition-all duration-700 ease-in-out overflow-hidden ${isPreviewMaximized ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-[1200px] opacity-100'}`}>
        <div className="glass-card p-8 rounded-[2rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black flex items-center gap-3 cursor-pointer select-none group" onClick={() => setIsImportCollapsed(!isImportCollapsed)}>
              <span className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
              </span>
              匯入名單來源
              <svg className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isImportCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
            </h2>
            <button onClick={() => addParticipants(MOCK_DATA_SET)} className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-2xl text-sm font-bold hover:bg-indigo-100 transition-all border border-indigo-100">✨ 載入範例名單</button>
          </div>

          <div className={`transition-all duration-500 ease-in-out ${isImportCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100 mt-8'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Google Sheet */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group hover:border-emerald-200 transition-all flex flex-col justify-between">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 italic">Google 試算表連結</label>
                  <input type="text" value={googleUrl} onChange={(e) => setGoogleUrl(e.target.value)} placeholder="貼上共用連結..." className="w-full px-5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500 outline-none mb-4" />
                </div>
                <button onClick={handleGoogleImport} disabled={isImporting || !googleUrl} className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all">{isImporting ? '處理中...' : '讀取雲端名單'}</button>
              </div>

              {/* File Upload & Duplicate Detection */}
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <label className="block text-sm font-bold text-slate-700 mb-3">上傳 CSV / TXT 檔案</label>
                  <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-50 file:text-indigo-700 cursor-pointer" />
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">重複項分析</span>
                    <span className={`text-[10px] font-black ${duplicateCount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>{duplicateCount > 0 ? `⚠️ 偵測到 ${duplicateCount} 筆重複` : '名單無重複'}</span>
                  </div>
                  {duplicateCount > 0 && <button onClick={removeDuplicates} className="px-4 py-2 bg-rose-500 text-white text-[10px] font-black rounded-xl animate-pulse shadow-lg">手動去重</button>}
                </div>
              </div>

              {/* Text Input Area */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-1">
                <label className="block text-sm font-bold text-slate-700 mb-3">直接貼上姓名</label>
                <textarea className="w-full h-24 p-4 text-sm border border-slate-200 rounded-2xl focus:border-indigo-500 outline-none transition-all resize-none bg-slate-50/50 mb-3" placeholder="一行一個名字..." value={inputText} onChange={(e) => setInputText(e.target.value)} />
                <button onClick={() => { addParticipants(inputText.split(/\r?\n/)); setInputText(''); }} disabled={!inputText.trim()} className="w-full bg-slate-900 text-white py-3 rounded-2xl hover:bg-indigo-600 disabled:bg-slate-300 transition-all font-black text-sm">確認加入</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 下方：名單預覽區塊 */}
      <div className={`transition-all duration-700 ease-in-out w-full ${isPreviewMaximized ? 'h-[calc(100vh-200px)]' : 'min-h-[500px]'}`}>
        <div className={`glass-card p-8 rounded-[2rem] shadow-xl shadow-indigo-500/5 flex flex-col transition-all duration-700 h-full ${isPreviewMaximized ? 'border-indigo-400 ring-4 ring-indigo-500/5' : ''}`}>
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsPreviewMaximized(!isPreviewMaximized)}
                className={`p-3 rounded-2xl transition-all flex items-center gap-2 group ${isPreviewMaximized ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}
              >
                <svg className={`w-6 h-6 transition-transform duration-500 ${isPreviewMaximized ? 'rotate-180' : 'group-hover:-translate-y-1'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   {isPreviewMaximized ? (
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                   ) : (
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
                   )}
                </svg>
                <span className="text-xs font-black uppercase tracking-widest">{isPreviewMaximized ? "返回一般模式" : "最大化預覽表格"}</span>
              </button>
              <div>
                <h3 className="font-black text-slate-900 text-xl flex items-center gap-2">
                  目前名單
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full font-black">{names.length} 人</span>
                </h3>
              </div>
            </div>
            
            <div className="flex gap-4">
              {names.length > 0 && (
                <button 
                  onClick={clearAllNames} 
                  className="px-6 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 rounded-2xl text-sm font-black transition-all shadow-sm active:scale-95"
                >
                  取消全部名單
                </button>
              )}
            </div>
          </div>
          
          <div ref={scrollRef} className={`flex-grow overflow-y-auto custom-scrollbar pr-2 grid gap-5 transition-all duration-700 ${isPreviewMaximized ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 auto-rows-max' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-max'}`}>
            {names.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-300 text-center col-span-full h-full py-20">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-dashed border-slate-200">
                  <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <p className="text-lg font-bold text-slate-400">目前名單庫為空</p>
                <p className="text-xs text-slate-300 uppercase mt-2 tracking-widest">請從上方匯入姓名...</p>
              </div>
            ) : (
              names.map((p) => (
                <div 
                  key={p.id} 
                  className={`group flex justify-between items-center p-4 rounded-[1.5rem] border transition-all duration-300 ${
                    p.isDuplicate 
                    ? 'bg-rose-50 border-rose-200 ring-1 ring-rose-100' 
                    : 'bg-white border-slate-100 hover:border-indigo-400 hover:shadow-lg hover:-translate-y-1'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-black shadow-sm ${p.isDuplicate ? 'bg-rose-200 text-rose-700' : 'bg-slate-50 text-indigo-600 border border-slate-100'}`}>
                      {p.name.charAt(0)}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className={`text-sm font-black truncate ${p.isDuplicate ? 'text-rose-700' : 'text-slate-800'}`}>{p.name}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setNames(prev => prev.filter(n => n.id !== p.id))} 
                    className="p-2 text-slate-300 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100 hover:bg-rose-50 rounded-xl flex items-center gap-1"
                    title="取消此姓名"
                  >
                    <span className="text-[10px] font-black uppercase">取消</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
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
