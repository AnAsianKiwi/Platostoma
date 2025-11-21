
import React from 'react';
import { MediaItem } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardProps {
  library: MediaItem[];
  onNavigateToLibrary: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const Dashboard: React.FC<DashboardProps> = ({ library, onNavigateToLibrary }) => {
  const statusCounts = library.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeCounts = library.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 p-6 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold text-white">Statistics & Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm">
          <h3 className="text-slate-400 text-sm font-medium uppercase">Total Items</h3>
          <p className="text-3xl font-bold text-white mt-1">{library.length}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm">
          <h3 className="text-slate-400 text-sm font-medium uppercase">In Progress</h3>
          <p className="text-3xl font-bold text-osmanthus-400 mt-1">
            {statusCounts['In Progress'] || 0}
          </p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm">
          <h3 className="text-slate-400 text-sm font-medium uppercase">Completed</h3>
          <p className="text-3xl font-bold text-emerald-400 mt-1">
            {statusCounts['Completed'] || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 flex flex-col h-full">
          <h2 className="text-xl font-semibold mb-4 text-white">Distribution by Format</h2>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={false}
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                   itemStyle={{ color: '#f8fafc' }}
                />
                <Legend iconType="square" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

       <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 flex flex-col h-full">
          <h2 className="text-xl font-semibold mb-4 text-white">Recently Updated</h2>
          <div className="space-y-2 flex-1">
            {library.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center p-2 hover:bg-slate-700/50 rounded-md transition cursor-pointer">
                <div className="h-10 w-8 bg-slate-600 rounded overflow-hidden mr-3 flex-shrink-0">
                  {item.coverUrl ? (
                    <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center bg-slate-700 text-[8px] text-slate-400 text-center leading-none p-0.5">
                       No Img
                     </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm truncate">{item.title}</h4>
                  <p className="text-xs text-slate-400 truncate">{item.type} • {item.status}</p>
                </div>
                <div className="text-xs text-slate-500 ml-2 whitespace-nowrap">
                  {new Date(item.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {library.length === 0 && <p className="text-slate-500 text-sm">No items yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
