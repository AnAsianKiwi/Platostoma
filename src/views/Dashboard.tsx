import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useUIStore } from '../store/useUIStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { Card } from '../components/ui/Card';

const COLORS = [
  '#0088FE', '#FF8042', '#00FFCC', '#FFBB28', '#FF6B6B', '#665ffd', '#82ca9d', '#F472B6', 
  '#0EA5E9', '#a4de6c', '#8387ff', '#F59E0B', '#d0ed57', '#EC4899', '#14B8A6', '#8B5CF6', 
  '#F97316', '#38BDF8', '#A855F7', '#FB7185',
];
const BG_COLOR = '#1e293b';

let hasPlayedAnimation = false;

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx} cy={cy} innerRadius={innerRadius - 15} outerRadius={outerRadius}
        startAngle={startAngle} endAngle={endAngle} fill={fill}
        stroke={BG_COLOR} strokeWidth={2} style={{ filter: 'drop-shadow(0px 0px 6px rgba(0,0,0,0.5))' }}
      />
    </g>
  );
};

export const Dashboard: React.FC = () => {
  const { library } = useDataStore();
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isAnimating, setIsAnimating] = useState(!hasPlayedAnimation);
  const animationStartTime = useRef<number>(0);

  useEffect(() => {
    if (isAnimating) animationStartTime.current = Date.now();
  }, [isAnimating]);

  const handleAnimationEnd = () => {
    const elapsed = Date.now() - animationStartTime.current;
    if (elapsed > 500) { hasPlayedAnimation = true; setIsAnimating(false); }
  };

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

    const result: { name: string; value: number; fill: string }[] = [];
    let otherCount = 0;
    
    Object.entries(rawCounts).forEach(([name, value], index) => {
      if (value / totalItems < 0.05) otherCount += value; 
      else result.push({ name, value, fill: COLORS[index % COLORS.length] }); 
    });
    
    if (otherCount > 0) result.push({ name: 'Other', value: otherCount, fill: '#64748b' });
    return result.sort((a, b) => b.value - a.value);
  }, [library]);

  const recentItems = useMemo(() => {
    return [...library]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [library]);

  const activeItem = activeIndex >= 0 ? typeData[activeIndex] : null;

  return (
    <div className="space-y-6 p-6 h-full overflow-y-auto [scrollbar-gutter:stable]">
      <h1 className="text-2xl font-bold text-white">Statistics & Overview</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <h3 className="text-slate-400 text-sm font-medium uppercase">Total Items</h3>
          <p className="text-3xl font-bold text-white mt-1">{library.length}</p>
        </Card>
        <Card>
          <h3 className="text-slate-400 text-sm font-medium uppercase">In Progress</h3>
          <p className="text-3xl font-bold text-osmanthus-400 mt-1">{statusCounts['In Progress'] || 0}</p>
        </Card>
        <Card>
          <h3 className="text-slate-400 text-sm font-medium uppercase">Completed</h3>
          <p className="text-3xl font-bold text-emerald-400 mt-1">{statusCounts['Completed'] || 0}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* CHART */}
        <Card className="flex flex-col h-full min-h-[400px]">
          <h2 className="text-xl font-semibold mb-4 text-white">Distribution by Format</h2>
          <div className={`flex-1 w-full h-full min-h-[250px] relative ${isAnimating ? 'pointer-events-none' : ''}`}>
            {typeData.length > 0 ? (
              <>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 select-none">
                  {activeItem ? (
                    <div className="text-center animate-in fade-in zoom-in duration-200">
                      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{activeItem.name}</p>
                      <div className="flex items-baseline justify-center gap-1"><p className="text-4xl font-bold text-white">{activeItem.value}</p></div>
                      <p className="text-sm font-semibold text-emerald-400 mt-1 bg-emerald-400/10 px-2 py-0.5 rounded-full">{((activeItem.value / library.length) * 100).toFixed(1)}%</p>
                    </div>
                  ) : (
                    <div className="text-center text-slate-600"><p className="text-xs uppercase tracking-widest mb-1">Total</p><p className="text-3xl font-bold text-slate-200">{library.length}</p></div>
                  )}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={typeData} dataKey="value" cx="50%" cy="50%" innerRadius={95} outerRadius={115} paddingAngle={2} activeIndex={activeIndex} activeShape={renderActiveShape} isAnimationActive={isAnimating} animationDuration={1000} animationBegin={0} onAnimationEnd={handleAnimationEnd} style={{ pointerEvents: 'none' }}>
                      {typeData.map((entry, index) => (<Cell key={`visual-cell-${index}`} fill={entry.fill} stroke={BG_COLOR} strokeWidth={2} fillOpacity={activeIndex === -1 || activeIndex === index ? 1 : 0.1} style={{ transition: 'fill-opacity 0.3s' }}/>))}
                    </Pie>
                    <Pie data={typeData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={120} stroke="none" fill="red" opacity={0} onMouseEnter={(_, index) => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(-1)} isAnimationActive={false} style={{ cursor: 'pointer' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500 text-sm">No data available</div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 border-t border-slate-700 pt-4">
            {typeData.map((entry, index) => (
              <div key={entry.name} className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 cursor-pointer ${activeIndex === -1 || activeIndex === index ? 'opacity-100 scale-105' : 'opacity-30 blur-[1px]'}`} onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(-1)}>
                <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.fill }} />
                <span className="text-slate-300 capitalize">{entry.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* LIST */}
        <Card className="flex flex-col h-full">
          <h2 className="text-xl font-semibold mb-4 text-white">Recently Updated</h2>
          <div className="space-y-2 flex-1 overflow-y-auto pr-2 [scrollbar-width:thin]">
            {recentItems.map(item => (
              <div key={item.id} className="flex items-center p-2 hover:bg-slate-700/50 rounded-md transition cursor-default">
                <div className="h-10 w-8 bg-slate-600 rounded overflow-hidden mr-3 flex-shrink-0">
                  {item.coverUrl ? <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">N/A</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm truncate">{item.title}</h4>
                  <p className="text-xs text-slate-400 truncate">{item.type} • {item.status}</p>
                </div>
                <div className="text-xs text-slate-500 ml-2 whitespace-nowrap font-mono">{new Date(item.updatedAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};