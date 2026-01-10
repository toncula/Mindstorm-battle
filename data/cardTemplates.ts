import { CardData, UnitType } from '../types';

// ------------------------------------------------------------------
// 辅助函数：补全 CardData 缺失的运行时字段
// ------------------------------------------------------------------
const defineCard = (
  // 允许输入 Partial 数据，加上旧字段以便迁移
  data: Partial<CardData> & { specialEffect?: string }
): CardData => {
  // 1. 自动迁移 SpecialEffect -> Traits
  // 如果模板里写了 specialEffect，通过这里自动转为 trait，配合 Hook 系统使用
  const traits = [...(data.traits || [])];
  if (data.specialEffect && !traits.includes(data.specialEffect)) {
    traits.push(data.specialEffect);
  }

  // 2. 补全 CardData 必需的字段
  return {
    // 默认使用 templateId 作为 id (如果在运行时创建，id 会被 uuid 覆盖)
    id: data.templateId || 'unknown_id',
    templateId: data.templateId || 'unknown_template',

    name: data.name || 'Unknown',
    description: data.description || '',
    cost: data.cost ?? 3,
    tier: data.tier ?? 1,
    value: data.value ?? 0,

    // ✅ 关键修正：直接使用传入的 unitType，不做任何转换
    unitType: data.unitType ?? UnitType.MELEE,

    unitCount: data.unitCount ?? 1,
    baseStats: data.baseStats || { hp: 1, damage: 0, range: 0, attackCooldown: 0, moveSpeed: 0, color: '#fff' },

    // 应用迁移后的 traits
    traits: traits,

    // 初始化空数组/对象
    upgrades: [],

    // 允许保留 specialEffect 字段以兼容旧代码（虽然 interface 里标记了 deprecated）
    specialEffect: data.specialEffect,

    // 展开传入的其他所有属性，确保不丢失任何数据
    ...data,
  } as CardData;
};

// ------------------------------------------------------------------
// 模板定义 (使用 Record 字典结构，以便通过 ID 快速查找)
// ------------------------------------------------------------------
export const CARD_TEMPLATES: Record<string, CardData> = {
  // --- TIER 1 ---
  'c_militia': defineCard({
    templateId: 'c_militia',
    name: 'Militia',
    description: 'The kingdom\'s last line of defense, armed with pitchforks and unwavering courage.',
    cost: 3,
    tier: 1,
    value: 10,
    unitType: UnitType.MELEE,
    unitCount: 3,
    traits: ['MILITIA_GROWTH'],
    baseStats: { hp: 35, damage: 3, range: 10, attackCooldown: 40, moveSpeed: 1.5, color: '#94a3b8' }
  }),

  'c_archers': defineCard({
    templateId: 'c_archers',
    name: 'Archers',
    description: 'Trained in the high towers, their synchronized volleys can blot out the sun.',
    cost: 3,
    tier: 1,
    value: 15,
    unitType: UnitType.RANGED,
    unitCount: 2,
    specialEffect: 'TAVERN_GROWTH',
    baseStats: { hp: 35, damage: 8, range: 125, attackCooldown: 45, moveSpeed: 1.2, color: '#22c55e' }
  }),

  'c_ranger': defineCard({
    templateId: 'c_ranger',
    name: 'Ranger',
    description: 'A solitary hunter who passes his survival techniques to his kin before vanishing into the wild.',
    cost: 3,
    tier: 1,
    value: 20,
    unitType: UnitType.RANGED,
    unitCount: 1,
    specialEffect: 'SELL_BUFF_RIGHT',
    baseStats: { hp: 120, damage: 45, range: 100, attackCooldown: 135, moveSpeed: 1.4, color: '#f59e0b' }
  }),

  'c_ballista': defineCard({
    templateId: 'c_ballista',
    name: 'Ballista',
    description: 'Heavy siege weaponry that is so valuable it requires a dedicated guard detail to operate.',
    cost: 3,
    tier: 1,
    value: 18,
    unitType: UnitType.SPLASHER,
    unitCount: 1,
    specialEffect: 'SUMMON_ESCORT',
    baseStats: { hp: 80, damage: 16, range: 140, attackCooldown: 110, moveSpeed: 0.8, color: '#ea580c', aoeRadius: 30 }
  }),

  // --- TIER 2 ---
  'c_shielder': defineCard({
    templateId: 'c_shielder',
    name: 'Shielder',
    description: 'Their shield wall is impenetrable, growing stronger with every soldier standing shoulder-to-shoulder.',
    cost: 3,
    tier: 2,
    value: 25,
    unitType: UnitType.MELEE,
    unitCount: 2,
    specialEffect: 'ADJACENT_GROWTH',
    baseStats: { hp: 90, damage: 4, range: 10, attackCooldown: 60, moveSpeed: 1.0, color: '#0ea5e9' }
  }),

  'c_scouts': defineCard({
    templateId: 'c_scouts',
    name: 'Scouts',
    description: 'They traverse the borders ahead of the main force, returning with gold seized from enemy supply lines.',
    cost: 3,
    tier: 2,
    value: 22,
    unitType: UnitType.RANGED,
    unitCount: 3,
    traits: ['PASSIVE_GOLD'],
    baseStats: { hp: 35, damage: 6, range: 90, attackCooldown: 30, moveSpeed: 1.6, color: '#14b8a6' }
  }),

  'c_mage': defineCard({
    templateId: 'c_mage',
    name: 'Mage',
    description: 'An arcanist who draws power from the diversity of the legion, weaving it into arcane storms.',
    cost: 3,
    tier: 2,
    value: 30,
    unitType: UnitType.SPLASHER,
    unitCount: 1,
    specialEffect: 'ENTRY_TYPE_GROWTH',
    baseStats: { hp: 50, damage: 8, range: 110, attackCooldown: 80, moveSpeed: 1.0, color: '#8b5cf6', aoeRadius: 50 }
  }),

  'c_veteran': defineCard({
    templateId: 'c_veteran',
    name: 'Veteran',
    description: 'Old scars tell stories of survival. His presence rallies the troops whenever the ranks are thinned.',
    cost: 3,
    tier: 2,
    value: 40,
    unitType: UnitType.BUFFER,
    unitCount: 1,
    specialEffect: 'SELL_TRIGGER_GROWTH',
    baseStats: {
      hp: 160, damage: 8, range: 15, attackCooldown: 50, moveSpeed: 1.1, color: '#e11d48',
      buffRadius: 75,
      buffStats: { damage: 1, attackSpeed: 0 }
    }
  }),

  // --- TIER 3 ---
  'c_centurion': defineCard({
    templateId: 'c_centurion',
    name: 'Centurion',
    description: 'A disciplined commander who strengthens the vanguard simply by arriving on the field.',
    cost: 3,
    tier: 3,
    value: 35,
    unitType: UnitType.MELEE,
    unitCount: 2,
    specialEffect: 'MELEE_BUFF_ON_ENTER',
    baseStats: { hp: 110, damage: 8, range: 12, attackCooldown: 50, moveSpeed: 1.2, color: '#b91c1c' }
  }),

  'c_crossbow': defineCard({
    templateId: 'c_crossbow',
    name: 'Crossbowmen',
    description: 'Wielding heavy bolts that can pierce armor, they recruit more soldiers with the spoils of war.',
    cost: 3,
    tier: 3,
    value: 32,
    unitType: UnitType.RANGED,
    unitCount: 2,
    specialEffect: 'GROWTH_ON_SELL',
    baseStats: { hp: 40, damage: 14, range: 130, attackCooldown: 70, moveSpeed: 1.0, color: '#4d7c0f' }
  }),

  'c_mangonel': defineCard({
    templateId: 'c_mangonel',
    name: 'Mangonel',
    description: 'A mobile catapult that wreaks havoc. Its crew expands significantly when a large legion is disbanded.',
    cost: 3,
    tier: 3,
    value: 45,
    unitType: UnitType.SPLASHER,
    unitCount: 1,
    specialEffect: 'GROWTH_ON_LARGE_SELL',
    baseStats: { hp: 120, damage: 25, range: 150, attackCooldown: 130, moveSpeed: 0.7, color: '#c2410c', aoeRadius: 40 }
  }),

  'c_observer': defineCard({
    templateId: 'c_observer',
    name: 'Observer',
    description: 'A mystical eye that hovers above, granting immense range to its allies and strengthening the vanguard.',
    cost: 3,
    tier: 3,
    value: 50,
    unitType: UnitType.BUFFER,
    unitCount: 1,
    specialEffect: 'LEFTMOST_GROWTH',
    baseStats: {
      hp: 80, damage: 5, range: 200, attackCooldown: 60, moveSpeed: 1.5, color: '#06b6d4',
      buffRadius: 100,
      buffStats: { damage: 0, attackSpeed: 0, range: 100 }
    }
  }),

  // --- TIER 4 ---
  'c_commander': defineCard({
    templateId: 'c_commander',
    name: 'High Commander',
    description: 'A legendary hero who leads from the front, inspiring all melee units to limitless growth.',
    cost: 3,
    tier: 4,
    value: 80,
    unitType: UnitType.HERO,
    unitCount: 1,
    specialEffect: 'ALL_MELEE_GROWTH',
    baseStats: { hp: 300, damage: 25, range: 20, attackCooldown: 40, moveSpeed: 1.3, color: '#facc15' }
  }),

  'c_merc': defineCard({
    templateId: 'c_merc',
    name: 'Mercenary',
    description: 'Soldiers of fortune who absorb the manpower of dismissed squads.',
    cost: 3,
    tier: 4,
    value: 60,
    unitType: UnitType.MELEE,
    unitCount: 3,
    specialEffect: 'INHERIT_HALF_ON_SELL',
    baseStats: { hp: 90, damage: 10, range: 12, attackCooldown: 35, moveSpeed: 1.4, color: '#3f3f46' }
  }),

  'c_arcanist': defineCard({
    templateId: 'c_arcanist',
    name: 'Arcanist',
    description: 'A master of arcane arts who calls down destruction from the skies. Requires a diverse army to channel his power.',
    cost: 3,
    tier: 4,
    value: 75,
    unitType: UnitType.SPLASHER,
    unitCount: 1,
    specialEffect: 'ENTRY_TYPE_GROWTH',
    baseStats: { hp: 80, damage: 8, range: 200, attackCooldown: 80, moveSpeed: 0.5, color: '#1e3a8a', aoeRadius: 70 }
  }),

  'c_musketeer': defineCard({
    templateId: 'c_musketeer',
    name: 'Musketeer',
    description: 'Armed with black powder weapons. They value the quality of equipment over quantity of men.',
    cost: 3,
    tier: 4,
    value: 70,
    unitType: UnitType.RANGED,
    unitCount: 5,
    specialEffect: 'GROWTH_ON_UPGRADED_SELL',
    baseStats: { hp: 60, damage: 55, range: 140, attackCooldown: 160, moveSpeed: 1.0, color: '#1e293b' }
  }),

  // --- TOKEN (Tier 0) ---
  'c_escort': defineCard({
    templateId: 'c_escort',
    name: 'Escort',
    description: 'Handpicked soldiers sworn to protect the legion\'s heavy artillery at all costs.',
    cost: 0,
    tier: 0,
    value: 5,
    unitType: UnitType.MELEE,
    unitCount: 1,
    traits: [],
    baseStats: { hp: 50, damage: 4, range: 10, attackCooldown: 45, moveSpeed: 1.3, color: '#57534e' }
  }),
};