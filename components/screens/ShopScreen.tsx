import React, { useState, useEffect } from 'react';
import { PlayerState, CardData, UnitType, EnergyType } from '../../types';
import { Language, getTranslation } from '../../translations';
import { useCardEffects } from '../../hooks/useCardEffects';
import { generateRandomCard, REFRESH_COST, getBaseTavernCost } from '../../constants';
import ShopPanel from '../shop/ShopPanel';
import ArmyPanel from '../shop/cards/ArmyPanel';
import DiscoveryModal from '../modals/DiscoveryModal';
import { SoundType } from '../../services/audioService';
import { tryPayEnergy, createWhiteEnergyRequest } from '../../simulation/energyEngine';
import { createEnergyBatch } from '../../simulation/energyHelpers';

interface ShopScreenProps {
    player: PlayerState;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
    shopCards: CardData[];
    setShopCards: React.Dispatch<React.SetStateAction<CardData[]>>;
    isShopLocked: boolean;
    setIsShopLocked: React.Dispatch<React.SetStateAction<boolean>>;
    refreshShop: (tierOverride?: number) => void;
    enemyConfig: CardData[];
    round: number;
    isTransitioning: boolean;
    onStartCombat: () => void;
    onCardHover: (card: CardData, rect: DOMRect) => void;
    onCardLeave: () => void;
    setNotifications: React.Dispatch<React.SetStateAction<string[]>>;
    playSound: (type: SoundType) => void;
    handleInteraction: () => void;
    language: Language;
    t: any;
    onLevelUpTavern: () => void; // 确保 App.tsx 传递了这个 Prop
}

const ShopScreen: React.FC<ShopScreenProps> = ({
    player, setPlayer, shopCards, setShopCards,
    isShopLocked, setIsShopLocked, refreshShop,
    enemyConfig, round, isTransitioning, onStartCombat,
    onCardHover, onCardLeave, setNotifications,
    playSound, handleInteraction, language, t,
    onLevelUpTavern
}) => {
    const [shopViewMode, setShopViewMode] = useState<'SHOP' | 'INTEL'>('SHOP');
    const [cardsSoldThisTurn, setCardsSoldThisTurn] = useState(0);
    const [discoveryOptions, setDiscoveryOptions] = useState<CardData[] | null>(null);

    const { applyBuyEffects, applySellEffects, applyTavernUpgradeEffects } = useCardEffects(language);

    useEffect(() => {
        setCardsSoldThisTurn(0);
    }, [round]);

    // --- Handlers ---

    // 注意：App.tsx 可能传递了 onBuyCard 处理函数，但这里似乎实现了自己的逻辑。
    // 如果 App.tsx 的 handleBuyCard 已经处理了所有逻辑，这里应该优先使用它，
    // 或者确保两边的逻辑是一致的。为了保持 ShopScreen 独立性，我们保留这里的逻辑但适配新能量系统。

    const handleBuyCard = (card: CardData) => {
        handleInteraction();
        if (isTransitioning) return;

        // 能量检查使用新引擎
        const cost = 3;
        const payment = tryPayEnergy(createWhiteEnergyRequest(cost), player.energyQueue);

        if (!payment.success) {
            playSound('error');
            return;
        }

        const existingCopies = player.hand.filter(c => c !== null && c.templateId === card.templateId && !c.isGolden);

        if (existingCopies.length >= 2) {
            playSound('upgrade');
            playSound('victory');

            const copy1 = existingCopies[0]!;
            const copy2 = existingCopies[1]!;

            const handWithoutCopies = player.hand.map(c => (c && c.id === copy1.id) || (c && c.id === copy2.id) ? null : c);

            let insertIndex = player.hand.indexOf(copy1);
            if (insertIndex === -1) insertIndex = player.hand.indexOf(copy2);
            if (insertIndex === -1) insertIndex = handWithoutCopies.findIndex(c => c === null);

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
                energyQueue: payment.newQueue, // 更新能量队列
                hand: newHand
            }));

            setShopCards(prev => prev.filter(c => c.id !== card.id));
            onCardLeave();

            const rewardTier = Math.min(4, player.tavernTier + 1);
            const rewards = [
                generateRandomCard(rewardTier, rewardTier),
                generateRandomCard(rewardTier, rewardTier),
                generateRandomCard(rewardTier, rewardTier)
            ];
            setDiscoveryOptions(rewards);

        } else {
            const emptyIndex = player.hand.findIndex(c => c === null);
            if (emptyIndex === -1) {
                // 暂时使用 alert，后续可优化为 toast
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
            const result = applyBuyEffects(purchasedCard, player.hand);
            purchasedCard = result.card;

            if (result.notification) {
                setNotifications(prev => [...prev, result.notification!]);
            }

            const newHand = [...player.hand];
            newHand[emptyIndex] = purchasedCard;

            if (result.extraCards && result.extraCards.length > 0) {
                result.extraCards.forEach(extra => {
                    const nextEmpty = newHand.findIndex(c => c === null);
                    if (nextEmpty !== -1) {
                        newHand[nextEmpty] = { ...extra, justBought: Date.now() };
                    }
                });
            }

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
                energyQueue: payment.newQueue, // 更新能量队列
                hand: newHand
            }));
            setShopCards(prev => prev.filter(c => c.id !== card.id));
            onCardLeave();
        }
    };

    const handleSellCard = (card: CardData) => {
        handleInteraction();
        if (isTransitioning) return;
        playSound('sell');
        const index = player.hand.findIndex(c => c && c.id === card.id);
        const handWithGap = player.hand.map(c => (c && c.id === card.id ? null : c));

        const { newHand, notifications: sellNotes } = applySellEffects(card, index, handWithGap, cardsSoldThisTurn);

        if (sellNotes.length > 0) {
            setNotifications(prev => [...prev, ...sellNotes]);
        }

        setCardsSoldThisTurn(prev => prev + 1);

        // 生成卖卡获得的能量 (1个白色能量)
        const refundEnergy = createEnergyBatch(EnergyType.WHITE, 1);

        setPlayer(prev => ({
            ...prev,
            // 将生成的 EnergyUnit 添加到队列末尾
            energyQueue: [...prev.energyQueue, ...refundEnergy],
            hand: newHand
        }));
        onCardLeave();
    };

    const handleSelectDiscovery = (card: CardData) => {
        // 发现逻辑不消耗能量，保持原样
        handleInteraction();
        if (isTransitioning) return;
        playSound('upgrade');

        const emptyIndex = player.hand.findIndex(c => c === null);
        if (emptyIndex === -1) {
            alert(t.adventure.army_full_reward);
            return;
        }

        let rewardCard: CardData = {
            ...card,
            id: `reward_${Date.now()}`,
            justBought: Date.now(),
            upgrades: []
        };
        const result = applyBuyEffects(rewardCard, player.hand);
        rewardCard = result.card;

        if (result.notification) {
            setNotifications(prev => [...prev, result.notification!]);
        }

        const newHand = [...player.hand];
        newHand[emptyIndex] = rewardCard;

        if (result.extraCards && result.extraCards.length > 0) {
            result.extraCards.forEach(extra => {
                const nextEmpty = newHand.findIndex(c => c === null);
                if (nextEmpty !== -1) {
                    newHand[nextEmpty] = { ...extra, justBought: Date.now() };
                }
            });
        }

        setPlayer(prev => ({
            ...prev,
            hand: newHand
        }));
        setDiscoveryOptions(null);
        onCardLeave();
    };

    const handleRefreshShopInternal = () => {
        handleInteraction();
        if (isTransitioning) return;

        // 能量检查
        const payment = tryPayEnergy(REFRESH_COST, player.energyQueue);

        if (!payment.success) {
            playSound('error');
            return;
        }

        playSound('click');
        setPlayer(prev => ({ ...prev, energyQueue: payment.newQueue }));
        setIsShopLocked(false);
        refreshShop();
    };

    const handleToggleLock = () => {
        handleInteraction();
        if (isTransitioning) return;
        playSound('click');
        setIsShopLocked(!isShopLocked);
    };

    // 如果 App.tsx 已经传递了 onLevelUpTavern，我们可以直接使用它，
    // 但为了确保 ShopScreen 内部的逻辑完整性 (如音效、手牌效果)，这里保留本地实现，
    // 只要它的能量消耗逻辑是正确的。
    // 注意：App.tsx 里的 handleLevelUpTavern 也做了类似的 setPlayer 操作。
    // 如果这里覆盖了，需要确保两边不冲突。这里我们优先使用本地逻辑，因为它包含了卡牌升级特效。
    const handleLevelUpTavernInternal = () => {
        handleInteraction();
        if (isTransitioning) return;
        const cost = player.tavernUpgradeCost;

        // 能量检查
        const payment = tryPayEnergy(createWhiteEnergyRequest(cost), player.energyQueue);

        if (!payment.success || player.tavernTier >= 4) {
            playSound('error');
            return;
        }

        playSound('upgrade');

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
    };

    const nextEmptySlotIndex = player.hand.findIndex(c => c === null);
    const playerArmyValue = player.hand.reduce((total, card) => total + (card ? card.value : 0), 0);
    const unitCount = player.hand.filter(c => c !== null).length;

    return (
        <>
            <ShopPanel
                player={player}
                shopCards={shopCards}
                isShopLocked={isShopLocked}
                shopViewMode={shopViewMode}
                isTransitioning={isTransitioning}
                nextEnemies={enemyConfig}
                t={t}
                language={language}
                refreshCost={REFRESH_COST}
                onLevelUpTavern={handleLevelUpTavernInternal} // 使用内部处理函数
                onToggleLock={handleToggleLock}
                onRefreshShop={handleRefreshShopInternal}
                onToggleViewMode={() => setShopViewMode(prev => prev === 'SHOP' ? 'INTEL' : 'SHOP')}
                onStartCombat={onStartCombat}
                onBuyCard={handleBuyCard}
                onCardHover={onCardHover}
                onCardLeave={onCardLeave}
            />

            <ArmyPanel
                player={player}
                playerArmyValue={playerArmyValue}
                unitCount={unitCount}
                language={language}
                t={t}
                isTransitioning={isTransitioning}
                nextEmptySlotIndex={nextEmptySlotIndex}
                onSellCard={handleSellCard}
                onCardHover={onCardHover}
                onCardLeave={onCardLeave}
            />

            {discoveryOptions && (
                <DiscoveryModal
                    options={discoveryOptions}
                    language={language}
                    onSelect={handleSelectDiscovery}
                    onHover={onCardHover}
                    onLeave={onCardLeave}
                />
            )}
        </>
    );
};

export default ShopScreen;