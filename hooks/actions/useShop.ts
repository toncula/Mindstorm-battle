import React,{ useCallback } from 'react';
import { PlayerState, CardData, EnergyType } from '../../types';
import { REFRESH_COST, generateRandomCard } from '../../constants';
import { createSimpleCost } from '../../simulation/energyHelpers';
import { tryPayEnergy } from '../../simulation/energyEngine';
import { playSound } from '../../services/audioService';

interface UseShopProps {
    player: PlayerState;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
    setShopCards: React.Dispatch<React.SetStateAction<CardData[]>>;
    setIsShopLocked: React.Dispatch<React.SetStateAction<boolean>>;
    isTransitioning: boolean;
    handleInteraction: () => void;
}

export const useShop = ({
    player,
    setPlayer,
    setShopCards,
    setIsShopLocked,
    isTransitioning,
    handleInteraction
}: UseShopProps) => {

    // [修改] 增加 isFree 参数，默认 false
    const refreshShop = useCallback((tierOverride?: number, isFree: boolean = false) => {
        if (isTransitioning) return;

        const effectiveTier = tierOverride !== undefined ? tierOverride : player.tavernTier;

        // [逻辑修正]
        // 1. 如果不是免费 (isFree === false)
        // 2. 且没有指定层级 (tierOverride === undefined，通常意味着手动刷新)
        // -> 才需要执行能量支付逻辑
        if (!isFree && tierOverride === undefined) {
            // 使用你的能量支付系统
            const result = tryPayEnergy(
                createSimpleCost(EnergyType.WHITE, REFRESH_COST),
                player.energyQueue
            );

            if (!result.success) {
                playSound('error');
                return; // 能量不足，刷新失败
            }

            playSound('click'); // 仅手动刷新播放点击音效
            setPlayer(prev => ({ ...prev, energyQueue: result.newQueue }));
        }

        handleInteraction();

        // 生成新卡牌逻辑保持不变
        const newShop: CardData[] = [];
        // 商店卡位数量逻辑 (假设基础3张 + 等级)
        const count = Math.min(6, 3 + effectiveTier);
        for (let i = 0; i < count; i++) {
            newShop.push(generateRandomCard(effectiveTier));
        }

        setShopCards(newShop);

        // 如果是手动刷新或强制刷新，自动解锁
        if (!isFree || tierOverride !== undefined) {
            setIsShopLocked(false);
        }
    }, [player.tavernTier, player.energyQueue, isTransitioning, setPlayer, setShopCards, setIsShopLocked, handleInteraction]);

    return { refreshShop };
};