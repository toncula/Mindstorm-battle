//legacy
import { UpgradeOption, UnitType } from '../types';

export const UPGRADES: UpgradeOption[] = [
  {
    id: 'up_knight',
    name: 'Royal Knight',
    description: 'A heavily armored frontline brawler with significant survivability.',
    unitType: UnitType.MELEE,
    value: 60,
    rarity: 'COMMON',
    baseStats: {
      hp: 200,
      damage: 10,
      range: 15,
      attackCooldown: 50,
      moveSpeed: 1.1,
      color: '#cbd5e1'
    }
  },
  {
    id: 'up_sharpshooter',
    name: 'Sharpshooter',
    description: 'Precision rifleman that can strike targets from immense distances.',
    unitType: UnitType.RANGED,
    value: 65,
    rarity: 'COMMON',
    baseStats: {
      hp: 70,
      damage: 35,
      range: 250,
      attackCooldown: 120,
      moveSpeed: 0.9,
      color: '#166534'
    }
  },
  {
    id: 'up_battle_mage',
    name: 'Battle Mage',
    description: 'Combines arcane destruction with enough armor to survive the frontlines.',
    unitType: UnitType.SPLASHER,
    value: 80,
    rarity: 'RARE',
    baseStats: {
      hp: 150,
      damage: 15,
      range: 120,
      attackCooldown: 70,
      moveSpeed: 1.0,
      color: '#a855f7',
      aoeRadius: 40
    }
  },
  {
    id: 'up_tactician',
    name: 'Grand Tactician',
    description: 'A strategic genius who significantly boosts the offense of nearby troops.',
    unitType: UnitType.BUFFER,
    value: 90,
    rarity: 'RARE',
    baseStats: {
      hp: 120,
      damage: 5,
      range: 100,
      attackCooldown: 60,
      moveSpeed: 1.2,
      color: '#3b82f6',
      buffRadius: 150,
      buffStats: {
        damage: 8,
        attackSpeed: 0.2,
        range: 50
      }
    }
  },
  {
    id: 'up_immortal',
    name: 'The Immortal',
    description: 'A legendary hero whose presence on the battlefield is nigh-unstoppable.',
    unitType: UnitType.HERO,
    value: 150,
    rarity: 'LEGENDARY',
    baseStats: {
      hp: 1200,
      damage: 50,
      range: 25,
      attackCooldown: 40,
      moveSpeed: 1.4,
      color: '#fde047'
    }
  },
  {
    id: 'up_colossus',
    name: 'Siege Colossus',
    description: 'A massive mechanical construct that rains destruction over a wide area.',
    unitType: UnitType.SPLASHER,
    value: 140,
    rarity: 'LEGENDARY',
    baseStats: {
      hp: 800,
      damage: 60,
      range: 180,
      attackCooldown: 150,
      moveSpeed: 0.6,
      color: '#57534e',
      aoeRadius: 80
    }
  }
];
