import { EnergyUnit, EnergyType, EnergyTrait } from '../types/energy';

/**
 * 创建一个新的能量单元
 * @param type 能量颜色
 * @param traits 初始特性列表
 * @returns EnergyUnit 对象
 */
export const createEnergy = (type: EnergyType, traits: EnergyTrait[] = []): EnergyUnit => {
    return {
        id: crypto.randomUUID(),
        type,
        traits: new Set(traits),
        metadata: {
            createdAt: Date.now()
        }
    };
};

/**
 * 批量创建能量单元 (主要用于初始化)
 */
export const createEnergyBatch = (type: EnergyType, count: number, traits: EnergyTrait[] = []): EnergyUnit[] => {
    return Array.from({ length: count }, () => createEnergy(type, traits));
};