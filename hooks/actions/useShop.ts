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

    const refreshShop = useCallback((tierOverride?: number) => {
        handleInteraction();
        if (isTransitioning) return;

        const effectiveTier = tierOverride !== undefined ? tierOverride : player.tavernTier;

        // 如果没有 override，说明是玩家手动刷新，需要扣费
        if (tierOverride === undefined) {
            const result = tryPayEnergy(createSimpleCost(EnergyType.WHITE, REFRESH_COST), player.energyQueue);

            if (!result.success) {
                playSound('error');
                return;
            }

            playSound('click');
            setPlayer(prev => ({ ...prev, energyQueue: result.newQueue }));
        }

        // 生成新卡牌
        const newShop: CardData[] = [];
        const count = Math.min(6, 3 + effectiveTier);
        for (let i = 0; i < count; i++) {
            newShop.push(generateRandomCard(effectiveTier));
        }

        setShopCards(newShop);
        if (tierOverride === undefined) setIsShopLocked(false); // 手动刷新解锁
    }, [player.tavernTier, player.energyQueue, isTransitioning, setPlayer, setShopCards, setIsShopLocked, handleInteraction]);

    return { refreshShop };
};