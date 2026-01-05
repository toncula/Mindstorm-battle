import React, { useState, useEffect, useMemo } from 'react';
import {
  PlayerState,
  CardData,
  GamePhase,
  RoundSummary,
  EnergyType
} from './types';
import {
  INITIAL_ENERGY,
  INITIAL_INCOME,
  MAX_INCOME_CAP,
  INITIAL_RETENT,
  INITIAL_ADVENTURE_POINTS,
  MAX_ADVENTURE_POINTS,
  INITIAL_PLAYER_HP,
  generateRandomCard,
  getBaseTavernCost,
  MAX_ROUNDS,
  BATTLE_START_DELAY
} from './constants';
// --- 新增导入：能量工厂与引擎 ---
import { createEnergyBatch } from './simulation/energyHelpers';
import { tryPayEnergy, createWhiteEnergyRequest } from './simulation/energyEngine';
// ------------------------------
import BattleCanvas from './components/battle/BattleCanvas';
import CardInfoPanel from './components/shop/cards/CardInfoPanel';
import { Language, getTranslation } from './translations';
import { initAudio, playSound } from './services/audioService';
import { getEnemyComposition } from './data/enemySettings';
import { useCardEffects } from './hooks/useCardEffects';
import { ChevronUp } from 'lucide-react';

// Imported Sub-Components
import TopBar from './components/shop/TopBar';
import StartMenu from './components/screens/StartMenu';
import Codex from './components/screens/Codex';
import ShopScreen from './components/screens/ShopScreen';
import GameOverScreen from './components/screens/GameOverScreen';
import VictoryScreen from './components/screens/VictoryScreen';
import RoundOverScreen from './components/screens/RoundOverScreen';

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.START_MENU);
  const [round, setRound] = useState(1);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);

  // 初始化 PlayerState，使用 createEnergyBatch
  const [player, setPlayer] = useState<PlayerState>({
    hp: INITIAL_PLAYER_HP,
    // 修改点：将 EnergyType[] 转换为 EnergyUnit[]
    energyQueue: createEnergyBatch(INITIAL_ENERGY[0], INITIAL_ENERGY.length),
    income: [...INITIAL_INCOME],
    energyRetention: INITIAL_RETENT,
    adventurePoints: INITIAL_ADVENTURE_POINTS,
    tavernTier: 1,
    tavernUpgradeCost: getBaseTavernCost(1),
    hand: Array(7).fill(null),
    shopSlots: 3, // 补充缺失字段，假设默认为 3
    maxHp: INITIAL_PLAYER_HP, // 补充缺失字段
    level: 1, // 补充缺失字段
    exp: 0 // 补充缺失字段
  });

  const [shopCards, setShopCards] = useState<CardData[]>([]);
  const [isShopLocked, setIsShopLocked] = useState(false);

  const [enemyConfig, setEnemyConfig] = useState<CardData[]>([]);
  const [roundSummary, setRoundSummary] = useState<RoundSummary | null>(null);

  const [hoveredCardInfo, setHoveredCardInfo] = useState<{ card: CardData, rect: DOMRect } | null>(null);

  const [language, setLanguage] = useState<Language>('en');
  const t = getTranslation(language);

  const [notifications, setNotifications] = useState<string[]>([]);

  // Transition & Effect States
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pendingTurnEffects, setPendingTurnEffects] = useState<{ gold: number, effects: string[] } | null>(null);

  // Custom Hooks
  const { calculateTurnEndEffects } = useCardEffects(language);

  // Initialize Audio Context on first interaction
  const [audioInited, setAudioInited] = useState(false);
  const handleInteraction = () => {
    if (!audioInited) {
      initAudio();
      setAudioInited(true);
    }
  };

  // --- 核心修改：刷新商店 ---
  const refreshShop = (tierOverride?: number) => {
    // 如果不是强制刷新（比如初始化或回合开始），则需要支付能量
    if (tierOverride === undefined) {
      const refreshCost = 1;
      const costReq = createWhiteEnergyRequest(refreshCost);
      const result = tryPayEnergy(costReq, player.energyQueue);

      if (result.success) {
        setPlayer(prev => ({ ...prev, energyQueue: result.newQueue }));

        // 只有支付成功才刷新卡牌
        const tier = player.tavernTier;
        const newShop: CardData[] = [];
        const count = Math.min(6, 3 + tier); // 这里用简单逻辑，也可以复用 player.shopSlots
        for (let i = 0; i < count; i++) {
          newShop.push(generateRandomCard(tier));
        }
        setShopCards(newShop);
        // 支付失败不刷新
      }
    } else {
      // 强制刷新（无消耗，用于回合开始等）
      const tier = tierOverride;
      const newShop: CardData[] = [];
      const count = Math.min(6, 3 + tier);
      for (let i = 0; i < count; i++) {
        newShop.push(generateRandomCard(tier));
      }
      setShopCards(newShop);
    }
  };

  const handleStartGame = () => {
    handleInteraction();
    playSound('click');
    const initialTier = 1;
    setPlayer({
      hp: INITIAL_PLAYER_HP,
      maxHp: INITIAL_PLAYER_HP,
      energyQueue: createEnergyBatch(INITIAL_ENERGY[0], INITIAL_ENERGY.length), // 使用工厂
      income: [...INITIAL_INCOME],
      energyRetention: INITIAL_RETENT,
      adventurePoints: INITIAL_ADVENTURE_POINTS,
      tavernTier: initialTier,
      tavernUpgradeCost: getBaseTavernCost(initialTier),
      hand: Array(7).fill(null),
      shopSlots: 3,
      level: 1,
      exp: 0
    });
    setRound(1);
    setIsInfiniteMode(false);
    setRoundSummary(null);
    setEnemyConfig([]);
    setNotifications([]);
    setIsShopLocked(false);
    setPendingTurnEffects(null);
    setIsTransitioning(false);

    refreshShop(initialTier);
    setPhase(GamePhase.SHOP);
  };

  const handleOpenCodex = () => {
    handleInteraction();
    playSound('click');
    setPhase(GamePhase.CODEX);
  };

  const handleBackToMenu = () => {
    handleInteraction();
    playSound('click');
    setPhase(GamePhase.START_MENU);
  };

  const handleCardHover = (card: CardData, rect: DOMRect) => {
    handleInteraction();
    setHoveredCardInfo({ card, rect });
  };

  const handleCardLeave = () => {
    setHoveredCardInfo(null);
  };

  // --- 新增：处理酒馆升级 ---
  const handleLevelUpTavern = () => {
    const costReq = createWhiteEnergyRequest(player.tavernUpgradeCost);
    const result = tryPayEnergy(costReq, player.energyQueue);

    if (result.success) {
      setPlayer(prev => ({
        ...prev,
        energyQueue: result.newQueue,
        tavernTier: prev.tavernTier + 1,
        tavernUpgradeCost: getBaseTavernCost(prev.tavernTier + 1), // 更新下次升级费用
        shopSlots: Math.min(6, prev.shopSlots + 1)
      }));
      playSound('upgrade');
    } else {
      playSound('error');
    }
  };

  // --- 新增：处理购买卡牌 ---
  const handleBuyCard = (card: CardData) => {
    const cost = 3; // 暂时固定为 3
    const costReq = createWhiteEnergyRequest(cost);

    // 先检查有没有空位
    const emptySlotIndex = player.hand.findIndex(slot => slot === null);
    if (emptySlotIndex === -1) {
      playSound('error'); // 手牌已满
      return;
    }

    const result = tryPayEnergy(costReq, player.energyQueue);

    if (result.success) {
      setPlayer(prev => {
        const newHand = [...prev.hand];
        newHand[emptySlotIndex] = { ...card, unitCount: 1, justBought: Date.now() };

        // 这里省略了三连逻辑，简化处理

        return {
          ...prev,
          energyQueue: result.newQueue,
          hand: newHand
        };
      });

      setShopCards(prev => prev.filter(c => c.id !== card.id));
      playSound('buy');
    } else {
      playSound('error');
    }
  };

  const nextEnemies = useMemo(() => getEnemyComposition(round), [round]);

  const playerArmyValue = useMemo(() => {
    return player.hand.reduce((total, card) => total + (card ? card.value : 0), 0);
  }, [player.hand]);

  const enemyArmyValue = useMemo(() => {
    return enemyConfig.reduce((total, card) => total + card.value, 0);
  }, [enemyConfig]);

  // --- 核心修改：开始战斗 ---
  const startCombat = () => {
    handleInteraction();
    if (isTransitioning) return;

    playSound('click');
    setNotifications([]);
    setHoveredCardInfo(null);
    setIsTransitioning(true);

    const { newHand, goldGenerated, summaryEffects } = calculateTurnEndEffects(player.hand);

    const safeGoldGenerated = Number.isNaN(Number(goldGenerated)) ? 0 : Number(goldGenerated);

    setPlayer(prev => ({
      ...prev,
      // 这里的逻辑可能需要调整：是现在截断，还是回合结束再截断？
      // 保持原逻辑：战斗开始时截断能量
      energyQueue: prev.energyRetention > 0
        ? prev.energyQueue.slice(-prev.energyRetention) // 保留最后 N 个 EnergyUnit
        : [],
      hand: newHand
    }));

    if (summaryEffects.length > 0) {
      playSound('upgrade');
    }

    setPendingTurnEffects({
      gold: safeGoldGenerated,
      effects: summaryEffects
    });

    setTimeout(() => {
      setEnemyConfig(nextEnemies);
      setPhase(GamePhase.COMBAT);
      setIsTransitioning(false);
      setHoveredCardInfo(null);
    }, BATTLE_START_DELAY);
  };

  const handleBattleEnd = (winner: 'PLAYER' | 'ENEMY') => {
    if (winner === 'PLAYER' && round === MAX_ROUNDS && !isInfiniteMode) {
      setPhase(GamePhase.VICTORY);
      return;
    }

    let damage = 0;
    if (winner === 'ENEMY') {
      damage = 1;
      const newHp = player.hp - damage;
      setPlayer(prev => ({ ...prev, hp: newHp }));

      if (newHp <= 0) {
        setPhase(GamePhase.GAME_OVER);
        return;
      }
    }

    const nextIncomeQueue = [...player.income];
    if (nextIncomeQueue.length < MAX_INCOME_CAP) {
      // 这里的 EnergyType.WHITE 是合法的，因为 income 是 (Type | Config)[]
      nextIncomeQueue.push(EnergyType.WHITE);
    }

    const effectEnergyCount = Number(pendingTurnEffects?.gold) || 0;
    const effectTexts = pendingTurnEffects?.effects || [];

    setRoundSummary({
      winner,
      damageTaken: damage,
      baseIncome: nextIncomeQueue, // 传递给 Summary 展示用
      effectGold: effectEnergyCount,
      adventurePointsEarned: 1,
      effects: Array.from(new Set(effectTexts))
    });
    setPhase(GamePhase.ROUND_OVER);
  };

  const handleEnterInfiniteMode = () => {
    setIsInfiniteMode(true);
    handleBattleEnd('PLAYER');
  };

  // --- 核心修改：下一回合 ---
  const handleNextRound = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleInteraction();
    playSound('click');

    const won = roundSummary?.winner === 'PLAYER';
    const nextRound = won ? round + 1 : round;
    setRound(nextRound);

    const effectEnergyCount = Number(pendingTurnEffects?.gold) || 0;

    // 1. Calculate New Income Structure
    const nextIncomeQueue = [...player.income];
    if (nextIncomeQueue.length < MAX_INCOME_CAP) {
      nextIncomeQueue.push(EnergyType.WHITE);
    }

    // 2. Prepare New Energy Batch (Convert Type/Config to Unit)
    // 假设 income 目前全是 EnergyType.WHITE，复杂 Config 解析可以在 createEnergyBatch 扩展后支持
    // 这里暂时简单处理：只生成白色。如果 income 里有其他颜色，需要更复杂的 mapping

    // 生成基础收入的 Unit
    // 注意：createEnergyBatch 目前只支持单一类型，我们需要遍历 income 生成
    const incomeUnits = nextIncomeQueue.flatMap(item => {
      // 简单处理：如果是对象取 type，如果是字符串直接用
      const type = (typeof item === 'object') ? item.type : item;
      return createEnergyBatch(type, 1);
    });

    // 生成特效奖励的 Unit
    const effectUnits = createEnergyBatch(EnergyType.WHITE, Math.max(0, Math.floor(effectEnergyCount)));

    const newEnergyBatch = [...incomeUnits, ...effectUnits];

    // Phase 1: 更新玩家状态 (除了 energyQueue)
    setPlayer(prev => ({
      ...prev,
      income: nextIncomeQueue,
      adventurePoints: Math.min(prev.adventurePoints + 1, MAX_ADVENTURE_POINTS),
      tavernUpgradeCost: Math.max(0, prev.tavernUpgradeCost - 1),
    }));

    setEnemyConfig([]);
    setPendingTurnEffects(null);
    setRoundSummary(null);

    if (!isShopLocked) {
      refreshShop(player.tavernTier); // 强制刷新
    } else {
      setIsShopLocked(false);
    }

    setPhase(GamePhase.SHOP);

    // Phase 2: 注入新能量
    setTimeout(() => {
      setPlayer(prev => ({
        ...prev,
        energyQueue: [...prev.energyQueue, ...newEnergyBatch]
      }));
    }, 500);
  };

  const toggleLanguage = () => {
    handleInteraction();
    playSound('click');
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  const handleRestart = () => {
    handleInteraction();
    playSound('click');
    setPhase(GamePhase.START_MENU);
    setRound(1);
    setIsInfiniteMode(false);
    // 重置逻辑也要更新
    setPlayer({
      hp: INITIAL_PLAYER_HP,
      maxHp: INITIAL_PLAYER_HP,
      energyQueue: createEnergyBatch(INITIAL_ENERGY[0], INITIAL_ENERGY.length),
      income: [...INITIAL_INCOME],
      energyRetention: INITIAL_RETENT,
      adventurePoints: INITIAL_ADVENTURE_POINTS,
      tavernTier: 1,
      tavernUpgradeCost: getBaseTavernCost(1),
      hand: Array(7).fill(null),
      shopSlots: 3,
      level: 1,
      exp: 0
    });
    setShopCards([]);
    setIsShopLocked(false);
    setEnemyConfig([]);
    setRoundSummary(null);
    setHoveredCardInfo(null);
    setNotifications([]);
    setPendingTurnEffects(null);
    setIsTransitioning(false);
  };

  if (phase === GamePhase.START_MENU) {
    return <StartMenu t={t} onStartGame={handleStartGame} onOpenCodex={handleOpenCodex} onToggleLanguage={toggleLanguage} onInteraction={handleInteraction} />;
  }

  if (phase === GamePhase.CODEX) {
    return (
      <>
        <Codex
          language={language}
          t={t}
          onBackToMenu={handleBackToMenu}
          onInteraction={handleInteraction}
          onHover={handleCardHover}
          onLeave={handleCardLeave}
        />
        {hoveredCardInfo && (
          <CardInfoPanel
            card={hoveredCardInfo.card}
            rect={hoveredCardInfo.rect}
            language={language}
          />
        )}
      </>
    );
  }

  if (phase === GamePhase.GAME_OVER) {
    return <GameOverScreen t={t} round={round} onRestart={handleRestart} />;
  }

  if (phase === GamePhase.VICTORY) {
    return <VictoryScreen t={t} onContinue={handleEnterInfiniteMode} onBackToMenu={handleBackToMenu} />;
  }

  return (
    <div className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black text-slate-100 font-sans flex flex-col h-screen overflow-hidden" onClick={handleInteraction}>
      <TopBar
        player={player}
        round={round}
        t={t}
        language={language}
        onBackToMenu={handleBackToMenu}
        onAbandon={handleRestart}
        phase={phase}
        // TopBar 内部需要适配 EnergyUnit[] 的展示，或者我们在传参前做个转换
        // 暂时假设 TopBar 已经（或者将会）适配
        onLevelUpTavern={handleLevelUpTavern}
      />

      <div className="flex-1 flex flex-col relative min-h-0">
        {(phase === GamePhase.COMBAT || phase === GamePhase.ROUND_OVER) && (
          <div className="flex-1 p-6 flex items-center justify-center relative bg-slate-900">
            {phase === GamePhase.COMBAT && (
              <div className="w-full h-full flex items-center justify-center p-4">
                <div className="w-full max-w-6xl aspect-video relative shadow-2xl rounded-xl overflow-hidden border border-slate-700">
                  <BattleCanvas
                    playerHand={player.hand}
                    enemyConfig={enemyConfig}
                    playerValue={playerArmyValue}
                    enemyValue={enemyArmyValue}
                    language={language}
                    onBattleEnd={handleBattleEnd}
                    phase={phase}
                  />
                </div>
              </div>
            )}
            {phase === GamePhase.ROUND_OVER && roundSummary && (
              <RoundOverScreen summary={roundSummary} t={t} onNextRound={handleNextRound} />
            )}
          </div>
        )}

        {phase === GamePhase.SHOP && (
          <ShopScreen
            player={player}
            setPlayer={setPlayer}
            shopCards={shopCards}
            setShopCards={setShopCards}
            isShopLocked={isShopLocked}
            setIsShopLocked={setIsShopLocked}
            refreshShop={() => refreshShop()} // 传递无参版本给子组件
            enemyConfig={nextEnemies}
            round={round}
            isTransitioning={isTransitioning}
            onStartCombat={startCombat}
            onBuyCard={handleBuyCard} // 传递新的购买逻辑
            onCardHover={handleCardHover}
            onCardLeave={handleCardLeave}
            setNotifications={setNotifications}
            playSound={playSound}
            handleInteraction={handleInteraction}
            language={language}
            t={t}
            // 需要传递新的 Action 给 ShopScreen -> ShopPanel
            onLevelUpTavern={handleLevelUpTavern}
          />
        )}

        <div className="fixed bottom-32 right-8 flex flex-col gap-2 pointer-events-none z-50">
          {notifications.map((note, i) => (
            <div key={i} className="bg-slate-900/90 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg shadow-xl animate-in slide-in-from-right fade-in duration-300 flex items-center gap-3 backdrop-blur-md">
              <ChevronUp className="text-green-500" size={16} />
              <span className="font-bold text-sm">{note}</span>
            </div>
          ))}
        </div>

        {hoveredCardInfo && phase === GamePhase.SHOP && (
          <CardInfoPanel
            card={hoveredCardInfo.card}
            rect={hoveredCardInfo.rect}
            language={language}
          />
        )}
      </div>
    </div>
  );
};

export default App;