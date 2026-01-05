import React from 'react';
import { Trophy, Heart, TrendingUp, ArrowRight, RefreshCw, Sparkles, Skull } from 'lucide-react';
import { RoundSummary, EnergyType, EnergyConfig } from '../../types';

interface RoundOverScreenProps {
    summary: RoundSummary;
    t: any;
    onNextRound: (e: React.MouseEvent) => void;
}

const RoundOverScreen: React.FC<RoundOverScreenProps> = ({ summary, t, onNextRound }) => {
    const isVictory = summary.winner === 'PLAYER';

    const renderEnergyBalls = (queue: EnergyConfig[]) => {
        if (!queue) return null;
        return (
            <div className="flex -space-x-1.5 flex-wrap justify-end max-w-[200px]">
                {queue.map((Config, i) => (
                    <div
                        key={i}
                        className={`w-4 h-4 rounded-full border border-slate-300 shadow-sm shrink-0 mb-1 ${Config.type === EnergyType.WHITE ? 'bg-white' :
                                Config.type === EnergyType.RED ? 'bg-red-500' :
                                    Config.type === EnergyType.GREEN ? 'bg-emerald-500' :
                                        Config.type === EnergyType.BLUE ? 'bg-blue-500' : 'bg-slate-500'
                            }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`
          relative w-full max-w-md p-0 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center pointer-events-auto
          ${isVictory ? 'shadow-[0_0_50px_rgba(234,179,8,0.3)]' : 'shadow-[0_0_50px_rgba(220,38,38,0.3)]'}
          border-2 ${isVictory ? 'border-yellow-500/50' : 'border-red-500/50'}
      `}>
                {/* Header Background */}
                <div className={`absolute top-0 inset-x-0 h-48 bg-gradient-to-b ${isVictory ? 'from-yellow-900/60 via-yellow-900/20' : 'from-red-900/60 via-red-900/20'} to-slate-900 pointer-events-none`} />

                <div className="relative z-10 w-full flex flex-col items-center pt-10 pb-6 px-8">
                    {/* Icon */}
                    <div className={`mb-4 relative ${isVictory ? 'text-yellow-400' : 'text-red-500'}`}>
                        <div className={`absolute inset-0 blur-2xl opacity-50 ${isVictory ? 'bg-yellow-500' : 'bg-red-500'} rounded-full`} />
                        {isVictory ? (
                            <Trophy size={80} className="relative z-10 drop-shadow-lg animate-[bounce_1s_infinite]" />
                        ) : (
                            <Skull size={80} className="relative z-10 drop-shadow-lg animate-pulse" />
                        )}
                    </div>

                    {/* Title */}
                    <h2 className={`text-4xl font-black uppercase tracking-tighter mb-2 text-center drop-shadow-md
                  ${isVictory
                            ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-amber-600'
                            : 'text-red-500'}
              `}>
                        {isVictory ? t.ui.round_victory : t.ui.round_defeat}
                    </h2>

                    <div className="flex items-center gap-2 mb-6 opacity-80">
                        <div className={`h-px w-8 ${isVictory ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        <p className={`text-xs font-bold uppercase tracking-[0.2em] ${isVictory ? 'text-yellow-200' : 'text-red-200'}`}>
                            {t.ui.round_complete}
                        </p>
                        <div className={`h-px w-8 ${isVictory ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    </div>

                    {/* Stats Card */}
                    <div className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                        {/* Damage Taken (If Defeat) */}
                        {!isVictory && summary.damageTaken > 0 && (
                            <div className="p-4 bg-red-950/30 border-b border-red-900/30 flex justify-between items-center">
                                <span className="text-xs font-bold text-red-300 uppercase tracking-wide">{t.ui.damage_taken}</span>
                                <span className="font-black text-xl text-red-500 flex items-center gap-1">
                                    -{summary.damageTaken} <Heart size={18} fill="currentColor" />
                                </span>
                            </div>
                        )}

                        {/* Rewards Section */}
                        <div className="p-5 space-y-4">
                            {/* Base Income Display */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t.ui.income}</span>
                                <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 min-h-[36px]">
                                    {/* Fallback to empty array if undefined to prevent crash */}
                                    {renderEnergyBalls(summary.baseIncome || [])}
                                </div>
                            </div>

                            {/* Bonus Income Display */}
                            {summary.effectGold > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-green-400 uppercase tracking-wide">Bonus Energy</span>
                                    <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-green-900/30">
                                        <span className="text-xs text-green-400 font-bold mr-1">+{summary.effectGold}</span>
                                        <div className="w-3 h-3 rounded-full bg-white border border-slate-300" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Effects Section */}
                        {summary.effects.length > 0 && (
                            <div className="bg-slate-950/50 p-4 border-t border-slate-800">
                                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                                    <Sparkles size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{t.ui.round_effects}</span>
                                </div>
                                <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-2">
                                    {summary.effects.map((eff, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900/50 p-1.5 rounded border border-slate-800/50">
                                            <TrendingUp size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                                            <span className="leading-tight">{eff}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <div className="w-full p-8 pt-0 z-20">
                    <button
                        onClick={onNextRound}
                        className={`
                      w-full group py-4 rounded-xl font-black text-sm uppercase tracking-[0.15em] shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-white/10 relative overflow-hidden cursor-pointer pointer-events-auto
                      ${isVictory
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'}
                  `}
                    >
                        {isVictory && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />}

                        {isVictory ? (
                            <>
                                <span>{t.ui.next_round}</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        ) : (
                            <>
                                <span>{t.ui.retry_round}</span>
                                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                            </>
                        )}
                    </button>
                </div>

                <div className="absolute inset-0 bg-slate-900 -z-10" />
            </div>
        </div>
    );
};

export default RoundOverScreen;