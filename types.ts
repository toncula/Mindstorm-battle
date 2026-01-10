export * from './types/energy';
export * from './types/hooks'; 
import { EnergyUnit, EnergyType, EnergyConfig } from './types/energy';

export enum UnitType {
  MELEE = 'MELEE',
  RANGED = 'RANGED',
  BUFFER = 'BUFFER', 
  SPLASHER = 'SPLASHER', 
  HERO = 'HERO'
}

export type SpecialEffectId = 
  | 'MILITIA_GROWTH'       // +2 number at end of turn
  | 'TAVERN_GROWTH'        // +2 number on tavern upgrade
  | 'SELL_BUFF_RIGHT'      // +1 number to right card on sell
  | 'SUMMON_ESCORT'        // Summon escort on buy
  | 'ADJACENT_GROWTH'      // +1 number per adjacent melee/ranged
  | 'PASSIVE_GOLD'         // +1 gold start of turn
  | 'ENTRY_TYPE_GROWTH'    // +1 number per unit type on buy
  | 'SELL_TRIGGER_GROWTH'  // +1 number on first sell
  | 'MELEE_BUFF_ON_ENTER'     // +1 number to all melee cards when entered
  | 'GROWTH_ON_SELL'          // +1 number when you sell a card
  | 'GROWTH_ON_LARGE_SELL'    // +2 number if you sell a card with > 10 units
  | 'LEFTMOST_GROWTH'         // +1 number to the leftmost card at end of turn
  | 'ALL_MELEE_GROWTH'        // All melee units +1 number at end of turn
  | 'INHERIT_HALF_ON_SELL'    // Gain half of the number when a card is sold
  | 'GROWTH_ON_UPGRADED_SELL' // +3 number for each upgrade on sold card
  ;

export interface StatModifiers {
  hp: number;
  damage: number;
  attackCooldown: number; 
  range: number;
  moveSpeed: number;
}

export interface StatChange {
  hp: number;
  damage: number;
  attackCooldown: number;
}

export type Rarity = 'COMMON' | 'RARE' | 'LEGENDARY';
export type Mood = 'SUPER_GOOD' | 'GOOD' | 'MODERATE' | 'BAD';

export interface OracleOmen {
  mood: Mood;
  text: string;
  tongue: string; // The narrative style chosen by AI
}

export interface Trait {
  name: string;
  rarity: Rarity;
}

export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  unitType: UnitType;
  value: number;
  rarity: Rarity;
  baseStats: CardStats;
}

export type AdventureOutcomeType = 'NEUTRAL' | 'CHANGE' | 'PROMOTION';

export interface AdventureOption {
  title: string;
  description: string;
  traitName: string;
  resultFlavor: string;
  outcomeType: AdventureOutcomeType;
  statChange?: StatChange; 
  promotionUnit?: {           
    name: string;
    description: string;
    unitType: UnitType;
    baseStats: CardStats;
    specialEffect?: SpecialEffectId;
  };
}

export interface CardStats {
  hp: number;
  damage: number;
  range: number;
  attackCooldown: number; 
  moveSpeed: number;
  color: string;
  aoeRadius?: number;
  buffRadius?: number; 
  buffStats?: {        
      damage: number;
      attackSpeed: number;
      range?: number;
  };
}

export interface CardData {
  id: string;
  templateId: string;
  name: string;
  description: string;
  cost: number;
  tier: number;
  value: number; 
  unitType: UnitType;
  unitCount: number;
  isGolden?: boolean; 
  /** @deprecated Migrating to traits array */
  specialEffect?: SpecialEffectId;
  baseStats: CardStats;
  traits?: string[];
  upgrades: UpgradeOption[];
  justBought?: number; 
  lastAdventureEvent?: string;
  lastAdventureDescription?: string;
}

export interface CombatUnit {
  id: string;
  templateId?: string;
  name: string; 
  team: 'PLAYER' | 'ENEMY';
  unitType: UnitType;
  value: number; 
  x: number;
  y: number;
  radius: number;
  maxHp: number;
  currentHp: number;
  baseDamage: number; 
  damage: number;     
  range: number;
  baseCooldown: number; 
  cooldown: number;
  maxCooldown: number; 
  moveSpeed: number;
  color: string;
  targetId: string | null;
  hitFlashTimer?: number;
  aoeRadius?: number;
  
  buffRadius?: number;
  buffStats?: {
      damage: number;
      attackSpeed: number;
      range?: number;
  };
  currentBuffs: {
      damage: number;
      attackSpeed: number;
      range: number; 
  };

  animState: 'IDLE' | 'MOVE' | 'ATTACK';
  animTimer: number;
  lastTargetX?: number; 
  lastTargetY?: number;
}

export enum GamePhase {
  START_MENU = 'START_MENU',
  CODEX = 'CODEX',
  SHOP = 'SHOP',
  COMBAT = 'COMBAT',
  ROUND_OVER = 'ROUND_OVER',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export interface RoundSummary {
    winner: 'PLAYER' | 'ENEMY';
    damageTaken: number;
    baseGold: number; // Technically baseEnergy now, keeping name to minimize refactor friction in engine
    effectGold: number;
    adventurePointsEarned: number;
    effects: string[];
}


export interface PlayerState {
  hp: number;
  // gold: number; // REMOVED
  energyQueue: EnergyUnit[]; // REPLACED gold
  income: EnergyConfig[]; 
  energyRetention: number;
  adventurePoints: number; // Kept for structure, though unused visibly
  tavernTier: number;
  tavernUpgradeCost: number;
  hand: (CardData | null)[];
}
