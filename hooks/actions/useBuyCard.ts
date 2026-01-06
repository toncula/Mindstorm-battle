import React,{ useCallback } from 'react';
import { PlayerState, CardData, UnitType, EnergyType } from '../../types';
import { generateRandomCard } from '../../constants';
import { createSimpleCost } from '../../simulation/energyHelpers';
import { tryPayEnergy } from '../../simulation/energyEngine';
import { playSound } from '../../services/audioService';
import { HookType } from '../../types/hooks';

interface UseBuyCardProps {
    player: PlayerState;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
    setShopCards: React.Dispatch<React.SetStateAction<CardData[]>>;
    setDiscoveryOptions: React.Dispatch<React.SetStateAction<CardData[] | null>>;
    setNotifications: React.Dispatch<React.SetStateAction<string[]>>;
    isTransitioning: boolean;
    handleInteraction: () => void;
    applyBuyEffects: (card: CardData, currentHand: (CardData | null)[]) => { card: CardData; extraCards?: CardData[]; notification?: string };
    t: any;
}

export const useBuyCard = ({
    player,
    setPlayer,
    setShopCards,
    setDiscoveryOptions,
    setNotifications,
    isTransitioning,
    handleInteraction,
    applyBuyEffects,
    t
}: UseBuyCardProps) => {

    const buyCard = useCallback((card: CardData) => {
        handleInteraction();
        if (isTransitioning) return;

        // 1. 支付检查 (这里暂时硬编码 cost=3，后续应从 HookContext 获取动态价格)
        // HOOK TRIGGER: CAN_PAY_ENERGY (Check if modifier exists)
        const cost = 3;
        const payment = tryPayEnergy(createSimpleCost(EnergyType.WHITE, cost), player.energyQueue);

        if (!payment.success) {
            playSound('error');
            return;
        }

        // 2. 三连检测 (Golden Logic)
        const existingCopies = player.hand.filter(c => c !== null && c.templateId === card.templateId && !c.isGolden);

        if (existingCopies.length >= 2) {
            // --- 处理三连合成 ---
            playSound('upgrade');
            playSound('victory'); // 三连音效

            const copy1 = existingCopies[0]!;
            const copy2 = existingCopies[1]!;

            // 移除旧卡
            const handWithoutCopies = player.hand.map(c => (c && c.id === copy1.id) || (c && c.id === copy2.id) ? null : c);

            // 确定位置
            let insertIndex = player.hand.indexOf(copy1);
            if (insertIndex === -1) insertIndex = player.hand.indexOf(copy2);
            if (insertIndex === -1) insertIndex = handWithoutCopies.findIndex(c => c === null);

            // 创建金卡
            const goldenCard: CardData = {
                ...card,
                id: `golden_${Date.now()}`,
                unitCount: copy1.unitCount + copy2.unitCount + card.unitCount,
                value: copy1.value + copy2.value + card.value,
                traits: [...copy1.traits, ...copy2.traits, ...card.traits],
                isGolden: true,
                justBought: Date.now(),
                upgrades: []
            };

            const newHand = [...handWithoutCopies];
            newHand[insertIndex] = goldenCard;

            setPlayer(prev => ({
                ...prev,
                energyQueue: payment.newQueue,
                hand: newHand
            }));

            // 移除商店卡牌
            setShopCards(prev => prev.filter(c => c.id !== card.id));

            // 触发三连奖励 (发现机制)
            const rewardTier = Math.min(4, player.tavernTier + 1);
            const rewards = [
                generateRandomCard(rewardTier, rewardTier),
                generateRandomCard(rewardTier, rewardTier),
                generateRandomCard(rewardTier, rewardTier)
            ];
            setDiscoveryOptions(rewards);

            // HOOK TRIGGER: ON_MERGE_UNIT (Future)
            console.log(`[HookSystem] Trigger: ON_MERGE_UNIT`);

        } else {
            // --- 普通购买 ---
            const emptyIndex = player.hand.findIndex(c => c === null);
            if (emptyIndex === -1) {
                alert(t.adventure.army_full);
                playSound('error');
                return;
            }

            playSound('buy');

            let purchasedCard: CardData = {
                ...card,
                id: `p_${Date.now()}_${Math.random()}`,
                justBought: Date.now(),
                upgrades: []
            };

            // 应用购买效果 (Hook Logic inside useCardEffects)
            // HOOK TRIGGER: ON_CARD_BUY
            const result = applyBuyEffects(purchasedCard, player.hand);
            purchasedCard = result.card;

            if (result.notification) {
                setNotifications(prev => [...prev, result.notification!]);
            }

            const newHand = [...player.hand];
            newHand[emptyIndex] = purchasedCard;

            // 处理衍生物 (Escort 等)
            if (result.extraCards && result.extraCards.length > 0) {
                result.extraCards.forEach(extra => {
                    const nextEmpty = newHand.findIndex(c => c === null);
                    if (nextEmpty !== -1) {
                        newHand[nextEmpty] = { ...extra, justBought: Date.now() };
                    }
                });
            }

            // 特殊逻辑：MELEE_BUFF_ON_ENTER (War Cry)
            // TODO: 这应该移动到 useCardEffects 或 Hook System 中
            if (purchasedCard.specialEffect === 'MELEE_BUFF_ON_ENTER') {
                const multiplier = purchasedCard.isGolden ? 2 : 1;
                newHand.forEach((c, idx) => {
                    if (c && c.unitType === UnitType.MELEE) {
                        newHand[idx] = { ...c, unitCount: c.unitCount + (1 * multiplier) };
                    }
                });
            }

            setPlayer(prev => ({
                ...prev,
                energyQueue: payment.newQueue,
                hand: newHand
            }));

            setShopCards(prev => prev.filter(c => c.id !== card.id));
        }
    }, [player.hand, player.energyQueue, player.tavernTier, isTransitioning, setPlayer, setShopCards, setDiscoveryOptions, setNotifications, handleInteraction, applyBuyEffects, t]);

    return { buyCard };
};