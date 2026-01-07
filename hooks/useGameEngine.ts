import React,{ useState, useMemo, useEffect, useCallback } from 'react';
import {
    PlayerState,
    CardData,
    GamePhase,
    RoundSummary,
    EnergyType,
    UpgradeOption
} from '../types';
import {
    INITIAL_PLAYER_HP,
    INITIAL_ENERGY,
    INITIAL_INCOME,
    INITIAL_RETENT,
    INITIAL_ADVENTURE_POINTS,
    getBaseTavernCost,
    generateRandomCard,
    BATTLE_START_DELAY
} from '../constants';
import { getEnemyComposition } from '../data/enemySettings';
import { useCardEffects } from './useCardEffects';
import { Language, getTranslation } from '../translations';
import { initAudio, playSound } from '../services/audioService';
import { HookType } from '../types/hooks';

// --- Imported Action Hooks ---
import { useShop } from './actions/useShop';
import { useBuyCard } from './actions/useBuyCard';
import { useSellCard } from './actions/useSellCard'; 
import { useDiscovery } from './actions/useDiscovery';
import { useTavern } from './actions/useTavern';
import { useTurnEnd } from './actions/useTurnEnd';
import { useTurnStart } from './actions/useTurnStart';

export interface GameEngineActions {
    startGame: () => void;
    restartGame: () => void;
    openCodex: () => void;
    backToMenu: () => void;
    toggleLanguage: () => void;
    refreshShop: (tierOverride?: number) => void;
    toggleLock: () => void;
    levelUpTavern: () => void;
    buyCard: (card: CardData) => void;
    sellCard: (card: CardData) => void;
    selectDiscovery: (card: CardData) => void;
    startCombat: () => void;
    resolveBattle: (winner: 'PLAYER' | 'ENEMY') => void;
    advanceRound: (e: React.MouseEvent) => void;
    enterInfiniteMode: () => void;
    handleInteraction: () => void;
    setNotifications: React.Dispatch<React.SetStateAction<string[]>>;
}

export interface GameEngineState {
    phase: GamePhase;
    round: number;
    player: PlayerState;
    shopCards: CardData[];
    enemyConfig: CardData[];
    roundSummary: RoundSummary | null;
    isShopLocked: boolean;
    isTransitioning: boolean;
    isInfiniteMode: boolean;
    language: Language;
    notifications: string[];
    discoveryOptions: CardData[] | null;
    pendingTurnEffects: { gold: number, effects: string[] } | null;
    t: any; // 翻译对象
}

export const useGameEngine = () => {
    // --- 1. 基础状态 (State Definitions) ---
    const [phase, setPhase] = useState<GamePhase>(GamePhase.START_MENU);
    const [round, setRound] = useState(1);
    const [isInfiniteMode, setIsInfiniteMode] = useState(false);
    const [language, setLanguage] = useState<Language>('en');

    // 玩家状态
    const [player, setPlayer] = useState<PlayerState>({
        hp: INITIAL_PLAYER_HP,
        energyQueue: [...INITIAL_ENERGY],
        income: [...INITIAL_INCOME],
        energyRetention: INITIAL_RETENT,
        adventurePoints: INITIAL_ADVENTURE_POINTS,
        tavernTier: 1,
        tavernUpgradeCost: getBaseTavernCost(1),
        hand: Array(7).fill(null),
    });

    // 商店与战斗状态
    const [shopCards, setShopCards] = useState<CardData[]>([]);
    const [isShopLocked, setIsShopLocked] = useState(false);
    const [enemyConfig, setEnemyConfig] = useState<CardData[]>([]);
    const [roundSummary, setRoundSummary] = useState<RoundSummary | null>(null);
    const [notifications, setNotifications] = useState<string[]>([]);

    // UI/过渡状态
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [pendingTurnEffects, setPendingTurnEffects] = useState<{ gold: number, effects: string[] } | null>(null);
    const [discoveryOptions, setDiscoveryOptions] = useState<CardData[] | null>(null);
    const [cardsSoldThisTurn, setCardsSoldThisTurn] = useState(0);

    // 辅助工具
    const t = getTranslation(language);
    const { applyBuyEffects, applySellEffects, applyTavernUpgradeEffects, calculateTurnEndEffects } = useCardEffects(language);
    const [audioInited, setAudioInited] = useState(false);

    // --- 2. 状态机与生命周期 Hook (Lifecycle Hooks) ---

    // 重置每回合的计数器
    useEffect(() => {
        if (phase === GamePhase.SHOP) {
            setCardsSoldThisTurn(0);
            // HOOK TRIGGER: ON_TURN_START
            // HookExecutor.triggerGlobal(HookType.ON_TURN_START, { player });
            console.log(`[HookSystem] Trigger: ${HookType.ON_TURN_START}`);
        }
    }, [round, phase]);

    // 计算下一波敌人
    const nextEnemies = useMemo(() => getEnemyComposition(round), [round]);

    // 音频初始化
    const handleInteraction = useCallback(() => {
        if (!audioInited) {
            initAudio();
            setAudioInited(true);
        }
    }, [audioInited]);

    // --- 3. 核心动作逻辑模块化 (Modularized Actions) ---

    // Shop Actions
    const { refreshShop } = useShop({
        player, setPlayer, setShopCards, setIsShopLocked, isTransitioning, handleInteraction
    });

    const { buyCard } = useBuyCard({
        player, setPlayer, setShopCards, setDiscoveryOptions, setNotifications, isTransitioning, handleInteraction, applyBuyEffects, t
    });

    const { sellCard } = useSellCard({
        player, setPlayer, setNotifications, setCardsSoldThisTurn, cardsSoldThisTurn, isTransitioning, handleInteraction, applySellEffects
    });

    const { selectDiscovery } = useDiscovery({
        player, setPlayer, setDiscoveryOptions, setNotifications, isTransitioning, handleInteraction, applyBuyEffects, t
    });

    const { levelUpTavern } = useTavern({
        player, setPlayer, setNotifications, isTransitioning, handleInteraction, applyTavernUpgradeEffects
    });

    // Phase Transitions
    const { turnEnd: resolveBattle } = useTurnEnd({
        player, setPlayer, round, isInfiniteMode, setPhase, setRoundSummary, pendingTurnEffects
    });

    const { turnStart: advanceRound } = useTurnStart({
        round, setRound, player, setPlayer, roundSummary, setRoundSummary, setEnemyConfig, setPendingTurnEffects, setShopCards, isShopLocked, setIsShopLocked, setPhase, pendingTurnEffects, refreshShop, handleInteraction
    });

    // --- 4. 剩余的非 Hook 逻辑 (Remaining Logic) ---

    const startGame = () => {
        handleInteraction();
        playSound('click');
        const initialTier = 1;

        // 重置玩家状态
        setPlayer({
            hp: INITIAL_PLAYER_HP,
            energyQueue: [...INITIAL_ENERGY],
            income: [...INITIAL_INCOME],
            energyRetention: INITIAL_RETENT,
            adventurePoints: INITIAL_ADVENTURE_POINTS,
            tavernTier: initialTier,
            tavernUpgradeCost: getBaseTavernCost(initialTier),
            hand: Array(7).fill(null),
        });

        // 重置游戏循环状态
        setRound(1);
        setIsInfiniteMode(false);
        setRoundSummary(null);
        setEnemyConfig([]);
        setNotifications([]);
        setIsShopLocked(false);
        setPendingTurnEffects(null);
        setIsTransitioning(false);
        setDiscoveryOptions(null);

        // 初始刷新
        refreshShop(initialTier);
        setPhase(GamePhase.SHOP);
    };

    const restartGame = () => {
        handleInteraction();
        playSound('click');
        setPhase(GamePhase.START_MENU);
    };

    const startCombat = () => {
        handleInteraction();
        if (isTransitioning) return;

        playSound('click');
        setNotifications([]);
        setIsTransitioning(true);

        // 结算回合结束效果 (Turn End Effects)
        // HOOK TRIGGER: ON_TURN_END (Prep)
        const { newHand, goldGenerated, summaryEffects } = calculateTurnEndEffects(player.hand);
        const safeGoldGenerated = Number.isNaN(Number(goldGenerated)) ? 0 : Number(goldGenerated);

        // 能量截断 (Energy Retention Logic)
        const retainedQueue = player.energyRetention > 0
            ? player.energyQueue.slice(-player.energyRetention)
            : [];

        setPlayer(prev => ({
            ...prev,
            energyQueue: retainedQueue,
            hand: newHand
        }));

        if (summaryEffects.length > 0) {
            playSound('upgrade');
        }

        setPendingTurnEffects({
            gold: safeGoldGenerated,
            effects: summaryEffects
        });

        // 延迟进入战斗画面
        setTimeout(() => {
            setEnemyConfig(nextEnemies);
            setPhase(GamePhase.COMBAT);
            setIsTransitioning(false);
        }, BATTLE_START_DELAY);
    };

    const enterInfiniteMode = () => {
        setIsInfiniteMode(true);
        resolveBattle('PLAYER');
    };

    const toggleLanguage = () => {
        handleInteraction();
        playSound('click');
        setLanguage(prev => prev === 'en' ? 'zh' : 'en');
    };

    return {
        // 数据快照
        gameState: {
            phase,
            round,
            player,
            shopCards,
            enemyConfig,
            roundSummary,
            isShopLocked,
            isTransitioning,
            isInfiniteMode,
            language,
            notifications,
            discoveryOptions,
            pendingTurnEffects,
            t
        },
        // 行为接口
        actions: {
            startGame,
            restartGame,
            openCodex: () => setPhase(GamePhase.CODEX),
            backToMenu: () => setPhase(GamePhase.START_MENU),
            toggleLanguage,
            refreshShop,
            toggleLock: () => setIsShopLocked(prev => !prev),
            levelUpTavern,
            buyCard,
            sellCard,
            selectDiscovery,
            startCombat,
            resolveBattle, // Mapped to useTurnEnd
            advanceRound,  // Mapped to useTurnStart
            enterInfiniteMode,
            handleInteraction,
            setNotifications
        }
    };
};