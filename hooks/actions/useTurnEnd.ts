import React,{ useState } from 'react';
import {
    PlayerState,
    CardData,
    GamePhase
} from '../../types';
import {
    BATTLE_START_DELAY
} from '../../constants';
import { playSound } from '../../services/audioService';
import { useHookSystem } from '../useHookSystem';
import { HookType } from '../../types/hooks';

interface UseTurnEndProps {
    player: PlayerState;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
    setPhase: (phase: GamePhase) => void;
    setPendingTurnEffects: (effects: { gold: number, effects: string[] } | null) => void;
    setEnemyConfig: (enemies: CardData[]) => void;
    nextEnemies: CardData[];
    setIsTransitioning: (isTransitioning: boolean) => void;
    isTransitioning: boolean;
}

export const useTurnEnd = ({
    player,
    setPlayer,
    setPhase,
    setPendingTurnEffects,
    setEnemyConfig,
    nextEnemies,
    setIsTransitioning,
    isTransitioning
}: UseTurnEndProps) => {
    const { triggerBatch, processSideEffects } = useHookSystem();

    const handleTurnEnd = async () => {
        console.group('🔵 [TurnEnd] Debug Flow'); // 开始调试组

        // 1. 检查防抖锁
        if (isTransitioning) {
            console.warn('[TurnEnd] Blocked: isTransitioning is true');
            console.groupEnd();
            return;
        }

        playSound('click');
        setIsTransitioning(true);

        // 2. 检查输入数据 (手牌)
        const validCards = player.hand.filter(c => c !== null);
        console.log('[TurnEnd] Hand Cards to process:', validCards.length, validCards);

        // 3. 触发 Hook
        console.log(`[TurnEnd] Triggering Hook: ${HookType.ON_TURN_END}`);
        const { sideEffects, notifications } = triggerBatch(
            HookType.ON_TURN_END,
            player.hand,
            { player }
        );

        // 4. 检查 Hook 输出结果
        if (sideEffects.length === 0 && notifications.length === 0) {
            console.warn('[TurnEnd] No effects triggered! Check if cards have "traits" and if traits handle ON_TURN_END.');
        } else {
            console.log('[TurnEnd] Generated SideEffects:', sideEffects);
            console.log('[TurnEnd] Generated Notifications:', notifications);
        }

        // 5. 执行副作用
        console.log('[TurnEnd] Processing SideEffects...');
        setPlayer(prev => {
            return processSideEffects(prev, sideEffects);
        });

        // --- 核心逻辑 ---

        const goldGenerated = sideEffects
            .filter(e => e.type === 'ADD_GOLD')
            .reduce((sum, e) => sum + (e.amount || 0), 0);

        if (notifications.length > 0 || goldGenerated > 0) {
            playSound('upgrade');
        }

        // 能量保留逻辑
        setPlayer(prev => {
            const currentQueue = prev.energyQueue;
            const retention = prev.energyRetention;

            const retainedQueue = retention > 0
                ? currentQueue.slice(-retention)
                : [];

            console.log(`[TurnEnd] Energy Retained: ${retainedQueue.length} (Retention: ${retention})`);

            return {
                ...prev,
                energyQueue: retainedQueue
            };
        });

        setPendingTurnEffects({
            gold: goldGenerated,
            effects: notifications
        });

        console.log('[TurnEnd] Scheduled transition to COMBAT');
        console.groupEnd(); // 结束调试组

        setTimeout(() => {
            setEnemyConfig(nextEnemies);
            setPhase(GamePhase.COMBAT);
            setIsTransitioning(false);
        }, BATTLE_START_DELAY);
    };

    return {
        handleTurnEnd
    };
};