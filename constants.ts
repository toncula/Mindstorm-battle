
import { CardData, UnitType } from './types';
import { CARD_TEMPLATES } from './data/cardTemplates';
import { EnergyType } from './types';
export { CARD_TEMPLATES } from './data/cardTemplates';
// Export UPGRADES from its data source to fix missing export error in Codex
export { UPGRADES } from './data/upgrades';

// --- DEBUG OPTIONS ---
export const DEBUG_ADVENTURE_LOG = true;

// --- GAMEPLAY CONFIG ---
export const INITIAL_ENERGY = [EnergyType.WHITE, EnergyType.WHITE, EnergyType.WHITE]
export const INITIAL_PLAYER_HP = 3;
export const INITIAL_INCOME = [EnergyType.WHITE, EnergyType.WHITE, EnergyType.WHITE];
export const ADDTIONAL_INCOME = [];
export const INITIAL_RETENT = 1;
export const MAX_INCOME_CAP = 10;
//export const INITIAL_GOLD = 3; 
export const INITIAL_ADVENTURE_POINTS = 6;
export const MAX_ADVENTURE_POINTS = 6;
//export const ADVENTURE_COST = 2;
//export const ADVENTURE_REFUND = 1;
export const REFRESH_COST = [EnergyType.WHITE];
export const TAVERN_UPGRADE_BASE_COST = 3;
export const MAX_ROUNDS = 12;

// --- TIME & SIMULATION CONSTANTS ---
export const FPS = 60;
export const FIXED_STEP = 1000 / FPS;

// Battle Timings (in frames/ticks)
export const BATTLE_START_DELAY = 1000; // ms
export const HIT_FLASH_TICKS = 5;
export const ATTACK_ANIM_TICKS = 15;
export const EXPLOSION_TICKS = 20;
export const FLOAT_TEXT_TICKS = 50;
export const PARTICLE_BASE_LIFE = 20;
export const PROJECTILE_MIN_FLIGHT_FRAMES = 20;
export const ENDING_PHASE_DELAY = 60; // frames before showing summary

// UI Timings (in ms)
export const BUY_ANIM_DURATION = 600;
export const GROWTH_ANIM_DURATION = 800;
export const SOLD_EFFECT_CLEANUP_DELAY = 600;
export const RECENT_PURCHASE_WINDOW = 1200;
export const SHAKE_ANIM_DURATION = 300;
export const FLASH_ANIM_DURATION = 200;

// Helper to determine the starting cost for the NEXT tier
export const getBaseTavernCost = (level: number) => {
  switch (level) {
    case 1: return 4;
    case 2: return 7;
    case 3: return 9;
    case 4: return 11;
    default: return 999;
  }
};

export const generateRandomCard = (maxTier: number, minTier: number = 1): CardData => {
  let available = CARD_TEMPLATES.filter(c => c.tier <= maxTier && c.tier >= minTier);
  
  if (available.length === 0) {
      available = CARD_TEMPLATES.filter(c => c.tier <= maxTier);
  }

  const template = available[Math.floor(Math.random() * available.length)];
  return {
    ...template,
    id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    traits: [],
    // Added upgrades property to satisfy CardData interface
    upgrades: []
  };
};

export const getEffectiveStats = (card: CardData) => {
    const base = card.baseStats;
    const cooldownFrames = Math.max(10, base.attackCooldown);
    const attackInterval = cooldownFrames / FPS; 

    return {
        ...base,
        unitType: card.unitType,
        value: card.value,
        cooldownFrames,
        attackInterval
    };
};
