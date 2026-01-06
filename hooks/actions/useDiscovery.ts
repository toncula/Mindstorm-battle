import React,{ useCallback } from 'react';
import { PlayerState, CardData } from '../../types';
import { playSound } from '../../services/audioService';

interface UseDiscoveryProps {
    player: PlayerState;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
    setDiscoveryOptions: React.Dispatch<React.SetStateAction<CardData[] | null>>;
    setNotifications: React.Dispatch<React.SetStateAction<string[]>>;
    isTransitioning: boolean;
    handleInteraction: () => void;
    applyBuyEffects: (card: CardData, currentHand: (CardData | null)[]) => { card: CardData; extraCards?: CardData[]; notification?: string };
    t: any;
}

export const useDiscovery = ({
    player,
    setPlayer,
    setDiscoveryOptions,
    setNotifications,
    isTransitioning,
    handleInteraction,
    applyBuyEffects,
    t
}: UseDiscoveryProps) => {

    const selectDiscovery = useCallback((card: CardData) => {
        handleInteraction();
        if (isTransitioning) return;

        const emptyIndex = player.hand.findIndex(c => c === null);
        if (emptyIndex === -1) {
            alert(t.adventure.army_full_reward);
            return;
        }

        playSound('upgrade');

        let rewardCard: CardData = {
            ...card,
            id: `reward_${Date.now()}`,
            justBought: Date.now(),
            upgrades: []
        };

        // 发现卡牌也触发购买特效 (入场曲)
        const result = applyBuyEffects(rewardCard, player.hand);
        rewardCard = result.card;

        if (result.notification) {
            setNotifications(prev => [...prev, result.notification!]);
        }

        const newHand = [...player.hand];
        newHand[emptyIndex] = rewardCard;

        // 处理衍生物
        if (result.extraCards && result.extraCards.length > 0) {
            result.extraCards.forEach(extra => {
                const nextEmpty = newHand.findIndex(c => c === null);
                if (nextEmpty !== -1) {
                    newHand[nextEmpty] = { ...extra, justBought: Date.now() };
                }
            });
        }

        setPlayer(prev => ({ ...prev, hand: newHand }));
        setDiscoveryOptions(null);
    }, [player.hand, isTransitioning, setPlayer, setDiscoveryOptions, setNotifications, handleInteraction, applyBuyEffects, t]);

    return { selectDiscovery };
};