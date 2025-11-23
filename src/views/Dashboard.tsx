import React, { useMemo, useState, useRef, useEffect } from 'react';
import { MediaItem } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector, Legend } from 'recharts';

interface DashboardProps {
  library: MediaItem[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#a4de6c', '#d0ed57'];
const BG_COLOR = '#1e293b'; 

const SESSION_STATE = {
  hasPlayedAnimation: false
};

// --- CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload, total }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percent = ((data.value / total) * 100).toFixed(1);
    
    return (
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-600 p-3 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] z-50 min-w-[100px]">
        {/* Centered Header */}
        <div className="flex items-center justify-center gap-2 mb-1 border-b border-slate-700/50 pb-2">
            <p className="font-bold text-white capitalize">{data.name}</p>
        </div>
        {/* Centered Content */}
        <div className="flex items-baseline justify-center gap-2">
            <p className="text-xl font-bold text-osmanthus-400">{data.value}</p>
            <p className="text-xs text-slate-400">({percent}%)</p>
        </div>
      </div>
    );
  }
  return null;
};

// --- ACTIVE SHAPE (Dynamic Pop-out) ---
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke={BG_COLOR}
        strokeWidth={4}
      />
    </g>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ library }) => {
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isAnimating, setIsAnimating] = useState(!SESSION_STATE.hasPlayedAnimation);
  
  const animationStartTime = useRef<number>(0);

  useEffect(() => {
      if (isAnimating) {
          animationStartTime.current = Date.now();
      }
  }, [isAnimating]);

  const statusCounts = useMemo(() => {
    return library.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [library]);

  const typeData = useMemo(() => {
    const totalItems = library.length;
    if (totalItems === 0) return [];

    const rawCounts = library.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const result: { name: string; value: number }[] = [];
    let otherCount = 0;

    Object.entries(rawCounts).forEach(([name, value]) => {
      if (value / totalItems < 0.05) {
        otherCount += value;
      } else {
        result.push({ name, value });
      }
    });

    if (otherCount > 0) result.push({ name: 'Other', value: otherCount });
    return result.sort((a, b) => b.value - a.value);
  }, [library]);

  const handleAnimationEnd = () => {
      const elapsed = Date.now() - animationStartTime.current;
      if (elapsed > 500) {
          SESSION_STATE.hasPlayedAnimation = true;
          setIsAnimating(false);
      }
  };

  return (
    <div className="space-y-6 p-6 h-full overflow-y-auto [scrollbar-gutter:stable]">
      <h1 className="text-2xl font-bold text-white">Statistics & Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm">
          <h3 className="text-slate-400 text-sm font-medium uppercase">Total Items</h3>
          <p className="text-3xl font-bold text-white mt-1">{library.length}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm">
          <h3 className="text-slate-400 text-sm font-medium uppercase">In Progress</h3>
          <p className="text-3xl font-bold text-osmanthus-400 mt-1">{statusCounts['In Progress'] || 0}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm">
          <h3 className="text-slate-400 text-sm font-medium uppercase">Completed</h3>
          <p className="text-3xl font-bold text-emerald-400 mt-1">{statusCounts['Completed'] || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 flex flex-col h-full min-h-[400px]">
          <h2 className="text-xl font-semibold mb-4 text-white">Distribution by Format</h2>
          
          <div className="flex-1 flex flex-col">
            {typeData.length > 0 ? (
              <>
                <div className={`flex-1 min-h-[250px] w-full ${isAnimating ? 'pointer-events-none' : ''}`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                        <Pie
                            key={isAnimating ? 'animating' : 'static'}
                            data={typeData}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={75}
                            outerRadius={105}
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            onMouseEnter={(_, index) => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(-1)}
                            paddingAngle={0}
                            stroke={BG_COLOR}
                            strokeWidth={4}
                            isAnimationActive={isAnimating}
                            animationDuration={1000}
                            animationBegin={0}
                            onAnimationEnd={handleAnimationEnd}
                        >
                            {typeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.name === 'Other' ? '#64748b' : COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        
                        {/* 
                           TOOLTIP CONFIG 
                           isAnimationActive={false} -> Stops flying/fading in
                           offset={20} -> Keeps it near the mouse but not covering the cursor
                           wrapperStyle -> Removes default focus outlines
                        */}
                        <Tooltip 
                            content={<CustomTooltip total={library.length} />} 
                            cursor={false} 
                            isAnimationActive={false} 
                            offset={20}
                            wrapperStyle={{ outline: 'none' }}
                        />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 border-t border-slate-700 pt-4">
                    {typeData.map((entry, index) => (
                        <div key={entry.name} className={`flex items-center gap-2 text-sm font-medium transition-opacity duration-200 ${activeIndex === -1 || activeIndex === index ? 'opacity-100' : 'opacity-40'}`} onMouseEnter={() => !isAnimating && setActiveIndex(index)} onMouseLeave={() => !isAnimating && setActiveIndex(-1)}>
                            <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.name === 'Other' ? '#64748b' : COLORS[index % COLORS.length] }} />
                            <span className="text-slate-300 capitalize">{entry.name}</span>
                        </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500 text-sm">No data available</div>
            )}
          </div>
        </div>

       <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 flex flex-col h-full">
          <h2 className="text-xl font-semibold mb-4 text-white">Recently Updated</h2>
          <div className="space-y-2 flex-1 overflow-y-auto pr-2 [scrollbar-width:thin]">
            {library.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center p-2 hover:bg-slate-700/50 rounded-md transition cursor-default">
                <div className="h-10 w-8 bg-slate-600 rounded overflow-hidden mr-3 flex-shrink-0">
                  {item.coverUrl ? <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-slate-700 text-[8px] text-slate-400 text-center leading-none p-0.5">No Img</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm truncate" title={item.title}>{item.title}</h4>
                  <p className="text-xs text-slate-400 truncate">{item.type} • {item.status}</p>
                </div>
                <div className="text-xs text-slate-500 ml-2 whitespace-nowrap font-mono">{new Date(item.updatedAt).toLocaleDateString()}</div>
              </div>
            ))}
            {library.length === 0 && <p className="text-slate-500 text-sm italic text-center mt-10">No items in library yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};