import React from 'react';
import { PlayerState, CardData } from '../../types';
import { Language } from '../../translations';
import ShopPanel from '../shop/ShopPanel';
import ArmyPanel from '../shop/cards/ArmyPanel';
import DiscoveryModal from '../modals/DiscoveryModal';
import { SoundType } from '../../services/audioService';
import { REFRESH_COST } from '../../constants';
import { GameEngineActions } from '../../hooks/useGameEngine';

interface ShopScreenProps {
    player: PlayerState;
    shopCards: CardData[];
    isShopLocked: boolean;
    refreshShop: (tierOverride?: number) => void;
    enemyConfig: CardData[];
    round: number;
    isTransitioning: boolean;
    discoveryOptions: CardData[] | null;

    // Actions 聚合
    actions: GameEngineActions;

    onCardHover: (card: CardData, rect: DOMRect) => void;
    onCardLeave: () => void;
    playSound: (type: SoundType) => void;
    language: Language;
    t: any;
}

const ShopScreen: React.FC<ShopScreenProps> = ({
    player, shopCards, isShopLocked,
    enemyConfig, isTransitioning, discoveryOptions,
    actions,
    onCardHover, onCardLeave, language, t
}) => {
    // 视图模式状态 (仅 UI 相关，保留在组件内)
    const [shopViewMode, setShopViewMode] = React.useState<'SHOP' | 'INTEL'>('SHOP');

    // 提取需要的 Actions
    const {
        buyCard,
        sellCard,
        selectDiscovery,
        refreshShop,
        toggleLock,
        levelUpTavern,
        startCombat
    } = actions;

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

                // 连接 Actions
                onLevelUpTavern={levelUpTavern}
                onToggleLock={toggleLock}
                onRefreshShop={() => refreshShop()}
                onToggleViewMode={() => setShopViewMode(prev => prev === 'SHOP' ? 'INTEL' : 'SHOP')}
                onStartCombat={startCombat}
                onBuyCard={buyCard}

                // UI 交互
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

                // 连接 Actions
                onSellCard={sellCard}

                // UI 交互
                onCardHover={onCardHover}
                onCardLeave={onCardLeave}
            />

            {discoveryOptions && (
                <DiscoveryModal
                    options={discoveryOptions}
                    language={language}
                    onSelect={selectDiscovery}
                    onHover={onCardHover}
                    onLeave={onCardLeave}
                />
            )}
        </>
    );
};

export default ShopScreen;