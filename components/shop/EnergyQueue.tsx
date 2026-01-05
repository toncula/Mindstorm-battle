//unused ui footprint for energy queue 
import React from 'react';
import { EnergyType } from '../../types';

interface EnergyQueueProps {
    queue: EnergyType[];
}

const getEnergyColor = (type: EnergyType) => {
    switch (type) {
        case EnergyType.WHITE: return 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] border-slate-200';
        case EnergyType.RED: return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] border-red-300';
        case EnergyType.GREEN: return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] border-emerald-300';
        case EnergyType.BLUE: return 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] border-blue-300';
        case EnergyType.BLACK: return 'bg-slate-900 shadow-[0_0_15px_rgba(2,6,23,0.8)] border-slate-600';
        default: return 'bg-slate-500';
    }
};

const EnergyQueue: React.FC<EnergyQueueProps> = ({ queue }) => {
    const safeQueue = queue || [];

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">
            <div className="text-white text-xs font-bold uppercase tracking-widest mb-2 drop-shadow-md bg-black/80 px-3 py-1.5 rounded border border-white/20">
                Energy Queue ({safeQueue.length})
            </div>

            <div className="relative h-20 flex items-center bg-slate-950/80 backdrop-blur-xl rounded-full px-6 border-2 border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.5)] min-w-[140px]">
                {/* 轨道背景线 */}
                <div className="absolute inset-x-4 top-1/2 h-1.5 bg-white/10 rounded-full" />

                <div className="flex items-center justify-end relative w-full h-full pr-2">
                    {safeQueue.length === 0 && (
                        <span className="text-white/40 text-sm font-mono font-bold animate-pulse">EMPTY</span>
                    )}

                    {safeQueue.map((type, index) => (
                        <div
                            key={index}
                            className={`
                    w-12 h-12 rounded-full border-4 shrink-0 transition-all duration-500 transform
                    ${getEnergyColor(type)}
                `}
                            style={{
                                // 负 margin 实现重叠
                                marginLeft: index === 0 ? 0 : '-20px',
                                zIndex: index,
                                boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EnergyQueue;