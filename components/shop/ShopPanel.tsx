import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { PlayerState, CardData, EnergyType, EnergyUnit } from '../../types';
import { RefreshCw, ArrowUpCircle, Lock, Unlock, Eye, EyeOff, Swords, Zap } from 'lucide-react';
import UnitCard from './cards/UnitCard';
import { tryPayEnergy,getUsedIndices } from '../../simulation/energyEngine';
import { playSound } from '../../services/audioService';
import { createEnergyRequest, createSimpleCost } from '@/simulation/energyHelpers';

interface ShopPanelProps {
    player: PlayerState;
    shopCards: CardData[];
    isShopLocked: boolean;
    shopViewMode: 'SHOP' | 'INTEL';
    isTransitioning: boolean;
    nextEnemies: CardData[];
    t: any;
    language: string;
    refreshCost: number | EnergyType[];
    onLevelUpTavern: () => void;
    onToggleLock: () => void;
    onRefreshShop: () => void;
    onToggleViewMode: () => void;
    onStartCombat: () => void;
    onBuyCard: (card: CardData) => void;
    onCardHover: (card: CardData, rect: DOMRect) => void;
    onCardLeave: () => void;
}

interface VisualEnergyNode extends EnergyUnit {
    isNew?: boolean;     // 标记：这是一个刚产生的新球（触发入场动画）
    isLeaving?: boolean; // 标记：这是一个即将消失的球（触发出场动画，可选）
}

const EnergyBallItem: React.FC<{
    node: VisualEnergyNode; // 使用新类型
    index: number;
    total: number;
    getStyle: (t: EnergyType) => string;
    isHighlighted?: boolean; // 新增：是否被高亮（预览消耗）
}> = ({ node, index, total, getStyle, isHighlighted }) => {
    // 动画状态：如果是新球，先设为未挂载(mounted=false)，等待下一帧激活
    const [mounted, setMounted] = useState(!node.isNew);

    useLayoutEffect(() => {
        if (node.isNew && !mounted) {
            const frame = requestAnimationFrame(() => {
                setMounted(true); // 触发入场动画
            });
            return () => cancelAnimationFrame(frame);
        }
    }, [node.isNew, mounted]);

    const isFirst = index === 0;
    const baseMargin = isFirst ? 0 : -18; // 重叠效果

    return (
        <div
            className={`
                rounded-full border-[3px] shrink-0 h-12 w-12
                transition-all duration-300 ease-out 
                ${getStyle(node.type)}
                // 核心动画类：控制显隐
                ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-0 border-0 w-0'}
            `}
            style={{
                marginLeft: mounted ? `${baseMargin}px` : '0px',
                zIndex: index,
                // 预览跳动逻辑
                transform: isHighlighted
                    ? `scale(${1 + (index / total) * 0.05}) translateY(-24px)`
                    : `scale(${1 + (index / total) * 0.05})`,
                boxShadow: mounted ? '0 4px 6px rgba(0,0,0,0.3)' : 'none'
            }}
        />
    );
};

const ShopPanel: React.FC<ShopPanelProps> = ({
    player, shopCards, isShopLocked, shopViewMode, isTransitioning, nextEnemies,
    t, language, refreshCost,
    onLevelUpTavern, onToggleLock, onRefreshShop, onToggleViewMode,
    onStartCombat, onBuyCard, onCardHover, onCardLeave
}) => {

    const [visualQueue, setVisualQueue] = useState<VisualEnergyNode[]>([]);
    const [previewIndices, setPreviewIndices] = useState<number[]>([]);// 用于存储哪几个球要跳动
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            // 初始化
            const initialNodes = player.energyQueue.map(unit => ({
                ...unit,
                isNew: false
            }));
            setVisualQueue(initialNodes);
            isInitialMount.current = false;
            return;
        }

        let timeoutId: NodeJS.Timeout;

        const processQueue = () => {
            setVisualQueue(current => {
                const targetQueue = player.energyQueue;
                // A. 快速检查：如果 ID 序列完全一致，无需更新
                if (current.length === targetQueue.length) {
                    const currentIds = current.map(n => n.id).join(',');
                    const targetIds = targetQueue.map(n => n.id).join(',');
                    if (currentIds === targetIds) return current;
                }

                let next = [...current];
                let shouldPlayPop = false;
                let shouldPlayClick = false;
                // B. Diff 算法
                // B1. 优先处理删除 (消费)
                // 找到 visualQueue 中存在，但在 player.energyQueue 中已消失的球
                const removedIndex = current.findIndex(c => !targetQueue.find(t => t.id === c.id));

                if (removedIndex !== -1) {
                    next.splice(removedIndex, 1); // 移除该球
                    shouldPlayClick = true;       // 标记播放音效
                } else {
                    // B2. 处理新增 (获得)
                    // 找到 player.energyQueue 中存在，但在 visualQueue 中没有的球
                    // 这里简化处理：假设新球总是加在末尾 (符合目前逻辑)
                    const nextTargetUnit = targetQueue.find(t => !current.find(c => c.id === t.id));

                    if (nextTargetUnit) {
                        next.push({
                            ...nextTargetUnit,
                            isNew: true // 标记为新球，触发 EnergyBallItem 的入场动画
                        });
                        shouldPlayPop = true;
                    } else {
                        // 兜底：如果长度不同但找不到具体差异，直接强制同步
                        return targetQueue.map(u => ({ ...u, isNew: false }));
                    }
                }
                if (shouldPlayClick) playSound('click');
                else if (shouldPlayPop) playSound('pop');

                timeoutId = setTimeout(processQueue, 100);
                return next;
            });
        };

        timeoutId = setTimeout(processQueue, 0);
        return () => clearTimeout(timeoutId);
    }, [player.energyQueue]);

    const getCostRequest = (cost: number | EnergyType[]) => {
        return Array.isArray(cost) ? cost : createEnergyRequest(EnergyType.WHITE, cost);
    };

    const canAfford = (cost: number) => {
        return tryPayEnergy(createSimpleCost(EnergyType.WHITE,cost), player.energyQueue).success;
    };

    // 计算预览索引
    const handlePreviewCost = (cost: number) => {
        const req = Array.isArray(cost) ? cost : createSimpleCost(EnergyType.WHITE, cost);
        // 使用引擎计算将会消耗哪些球的索引
        const indices = getUsedIndices(req, player.energyQueue);
        if (indices) {
            setPreviewIndices(indices);
        }
    };

    const clearPreview = () => {
        setPreviewIndices([]);
    };

    const canAffordUpgrade = canAfford(player.tavernUpgradeCost);
    const canAffordRefresh = canAfford(refreshCost);
    const canAffordUnit = canAfford(3);
    const isMaxTier = player.tavernTier >= 4;

    const renderCostBalls = (cost: number | EnergyType[]) => {
        const costArray = Array.isArray(cost) ? cost : Array(cost).fill(EnergyType.WHITE);
        return (
            <div className="flex -space-x-1.5 items-center">
                {costArray.map((type, i) => (
                    <div
                        key={i}
                        className={`w-3.5 h-3.5 rounded-full border border-slate-400 shadow-sm shrink-0 ${type === EnergyType.WHITE ? 'bg-white' :
                            type === EnergyType.RED ? 'bg-red-500' :
                                type === EnergyType.GREEN ? 'bg-emerald-500' :
                                    type === EnergyType.BLUE ? 'bg-blue-500' : 'bg-slate-500'
                            }`}
                        style={{ zIndex: i }}
                    />
                ))}
            </div>
        );
    };

    const getQueueBallStyle = (type: EnergyType) => {
        switch (type) {
            case EnergyType.WHITE: return 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.9)] border-slate-100';
            case EnergyType.RED: return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.9)] border-red-400';
            case EnergyType.GREEN: return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.9)] border-emerald-400';
            case EnergyType.BLUE: return 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.9)] border-blue-400';
            case EnergyType.BLACK: return 'bg-slate-950 shadow-[0_0_15px_rgba(2,6,23,0.9)] border-slate-600';
            default: return 'bg-slate-400';
        }
    };

    // --- Dynamic Width Calculation for Retention Box ---
    const retentionCount = Math.max(1, player.energyRetention);
    const retentionBoxWidth = 48 + (retentionCount - 1) * 30 + 24;

    return (
        <div className="flex-1 flex flex-col relative z-10 min-h-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
            {/* Header Controls */}
            <div className="flex items-center justify-between px-6 py-3 bg-slate-950/50 border-b border-slate-800 shrink-0 gap-4 shadow-lg z-20">

                {/* Left: Tavern Tech Level */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-slate-900 p-1.5 pr-4 rounded-xl border border-slate-800 shadow-inner group hover:border-slate-700 transition-colors">
                        <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg text-2xl font-black text-blue-400 shadow-lg border border-slate-700 relative overflow-hidden">
                            <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors" />
                            {player.tavernTier}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1.5">
                                {t.ui.tier}
                            </span>

                            <button
                                onClick={onLevelUpTavern}
                                disabled={isMaxTier || !canAffordUpgrade}
                                onMouseEnter={() => !isMaxTier && handlePreviewCost(player.tavernUpgradeCost)}
                                onMouseLeave={clearPreview}
                                className={`
                            flex items-center gap-2 px-3 py-1 rounded text-xs font-bold transition-all border
                            ${isMaxTier
                                        ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-default'
                                        : canAffordUpgrade
                                            ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-900/20 active:translate-y-0.5'
                                            : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-70'}
                        `}
                            >
                                {isMaxTier ? (
                                    <span>MAX</span>
                                ) : (
                                    <>
                                        <ArrowUpCircle size={14} />
                                        <span>{t.ui.upgrade}</span>
                                        <div className="ml-1 pl-2 border-l border-white/20 flex items-center gap-1">
                                            {renderCostBalls(player.tavernUpgradeCost)}
                                        </div>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Center: Action Buttons */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onRefreshShop}
                        disabled={!canAffordRefresh}
                        onMouseEnter={() => handlePreviewCost(refreshCost)}
                        onMouseLeave={clearPreview}
                        className={`
                    flex items-center gap-3 px-5 py-2.5 rounded-xl font-bold text-sm transition-all border shadow-lg active:scale-95
                    ${canAffordRefresh
                                ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600 hover:border-slate-500 shadow-black/20'
                                : 'bg-slate-900 text-slate-700 border-slate-800 cursor-not-allowed'}
                `}
                        title={t.ui.refresh_shop}
                    >
                        <div className="flex items-center gap-2">
                            <RefreshCw size={18} className={canAffordRefresh ? "group-hover:rotate-180 transition-transform duration-500" : ""} />
                            <span>{t.ui.refresh}</span>
                        </div>
                        <div className="bg-slate-950/80 px-2 py-1 rounded-md flex items-center gap-1 border border-white/10 shadow-inner">
                            {renderCostBalls(refreshCost)}
                        </div>
                    </button>

                    <button
                        onClick={onToggleLock}
                        className={`
                    p-2.5 rounded-xl border transition-all active:scale-95 shadow-lg
                    ${isShopLocked
                                ? 'bg-amber-950/50 border-amber-600/50 text-amber-500 hover:bg-amber-900/60 shadow-amber-900/10'
                                : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500'}
                `}
                        title={isShopLocked ? t.ui.shop_locked : t.ui.shop_unlocked}
                    >
                        {isShopLocked ? <Lock size={20} /> : <Unlock size={20} />}
                    </button>
                </div>

                {/* Right: Intel & Combat */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onToggleViewMode}
                        className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border
                    ${shopViewMode === 'INTEL'
                                ? 'bg-purple-900/40 text-purple-200 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}
                `}
                    >
                        {shopViewMode === 'INTEL' ? <EyeOff size={16} /> : <Eye size={16} />}
                        {t.ui.enemy_intel}
                    </button>

                    <button
                        onClick={onStartCombat}
                        className="
                    flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest text-white transition-all
                    bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 border-t border-red-500 shadow-lg shadow-red-900/40 active:scale-95
                    animate-[pulse_3s_infinite]
                "
                    >
                        <Swords size={18} />
                        {t.ui.battle_start}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar relative z-0">
                <div className={`
             absolute inset-0 p-4 flex flex-wrap content-start justify-center gap-3 transition-opacity duration-300
             ${shopViewMode === 'SHOP' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}
         `}>
                    {shopCards.map((card, index) => (
                        <div key={card.id + index} className="animate-in fade-in zoom-in duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                            <UnitCard
                                card={card}
                                location="SHOP"
                                language={language}
                                canAfford={canAffordUnit}
                                onBuy={onBuyCard}
                                onHover={onCardHover}
                                onLeave={onCardLeave}
                                onCostMouseEnter={() => handlePreviewCost(3)}
                                onCostMouseLeave={clearPreview}
                            />
                        </div>
                    ))}
                    {shopCards.length === 0 && (
                        <div className="w-full flex flex-col items-center justify-center text-slate-600 mt-20 opacity-50">
                            <RefreshCw size={64} className="mb-4 text-slate-700" />
                            <p className="font-bold uppercase tracking-widest text-lg">Shop Depleted</p>
                        </div>
                    )}
                </div>

                <div className={`
             absolute inset-0 p-4 overflow-y-auto transition-opacity duration-300 bg-slate-900/80 backdrop-blur-md
             ${shopViewMode === 'INTEL' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}
         `}>
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1.5 h-8 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]" />
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                                {t.ui.upcoming_enemies}
                            </h2>
                        </div>

                        {nextEnemies.length > 0 ? (
                            <div className="flex flex-wrap gap-4 justify-center">
                                {nextEnemies.map((enemy, index) => (
                                    <div key={index} className="scale-90 opacity-90 hover:scale-100 hover:opacity-100 transition-all duration-300">
                                        <UnitCard
                                            card={enemy}
                                            location="SHOP"
                                            variant="enemy"
                                            readOnly
                                            language={language}
                                            onHover={onCardHover}
                                            onLeave={onCardLeave}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-500 italic">
                                <EyeOff size={48} className="mb-4 opacity-50" />
                                <p>No intel available...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- ENERGY QUEUE (Integrated & Animated) --- */}
            <div className="absolute bottom-6 right-6 z-30 pointer-events-none flex flex-col items-end gap-1">
                {/* Label */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/5 backdrop-blur-md mb-1">

                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                        Retention: <span className="text-amber-400">{player.energyRetention}</span>
                    </span>
                </div>

                {/* QUEUE CONTAINER */}
                <div className="relative inline-flex items-center justify-end h-20 transition-all duration-500">

                    {/* RETENTION FRAME */}
                    <div
                        className="absolute top-0 bottom-0 right-0 bg-slate-950/60 backdrop-blur-xl rounded-full border-2 border-white/20 shadow-2xl transition-all duration-300 translate-x-1"
                        style={{ width: `${retentionBoxWidth}px` }}
                    >
                        {/* Inner Glow Track */}
                        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-1 bg-blue-900/30 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.2)]" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50 rounded-full" />
                    </div>

                    {/* BALLS */}
                    <div className="relative z-10 flex items-center px-3 py-2">
                        {visualQueue.length === 0 ? (
                            <span className="text-slate-500 font-mono text-xs animate-pulse ml-4 w-full">EMPTY</span>
                        ) : (
                            visualQueue.map((node, index) => (
                                <EnergyBallItem
                                    key={node.id}
                                    node={node}
                                    index={index}
                                    total={visualQueue.length}
                                    getStyle={getQueueBallStyle}
                                    isHighlighted={previewIndices.includes(index)}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ShopPanel;