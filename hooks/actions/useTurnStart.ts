import React,{ useCallback } from 'react';
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
    refreshShop: (tierOverride?: number) => void;
    handleInteraction: () => void;
}

// 对应原本的 advanceRound
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
        // 1. 基础收入增长
        const nextIncomeQueue = [...player.income];
        if (nextIncomeQueue.length < MAX_INCOME_CAP) {
            nextIncomeQueue.push(createEnergyConfig(EnergyType.WHITE)); // 默认给白球
        }

        // 2. 实体化能量球 (Instantiate EnergyUnits from Config)
        const incomeUnits = nextIncomeQueue.flatMap(cfg => {
            // 这里我们简化处理，假设 cfg 只是类型或简单对象
            const type = (typeof cfg === 'object') ? cfg.type : cfg as EnergyType;
            return createEnergyBatch(type, 1);
        });

        // 3. 特效奖励能量
        const effectEnergyCount = Number(pendingTurnEffects?.gold) || 0;
        const effectUnits = createEnergyBatch(EnergyType.WHITE, Math.max(0, Math.floor(effectEnergyCount)));

        const newEnergyBatch = [...incomeUnits, ...effectUnits];

        // 4. 更新玩家状态
        setPlayer(prev => ({
            ...prev,
            income: nextIncomeQueue,
            adventurePoints: Math.min(prev.adventurePoints + 1, MAX_ADVENTURE_POINTS),
            tavernUpgradeCost: Math.max(0, prev.tavernUpgradeCost - 1), // 每回合减费
            // 注意：energyQueue 的更新延迟到动画之后
        }));

        // 5. 重置回合状态
        setEnemyConfig([]);
        setPendingTurnEffects(null);
        setRoundSummary(null);

        // 6. 刷新商店
        if (!isShopLocked) {
            // 使用外部传入的 refreshShop 逻辑 (注意：此处我们不调用 hook 内部方法，而是依赖传入的)
            // 实际上为了解耦，我们这里可以直接调用 refreshShop，假设它是安全的
            refreshShop();
        } else {
            setIsShopLocked(false); // 解锁，但保留卡牌（除了已买的）
        }

        setPhase(GamePhase.SHOP);

        // 7. 注入能量 (延迟动画)
        // HOOK TRIGGER: ON_INCOME_GAIN
        setTimeout(() => {
            setPlayer(prev => ({
                ...prev,
                energyQueue: [...prev.energyQueue, ...newEnergyBatch]
            }));
            playSound('pop'); // 收入音效
        }, 500);
    }, [round, roundSummary, player.income, pendingTurnEffects, isShopLocked, setRound, setPlayer, setEnemyConfig, setPendingTurnEffects, setRoundSummary, setPhase, setIsShopLocked, refreshShop, handleInteraction]);

    return { turnStart };
};