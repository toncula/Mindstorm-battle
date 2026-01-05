import { 
    EnergyUnit,
    EnergyType,
    EnergyTrait,
    EnergyConfig,
    EnergyCostRequirement,
    ComplexCostRequirement} from '../types/energy';

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

/**
 * 简单需求创建工厂 (兼容旧代码)
 * 允许传入单个颜色（严格匹配）或颜色数组（多选一匹配）
 */
export const createSimpleCost = (type: EnergyType | EnergyType[], count: number): EnergyCostRequirement[] => {
    return Array.from({ length: count }, () => {
        if (Array.isArray(type)) {
            // 如果是数组，生成多选一的复杂需求
            return { allowedTypes: type };
        }
        // 如果是单个值，直接返回类型
        return type;
    });
};


/**
 * 灵活需求创建工厂 (Pattern Builder)
 * 用法:
 * createCost(EnergyType.RED, EnergyType.WHITE) -> [RED, WHITE]
 * createCost([EnergyType.RED, EnergyType.BLUE], EnergyType.WHITE) -> [{allowed: [RED, BLUE]}, WHITE]
 */
type CostArg = EnergyType | EnergyType[] | ComplexCostRequirement;

export const createCost = (...args: CostArg[]): EnergyCostRequirement[] => {
    return args.map(arg => {
        // 情况 1: 已经是复杂对象，直接返回
        if (typeof arg === 'object' && !Array.isArray(arg)) {
            return arg as ComplexCostRequirement;
        }

        // 情况 2: 数组 -> 转换为 allowedTypes (多选一)
        if (Array.isArray(arg)) {
            return { allowedTypes: arg };
        }

        // 情况 3: 单个枚举 -> 直接返回 (严格匹配)
        return arg as EnergyType;
    });
};