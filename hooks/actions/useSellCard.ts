import React,{ useCallback } from 'react';
import { PlayerState, CardData, EnergyType } from '../../types';
import { createEnergyBatch } from '../../simulation/energyHelpers';
import { playSound } from '../../services/audioService';

interface UseSellCardProps {
    player: PlayerState;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
    setNotifications: React.Dispatch<React.SetStateAction<string[]>>;
    setCardsSoldThisTurn: React.Dispatch<React.SetStateAction<number>>;
    cardsSoldThisTurn: number;
    isTransitioning: boolean;
    handleInteraction: () => void;
    applySellEffects: (card: CardData, index: number, currentHand: (CardData | null)[], soldCount: number) => { newHand: (CardData | null)[]; notifications: string[] };
}

export const useSellCard = ({
    player,
    setPlayer,
    setNotifications,
    setCardsSoldThisTurn,
    cardsSoldThisTurn,
    isTransitioning,
    handleInteraction,
    applySellEffects
}: UseSellCardProps) => {

    const sellCard = useCallback((card: CardData) => {
        handleInteraction();
        if (isTransitioning) return;

        playSound('sell');
        const index = player.hand.findIndex(c => c && c.id === card.id);
        const handWithGap = player.hand.map(c => (c && c.id === card.id ? null : c));

        // 应用出售效果
        // HOOK TRIGGER: ON_CARD_SELL
        const { newHand, notifications: sellNotes } = applySellEffects(card, index, handWithGap, cardsSoldThisTurn);

        if (sellNotes.length > 0) {
            setNotifications(prev => [...prev, ...sellNotes]);
        }

        setCardsSoldThisTurn(prev => prev + 1);

        // 生成退款 (1白色能量)
        const refundEnergy = createEnergyBatch(EnergyType.WHITE, 1);

        setPlayer(prev => ({
            ...prev,
            energyQueue: [...prev.energyQueue, ...refundEnergy],
            hand: newHand
        }));
    }, [player.hand, player.energyQueue, cardsSoldThisTurn, isTransitioning, setPlayer, setNotifications, setCardsSoldThisTurn, handleInteraction, applySellEffects]);

    return { sellCard };
};