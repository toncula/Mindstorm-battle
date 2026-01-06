import React,{ useCallback } from 'react';
import { PlayerState, CardData } from '../../types';
import { EnergyTypeArray } from '../../types';
import { getBaseTavernCost } from '../../constants';
import { createSimpleCost } from '../../simulation/energyHelpers';
import { tryPayEnergy } from '../../simulation/energyEngine';
import { playSound } from '../../services/audioService';

interface UseTavernProps {
    player: PlayerState;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
    setNotifications: React.Dispatch<React.SetStateAction<string[]>>;
    isTransitioning: boolean;
    handleInteraction: () => void;
    applyTavernUpgradeEffects: (currentHand: (CardData | null)[]) => { newHand: (CardData | null)[]; notifications: string[] };
}

export const useTavern = ({
    player,
    setPlayer,
    setNotifications,
    isTransitioning,
    handleInteraction,
    applyTavernUpgradeEffects
}: UseTavernProps) => {

    const levelUpTavern = useCallback(() => {
        handleInteraction();
        if (isTransitioning) return;

        const cost = player.tavernUpgradeCost;
        // 支持混合支付
        const payment = tryPayEnergy(createSimpleCost(EnergyTypeArray.ALL, cost), player.energyQueue);

        if (!payment.success || player.tavernTier >= 4) {
            playSound('error');
            return;
        }

        playSound('upgrade');

        // 触发升级特效
        // HOOK TRIGGER: ON_TAVERN_UPGRADE
        const { newHand, notifications: upgradeNotes } = applyTavernUpgradeEffects(player.hand);

        if (upgradeNotes.length > 0) {
            setNotifications(prev => [...prev, ...upgradeNotes]);
        }

        setPlayer(prev => ({
            ...prev,
            energyQueue: payment.newQueue,
            tavernTier: prev.tavernTier + 1,
            tavernUpgradeCost: getBaseTavernCost(prev.tavernTier + 1),
            hand: newHand
        }));
    }, [player.tavernUpgradeCost, player.tavernTier, player.energyQueue, player.hand, isTransitioning, setPlayer, setNotifications, handleInteraction, applyTavernUpgradeEffects]);

    return { levelUpTavern };
};