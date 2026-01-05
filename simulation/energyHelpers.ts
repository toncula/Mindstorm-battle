import { EnergyUnit, EnergyType, EnergyTrait, EnergyConfig } from '../types/energy';

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
 * 创建一个新的能量请求
 * @param type 能量颜色
 * @param traits 初始特性列表
 * @returns EnergyConfig 对象
 */
export const createEnergyConfig = (type: EnergyType, traits: EnergyTrait[] = []):EnergyConfig => {
    return{
        type,
        traits: new Set(traits)
    };
};

/**
 * 批量创建单色的能量请求(用于收入)
 * @param type 
 * @param count 
 * @returns 
 */
export const createEnergyRequest = (type: EnergyType, count: number, traits: EnergyTrait[] = []): EnergyConfig[] => {
    return Array.from({ length: count }, () => createEnergyConfig(type, traits));
};
/**
 * 批量创建能量单元 (主要用于初始化)
 */
export const createEnergyBatch = (type: EnergyType, count: number, traits: EnergyTrait[] = []): EnergyUnit[] => {
    return Array.from({ length: count }, () => createEnergy(type, traits));
};
