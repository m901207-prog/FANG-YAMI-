
import React, { useState } from 'react';
import { Participant } from '../types.ts';

interface SeatPlannerProps {
  names: Participant[];
}

const SeatPlanner: React.FC<SeatPlannerProps> = ({ names }) => {
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(5);
  const [isPlacing, setIsPlacing] = useState(false);
  const [seats, setSeats] = useState<(string | null)[]>([]);

  const handleGenerate = () => {
    if (names.length === 0) return alert("名單為空！");
    setIsPlacing(true);
    
    // 動畫延遲
    setTimeout(() => {
      const shuffled = [...names].sort(() => Math.random() - 0.5);
      const totalSeats = rows * cols;
      const newSeats = Array(totalSeats).fill(null);
      
      shuffled.slice(0, totalSeats).forEach((p, i) => {
        newSeats[i] = p.name;
      });
      
      setSeats(newSeats);
      setIsPlacing(false);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-10 rounded-[1.5rem] border-4 border-black shadow-[8px_8px_0px_#000]">
        <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
          <span className="p-2 bg-[#FBD000] border-2 border-black rounded-xl">🧱</span>
          隨機座位表 (SEAT PLANNER)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase">橫列 (Rows)</label>
            <input type="number" min="1" max="10" value={rows} onChange={e => setRows(parseInt(e.target.value))} className="w-full px-4 py-2 border-4 border-black rounded-xl font-black" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase">直欄 (Cols)</label>
            <input type="number" min="1" max="10" value={cols} onChange={e => setCols(parseInt(e.target.value))} className="w-full px-4 py-2 border-4 border-black rounded-xl font-black" />
          </div>
          <div className="md:col-span-2">
            <button 
              onClick={handleGenerate} 
              disabled={isPlacing || names.length === 0}
              className={`w-full py-4 rounded-xl font-black border-4 border-black shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-none transition-all ${isPlacing ? 'bg-slate-200' : 'bg-[#FBD000] hover:bg-[#E5BF00]'}`}
            >
              {isPlacing ? 'SORTING...' : 'START RANDOM SEATING'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-center overflow-x-auto py-10">
        <div 
          className="grid gap-4 p-8 bg-black/5 rounded-[2rem] border-4 border-dashed border-black/20"
          style={{ 
            gridTemplateColumns: `repeat(${cols}, minmax(100px, 1fr))`,
            width: 'fit-content'
          }}
        >
          {Array.from({ length: rows * cols }).map((_, i) => (
            <div 
              key={i} 
              className={`w-24 h-24 md:w-32 md:h-32 rounded-xl border-4 border-black flex flex-col items-center justify-center transition-all duration-500 ${
                seats[i] 
                  ? 'bg-white shadow-[4px_4px_0px_#000] scale-100' 
                  : 'bg-[#E4000F] shadow-[4px_4px_0px_#800000] animate-pulse opacity-20'
              }`}
            >
              {seats[i] ? (
                <>
                  <div className="text-[10px] font-black text-slate-400 mb-1">#{i + 1}</div>
                  <div className="text-sm md:text-lg font-black text-center px-2 truncate w-full">{seats[i]}</div>
                </>
              ) : (
                <span className="text-4xl text-white font-black">?</span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {seats.length > 0 && !isPlacing && (
        <div className="text-center">
          <button 
            onClick={() => window.print()} 
            className="px-8 py-3 bg-white border-4 border-black rounded-xl font-black shadow-[4px_4px_0px_#000] hover:bg-slate-50 active:translate-y-1 active:shadow-none transition-all"
          >
            PRINT SEATING CHART
          </button>
        </div>
      )}
    </div>
  );
};

export default SeatPlanner;
