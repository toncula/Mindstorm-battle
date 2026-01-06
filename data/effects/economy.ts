import { SideEffect } from '../../types/hooks';
import { DomainHelpers, EffectHandler } from '../../hooks/effectHandlers';
import { createEnergyBatch } from '../../simulation/energyHelpers';
import { EnergyType } from '../../types';

export const EconomyEffects: Record<string, EffectHandler> = {
    // 获得金币 (白色能量)
    'GAIN_GOLD': (effect: SideEffect) => (state) => {
        if (!effect.amount || effect.amount <= 0) return state;

        return DomainHelpers.modifyEconomy(state, (queue) => {
            const gold = createEnergyBatch(EnergyType.WHITE, effect.amount!);
            return { newQueue: [...queue, ...gold] };
        });
    },

    // (示例) 获得特定颜色的能量
    'GAIN_ENERGY': (effect: SideEffect) => (state) => {
        if (!effect.amount || !effect.params?.energyType) return state;

        return DomainHelpers.modifyEconomy(state, (queue) => {
            const energy = createEnergyBatch(effect.params.energyType, effect.amount!);
            return { newQueue: [...queue, ...energy] };
        });
    }
};