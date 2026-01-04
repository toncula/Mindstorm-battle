import React, { useState, useEffect, useRef } from 'react';
import { CardData, UnitType } from '../../../types';
import { Sword, Shield, Zap, Compass, Sparkles, Crosshair, Circle, Activity, Bomb, Crown, CheckCircle2 } from 'lucide-react';
import {
    getEffectiveStats,
    BUY_ANIM_DURATION,
    GROWTH_ANIM_DURATION,
    RECENT_PURCHASE_WINDOW,
    SHAKE_ANIM_DURATION,
    FLASH_ANIM_DURATION
} from '../../../constants';
import { Language, getTranslation, getCardText, getEffectText } from '../../../translations';
import { playSound } from '../../../services/audioService';

interface UnitCardProps {
    card: CardData;
    location: 'SHOP' | 'HAND' | 'DISCOVERY';
    language: Language;
    variant?: 'default' | 'enemy';
    readOnly?: boolean;
    canAfford?: boolean;
    onBuy?: (card: CardData) => void;
    onSell?: (card: CardData) => void;
    onHover?: (card: CardData, rect: DOMRect) => void;
    onLeave?: () => void;
    onSelect?: (card: CardData) => void;
    // New props for cost preview
    onCostMouseEnter?: () => void;
    onCostMouseLeave?: () => void;
}

const getUnitIcon = (type: UnitType) => {
    switch (type) {
        case UnitType.MELEE: return <Sword className="absolute -right-2 -bottom-4 opacity-20 text-white transform rotate-12" size={80} />;
        case UnitType.RANGED: return <Crosshair className="absolute -right-4 -bottom-4 opacity-20 text-white transform -rotate-12" size={80} />;
        case UnitType.BUFFER: return <Activity className="absolute -right-2 -bottom-2 opacity-20 text-white" size={80} />;
        case UnitType.SPLASHER: return <Bomb className="absolute -right-2 -bottom-2 opacity-20 text-white transform -rotate-12" size={80} />;
        case UnitType.HERO: return <Crown className="absolute -right-2 -bottom-2 opacity-20 text-yellow-500 transform rotate-0" size={80} />;
        default: return <Circle className="absolute right-0 bottom-0 opacity-10" size={64} />;
    }
}

const UnitCard: React.FC<UnitCardProps> = ({
    card,
    location,
    language,
    variant = 'default',
    readOnly = false,
    canAfford,
    onBuy,
    onSell,
    onHover,
    onLeave,
    onSelect,
    onCostMouseEnter,
    onCostMouseLeave
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [growthAnim, setGrowthAnim] = useState<{ val: number; key: number } | null>(null);
    const [buyAnim, setBuyAnim] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [flash, setFlash] = useState(false);

    const prevCountRef = useRef(card.unitCount);

    const stats = getEffectiveStats(card);
    const t = getTranslation(language);
    const cardText = getCardText(card, language);
    const effectText = card.specialEffect ? getEffectText(card.specialEffect, language) : null;

    const isMeleeRange = stats.range <= 30;
    const isGolden = card.isGolden;

    const isEnemy = variant === 'enemy';

    useEffect(() => {
        if (card.justBought && (Date.now() - card.justBought < RECENT_PURCHASE_WINDOW) && location === 'HAND') {
            setBuyAnim(true);
            setTimeout(() => playSound('pop'), 100);
            const timer = setTimeout(() => setBuyAnim(false), BUY_ANIM_DURATION);
            return () => clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        if (!readOnly && card.unitCount > prevCountRef.current) {
            const diff = card.unitCount - prevCountRef.current;
            const now = Date.now();

            setGrowthAnim({ val: diff, key: now });
            setIsShaking(true);
            setFlash(true);

            setTimeout(() => playSound('pop'), Math.random() * 200);

            const shakeTimer = setTimeout(() => setIsShaking(false), SHAKE_ANIM_DURATION);
            const flashTimer = setTimeout(() => setFlash(false), FLASH_ANIM_DURATION);
            const animTimer = setTimeout(() => setGrowthAnim(null), GROWTH_ANIM_DURATION);

            return () => {
                clearTimeout(shakeTimer);
                clearTimeout(flashTimer);
                clearTimeout(animTimer);
            };
        }
        prevCountRef.current = card.unitCount;
    }, [card.unitCount, readOnly]);

    let borderClasses = "";
    if (variant === 'enemy') {
        borderClasses = "bg-red-950/40 border-red-900/50 hover:border-red-500 shadow-red-900/20";
    } else if (isGolden) {
        borderClasses = "bg-gradient-to-br from-amber-900/80 to-yellow-900/80 border-yellow-400 shadow-yellow-500/30 hover:shadow-yellow-500/50 hover:border-yellow-200 ring-2 ring-yellow-500/20";
    } else if (location === 'SHOP') {
        borderClasses = "bg-slate-800 border-slate-600 hover:border-blue-400";
    } else {
        borderClasses = "bg-slate-700 border-slate-500 hover:border-yellow-400";
    }

    const particles = React.useMemo(() => {
        if (!growthAnim) return [];
        return Array.from({ length: 12 }).map((_, i) => {
            const angle = (Math.PI * 2 * i) / 12;
            const dist = 60 + Math.random() * 30;
            return {
                x: Math.cos(angle) * dist + 'px',
                y: Math.sin(angle) * dist + 'px',
                delay: Math.random() * 0.2 + 's',
                color: ['#4ade80', '#a3e635', '#ffffff'][Math.floor(Math.random() * 3)]
            };
        });
    }, [growthAnim]);

    return (
        <div
            className={`relative w-48 h-64 rounded-xl border-2 transition-all duration-300 flex flex-col overflow-hidden group select-none
        ${borderClasses}
        ${isHovered ? 'shadow-2xl scale-105 z-10' : 'shadow-md'}
        ${location === 'HAND' ? 'cursor-default' : ''}
        ${isShaking ? 'animate-[shake_0.3s_ease-in-out]' : ''}
        ${buyAnim ? 'ring-4 ring-cyan-400 ring-opacity-50 scale-105' : ''}
      `}
            onMouseEnter={(e) => {
                setIsHovered(true);
                playSound('hover');
                onHover?.(card, e.currentTarget.getBoundingClientRect());
            }}
            onMouseLeave={() => {
                setIsHovered(false);
                onLeave?.();
            }}
        >
            <div className={`absolute inset-0 bg-green-400 z-40 pointer-events-none transition-opacity duration-200 mix-blend-overlay ${flash ? 'opacity-60' : 'opacity-0'}`} />

            {buyAnim && (
                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden rounded-xl">
                    <div className="absolute inset-0 bg-cyan-500/20 animate-pulse" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-cyan-400/30 blur-2xl rounded-full" />
                    <div className="relative z-10 flex flex-col items-center animate-[uc-pop-up_0.5s_ease-out_forwards]">
                        <CheckCircle2 className="text-cyan-200 w-16 h-16 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] mb-2" />
                        <span className="text-2xl font-black text-white tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ textShadow: '0 0 10px #06b6d4' }}>
                            {t.ui.recruited}
                        </span>
                    </div>
                </div>
            )}

            {growthAnim && !buyAnim && (
                <div key={growthAnim.key} className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                    <div className="relative flex items-center justify-center">
                        <div className="absolute w-32 h-32 bg-green-500/30 rounded-full blur-xl animate-pulse" />
                        {particles.map((p, i) => (
                            <div
                                key={i}
                                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                                style={{
                                    backgroundColor: p.color,
                                    '--tx': p.x,
                                    '--ty': p.y,
                                    animation: `uc-particle 0.5s ease-out forwards ${p.delay}`,
                                    boxShadow: `0 0 6px ${p.color}`
                                } as React.CSSProperties}
                            />
                        ))}
                        <div
                            className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-green-400 tracking-tighter relative z-10"
                            style={{
                                textShadow: '0 4px 8px rgba(0,0,0,0.5), 0 0 20px rgba(74, 222, 128, 0.8)',
                                filter: 'drop-shadow(0 2px 0px #14532d)',
                                animation: 'uc-pop-up 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
                            }}
                        >
                            +{growthAnim.val}
                        </div>
                    </div>
                </div>
            )}

            {isGolden && (
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-xl">
                    <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] animate-[shimmer_3s_infinite]" />
                </div>
            )}

            <div
                className="h-28 w-full relative p-3 flex flex-col justify-between overflow-hidden"
                style={{
                    background: variant === 'enemy'
                        ? `linear-gradient(135deg, #450a0a 0%, #000000 100%)`
                        : isGolden
                            ? `linear-gradient(135deg, ${stats.color} 0%, #ca8a04 100%)`
                            : `linear-gradient(135deg, ${stats.color} 0%, #0f172a 100%)`
                }}
            >
                {getUnitIcon(stats.unitType)}
                <div className="flex justify-between items-start z-10">
                    {variant !== 'enemy' && card.tier > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded backdrop-blur-sm font-bold border border-white/20 shadow-sm
                    ${card.tier === 1 ? 'bg-slate-800/60 text-slate-200' : card.tier === 2 ? 'bg-blue-900/60 text-blue-100' : 'bg-amber-900/60 text-amber-100'}
                `}>
                            {t.ui.tier} {card.tier}
                        </span>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded backdrop-blur-sm border border-white/20 transition-all duration-300 ${growthAnim ? 'bg-green-500 text-white font-bold scale-125 shadow-[0_0_10px_#22c55e]' : 'bg-black/40 text-white'}`}>
                        x{card.unitCount}
                    </span>
                </div>
                <div className="text-white font-bold text-lg drop-shadow-md text-center leading-tight z-10 relative flex flex-col items-center">
                    {isGolden && <span className="text-[10px] text-yellow-100 font-bold uppercase tracking-widest mb-1 drop-shadow-sm flex items-center gap-1 bg-yellow-600/50 px-2 py-0.5 rounded-full border border-yellow-400/30"><Sparkles size={10} /> {t.ui.golden}</span>}
                    <span className="drop-shadow-lg filter">{cardText.name}</span>
                </div>
            </div>

            <div className={`flex-1 p-2 flex flex-col text-slate-200 relative ${!readOnly ? 'pb-10' : ''} bg-slate-900/95 backdrop-blur-sm z-10`}>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                    <div className="flex items-center gap-1.5 bg-slate-800/50 rounded px-1.5 py-1 border border-slate-700/50" title={t.ui.damage}>
                        <Sword size={12} className="text-red-400" />
                        <span className="font-bold text-xs text-red-100">{stats.damage}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-800/50 rounded px-1.5 py-1 border border-slate-700/50" title={t.ui.hp}>
                        <Shield size={12} className="text-green-400" />
                        <span className="font-bold text-xs text-green-100">{stats.hp}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-800/50 rounded px-1.5 py-1 border border-slate-700/50" title={isMeleeRange ? t.ui.melee_weapon_tooltip : t.ui.range}>
                        <Crosshair size={12} className="text-blue-400" />
                        <span className="font-bold text-xs text-blue-100">
                            {isMeleeRange ? t.ui.melee : stats.range}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-800/50 rounded px-1.5 py-1 border border-slate-700/50" title={t.ui.attack_speed}>
                        <Zap size={12} className="text-yellow-400" />
                        <span className="font-bold text-xs text-yellow-100">{stats.attackInterval.toFixed(1)}{t.ui.sec}</span>
                    </div>
                </div>

                {card.specialEffect && (
                    <div className="mb-1 bg-purple-900/30 border border-purple-500/30 rounded px-1.5 py-0.5 flex items-center gap-1">
                        <Sparkles size={10} className="text-purple-400" />
                        <span className="text-[10px] font-bold text-purple-200 truncate">{effectText?.name}</span>
                    </div>
                )}

                {card.traits.length > 0 && (
                    <div className="flex-1 overflow-hidden flex flex-col relative">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-0.5 px-0.5 border-b border-slate-700/50 flex justify-between">
                            <span>{t.ui.active_upgrades}</span>
                            <span className={card.traits.length > 0 ? 'text-blue-400' : 'text-slate-600'}>{card.traits.length}</span>
                        </div>

                        <div className="overflow-y-auto overflow-x-hidden scrollbar-none pr-1 space-y-0.5 mask-linear-fade">
                            {card.traits.map((t, i) => {
                                const colorClass = t.rarity === 'LEGENDARY' ? 'text-amber-400' : t.rarity === 'RARE' ? 'text-blue-300' : 'text-slate-300';
                                return (
                                    <div key={i} className={`text-[10px] truncate ${colorClass} flex items-center gap-1`}>
                                        <div className={`w-1 h-1 rounded-full ${t.rarity === 'LEGENDARY' ? 'bg-amber-500' : t.rarity === 'RARE' ? 'bg-blue-500' : 'bg-slate-500'}`} />
                                        {t.name}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {!readOnly && (
                    <div className="absolute bottom-2 left-2 right-2 z-30">
                        {location === 'SHOP' && (
                            <button
                                onClick={() => onBuy?.(card)}
                                onMouseEnter={() => onCostMouseEnter?.()}
                                onMouseLeave={() => onCostMouseLeave?.()}
                                disabled={!canAfford}
                                className={`w-full py-1.5 rounded font-bold text-sm transition-all border shadow-lg active:scale-95 flex items-center justify-center gap-1
                            ${canAfford
                                        ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-yellow-50 border-yellow-400 shadow-yellow-900/40'
                                        : 'bg-slate-700 text-slate-500 border-slate-600 cursor-not-allowed'}
                        `}
                            >
                                {/* Display Cost in Energy Balls logic (Simplified for now as White * 3) */}
                                <div className="flex -space-x-1">
                                    <div className="w-3 h-3 rounded-full bg-white border border-slate-300" />
                                    <div className="w-3 h-3 rounded-full bg-white border border-slate-300" />
                                    <div className="w-3 h-3 rounded-full bg-white border border-slate-300" />
                                </div>
                            </button>
                        )}

                        {location === 'HAND' && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onSell?.(card)}
                                    className="w-full px-2 py-1.5 bg-red-900/30 hover:bg-red-800/80 text-red-200 rounded font-bold text-xs transition-colors border border-red-800/50 active:scale-95"
                                    title={t.ui.sell_hint}
                                >
                                    {t.ui.sell}
                                </button>
                            </div>
                        )}

                        {location === 'DISCOVERY' && (
                            <button
                                onClick={() => onSelect?.(card)}
                                className={`w-full py-1.5 rounded font-bold text-sm transition-all border shadow-lg active:scale-95 bg-blue-600 hover:bg-blue-500 border-blue-400 text-white`}
                            >
                                {t.ui.select}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UnitCard;