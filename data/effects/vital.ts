import { SideEffect } from '../../types/hooks';
import { DomainHelpers, EffectHandler } from '../../hooks/effectHandlers';
import { INITIAL_PLAYER_HP } from '../../constants';

// 假设最大血量逻辑，如果常量中没有 MAX_HP，这里暂定一个或引入
const MAX_HP = 50;

export const VitalEffects: Record<string, EffectHandler> = {
    // 治疗玩家
    'HEAL_PLAYER': (effect: SideEffect) => (state) => {
        if (!effect.amount || effect.amount <= 0) return state;

        return DomainHelpers.modifyStats(state, (stats) => ({
            hp: Math.min(MAX_HP, stats.hp + effect.amount!)
        }));
    },

    // 伤害玩家 (自伤/惩罚)
    'DAMAGE_PLAYER': (effect: SideEffect) => (state) => {
        if (!effect.amount || effect.amount <= 0) return state;

        return DomainHelpers.modifyStats(state, (stats) => ({
            hp: Math.max(0, stats.hp - effect.amount!)
        }));
    },

    // 增加冒险点数 (经验值)
    'GAIN_XP': (effect: SideEffect) => (state) => {
        if (!effect.amount) return state;

        return DomainHelpers.modifyStats(state, (stats) => ({
            adventurePoints: stats.adventurePoints + effect.amount!
        }));
    }
};