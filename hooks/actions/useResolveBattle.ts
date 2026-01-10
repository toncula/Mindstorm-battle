import { useHookSystem } from '../useHookSystem';
import { HookType } from '../../types/hooks';
import React,{ useCallback } from 'react';
import { PlayerState, CardData, GamePhase, RoundSummary, EnergyType } from '../../types';
import { MAX_ROUNDS, MAX_INCOME_CAP } from '../../constants';
import { createEnergyConfig } from '../../simulation/energyHelpers';

interface UseResolveBattleProps {
    player: PlayerState;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
    round: number;
    isInfiniteMode: boolean;
    setPhase: React.Dispatch<React.SetStateAction<GamePhase>>;
    setRoundSummary: React.Dispatch<React.SetStateAction<RoundSummary | null>>;
    pendingTurnEffects: { gold: number, effects: string[] } | null;
}

// 对应原本的 resolveBattle
export const useResolveBattle = ({
    player,
    setPlayer,
    round,
    isInfiniteMode,
    setPhase,
    setRoundSummary,
    pendingTurnEffects
}: UseResolveBattleProps) => {

    const resolveBattle = useCallback((winner: 'PLAYER' | 'ENEMY') => {
        if (winner === 'PLAYER' && round === MAX_ROUNDS && !isInfiniteMode) {
            setPhase(GamePhase.VICTORY);
            return;
        }

        let damage = 0;
        if (winner === 'ENEMY') {
            damage = 1; // 暂时固定伤害，后续可根据剩余敌人计算
            const newHp = player.hp - damage;
            setPlayer(prev => ({ ...prev, hp: newHp }));

            if (newHp <= 0) {
                setPhase(GamePhase.GAME_OVER);
                return;
            }
        }

        // 准备回合结算摘要
        const nextIncomeQueue = [...player.income];
        // 预测下一回合收入显示
        if (nextIncomeQueue.length < MAX_INCOME_CAP) {
            nextIncomeQueue.push(createEnergyConfig(EnergyType.WHITE));
        }

        const effectEnergyCount = Number(pendingTurnEffects?.gold) || 0;
        const effectTexts = pendingTurnEffects?.effects || [];

        setRoundSummary({
            winner,
            damageTaken: damage,
            baseIncome: nextIncomeQueue,
            effectGold: effectEnergyCount,
            adventurePointsEarned: 1,
            effects: Array.from(new Set(effectTexts))
        });

        setPhase(GamePhase.ROUND_OVER);
    }, [player.hp, player.income, round, isInfiniteMode, pendingTurnEffects, setPlayer, setPhase, setRoundSummary]);

    return { resolveBattle };
};