import React, { useCallback } from 'react';
import { PlayerState, CardData, GamePhase, RoundSummary, EnergyType } from '../../types';
import { MAX_ADVENTURE_POINTS, MAX_INCOME_CAP, BATTLE_START_DELAY } from '../../constants';
import { createEnergyBatch, createEnergyConfig } from '../../simulation/energyHelpers';
import { playSound } from '../../services/audioService';

interface UseTurnStartProps {
    round: number;
    setRound: React.Dispatch<React.SetStateAction<number>>;
    player: PlayerState;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
    roundSummary: RoundSummary | null;
    setRoundSummary: React.Dispatch<React.SetStateAction<RoundSummary | null>>;
    setEnemyConfig: React.Dispatch<React.SetStateAction<CardData[]>>;
    setPendingTurnEffects: React.Dispatch<React.SetStateAction<{ gold: number, effects: string[] } | null>>;
    setShopCards: React.Dispatch<React.SetStateAction<CardData[]>>;
    isShopLocked: boolean;
    setIsShopLocked: React.Dispatch<React.SetStateAction<boolean>>;
    setPhase: React.Dispatch<React.SetStateAction<GamePhase>>;
    pendingTurnEffects: { gold: number, effects: string[] } | null;
    // 更新类型定义：确保这里支持 isFree 参数
    refreshShop: (tierOverride?: number, isFree?: boolean) => void;
    handleInteraction: () => void;
}

export const useTurnStart = ({
    round,
    setRound,
    player,
    setPlayer,
    roundSummary,
    setRoundSummary,
    setEnemyConfig,
    setPendingTurnEffects,
    setShopCards,
    isShopLocked,
    setIsShopLocked,
    setPhase,
    pendingTurnEffects,
    refreshShop,
    handleInteraction
}: UseTurnStartProps) => {

    const turnStart = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        handleInteraction();
        playSound('click');

        const won = roundSummary?.winner === 'PLAYER';
        const nextRound = won ? round + 1 : round;
        setRound(nextRound);

        // --- 收入结算 (Income Generation) ---
        const nextIncomeQueue = [...player.income];
        if (nextIncomeQueue.length < MAX_INCOME_CAP) {
            nextIncomeQueue.push(createEnergyConfig(EnergyType.WHITE)); // 默认给白球
        }

        // 实体化能量球
        const incomeUnits = nextIncomeQueue.flatMap(cfg => {
            const type = (typeof cfg === 'object') ? cfg.type : cfg as EnergyType;
            return createEnergyBatch(type, 1);
        });

        // 特效奖励能量
        const effectEnergyCount = Number(pendingTurnEffects?.gold) || 0;
        const effectUnits = createEnergyBatch(EnergyType.WHITE, Math.max(0, Math.floor(effectEnergyCount)));

        const newEnergyBatch = [...incomeUnits, ...effectUnits];

        // 更新玩家状态
        setPlayer(prev => ({
            ...prev,
            income: nextIncomeQueue,
            adventurePoints: Math.min(prev.adventurePoints + 1, MAX_ADVENTURE_POINTS),
            tavernUpgradeCost: Math.max(0, prev.tavernUpgradeCost - 1),
        }));

        // 重置回合状态
        setEnemyConfig([]);
        setPendingTurnEffects(null);
        setRoundSummary(null);

        // 关键修复 1: 先切换到 SHOP 阶段
        // 这样可以避开 refreshShop 中可能的 "if (phase !== SHOP) return" 检查
        setPhase(GamePhase.SHOP);

        // 关键修复 2: 刷新商店逻辑
        if (!isShopLocked) {
            // 传入 isFree: true，强制刷新并忽略金币检查
            refreshShop(undefined, true);
        } else {
            setIsShopLocked(false); // 解锁，但本轮不刷新
        }

        // 注入能量 (延迟动画)
        setTimeout(() => {
            setPlayer(prev => ({
                ...prev,
                energyQueue: [...prev.energyQueue, ...newEnergyBatch]
            }));
            playSound('pop');
        }, 500);
    }, [round, roundSummary, player.income, pendingTurnEffects, isShopLocked, setRound, setPlayer, setEnemyConfig, setPendingTurnEffects, setRoundSummary, setPhase, setIsShopLocked, refreshShop, handleInteraction]);

    return { turnStart };
};