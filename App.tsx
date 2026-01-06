import React, { useState, useMemo } from 'react';
import { CardData, GamePhase } from './types';
import { useGameEngine } from './hooks/useGameEngine';
import { playSound } from './services/audioService';

// Components
import BattleCanvas from './components/battle/BattleCanvas';
import CardInfoPanel from './components/shop/cards/CardInfoPanel';
import TopBar from './components/shop/TopBar';
import StartMenu from './components/screens/StartMenu';
import Codex from './components/screens/Codex';
import ShopScreen from './components/screens/ShopScreen';
import GameOverScreen from './components/screens/GameOverScreen';
import VictoryScreen from './components/screens/VictoryScreen';
import RoundOverScreen from './components/screens/RoundOverScreen';

import { ChevronUp } from 'lucide-react';

/**
 * App.tsx 重构目标：
 * 1. 成为纯粹的 "状态机路由器" (State Machine Router)
 * 2. 移除所有业务逻辑，只保留 UI 布局和组件挂载
 */
const App: React.FC = () => {
  // 1. 获取游戏引擎核心
  const { gameState, actions } = useGameEngine();

  // 2. 解构状态以便使用
  const {
    phase, round, player, shopCards, enemyConfig,
    roundSummary, isShopLocked, isTransitioning,
    language, notifications, discoveryOptions, t
  } = gameState;

  // 3. UI 局部状态 (如悬停提示框位置，这属于纯视图层)
  const [hoveredCardInfo, setHoveredCardInfo] = useState<{ card: CardData, rect: DOMRect } | null>(null);

  const handleCardHover = (card: CardData, rect: DOMRect) => {
    actions.handleInteraction();
    setHoveredCardInfo({ card, rect });
  };

  const handleCardLeave = () => {
    setHoveredCardInfo(null);
  };

  const playerArmyValue = useMemo(() => {
    return player.hand.reduce((total, card) => total + (card ? card.value : 0), 0);
  }, [player.hand]);

  const enemyArmyValue = useMemo(() => {
    return enemyConfig.reduce((total, card) => total + card.value, 0);
  }, [enemyConfig]);

  // --- 4. 路由渲染 (View Routing) ---

  if (phase === GamePhase.START_MENU) {
    return (
      <StartMenu
        t={t}
        onStartGame={actions.startGame}
        onOpenCodex={actions.openCodex}
        onToggleLanguage={actions.toggleLanguage}
        onInteraction={actions.handleInteraction}
      />
    );
  }

  if (phase === GamePhase.CODEX) {
    return (
      <>
        <Codex
          language={language}
          t={t}
          onBackToMenu={actions.backToMenu}
          onInteraction={actions.handleInteraction}
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
    return <GameOverScreen t={t} round={round} onRestart={actions.restartGame} />;
  }

  if (phase === GamePhase.VICTORY) {
    return (
      <VictoryScreen
        t={t}
        onContinue={actions.enterInfiniteMode}
        onBackToMenu={actions.backToMenu}
      />
    );
  }

  // --- Main Game Layout ---
  return (
    <div
      className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black text-slate-100 font-sans flex flex-col h-screen overflow-hidden"
      onClick={actions.handleInteraction}
    >
      <TopBar
        player={player}
        round={round}
        t={t}
        language={language}
        onBackToMenu={actions.backToMenu}
        onAbandon={actions.restartGame}
        phase={phase}
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
                    onBattleEnd={actions.resolveBattle}
                    phase={phase}
                  />
                </div>
              </div>
            )}
            {phase === GamePhase.ROUND_OVER && roundSummary && (
              <RoundOverScreen
                summary={roundSummary}
                t={t}
                onNextRound={actions.advanceRound}
              />
            )}
          </div>
        )}

        {phase === GamePhase.SHOP && (
          <ShopScreen
            player={player}
            shopCards={shopCards}
            isShopLocked={isShopLocked}
            refreshShop={actions.refreshShop}
            enemyConfig={enemyConfig}
            round={round}
            isTransitioning={isTransitioning}
            discoveryOptions={discoveryOptions}
            actions={actions}
            onCardHover={handleCardHover}
            onCardLeave={handleCardLeave}
            playSound={playSound}
            language={language}
            t={t}
          />
        )}

        {/* Notifications Overlay */}
        <div className="fixed bottom-32 right-8 flex flex-col gap-2 pointer-events-none z-50">
          {notifications.map((note, i) => (
            <div key={i} className="bg-slate-900/90 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg shadow-xl animate-in slide-in-from-right fade-in duration-300 flex items-center gap-3 backdrop-blur-md">
              <ChevronUp className="text-green-500" size={16} />
              <span className="font-bold text-sm">{note}</span>
            </div>
          ))}
        </div>

        {/* Global Hover Tooltip */}
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