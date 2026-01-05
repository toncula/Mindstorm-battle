// 基础能量类型
export enum EnergyType {
    WHITE = 'WHITE',
    RED = 'RED',
    GREEN = 'GREEN',
    BLUE = 'BLUE',
    BLACK = 'BLACK',
}
//复合能量数组
export const  EnergyTypeArray = {
    ALL: [
        EnergyType.WHITE,
        EnergyType.RED,
        EnergyType.GREEN,
        EnergyType.BLUE,
        EnergyType.BLACK
    ],
    COLURED: [
    EnergyType.RED,
    EnergyType.GREEN,
    EnergyType.BLUE
    ]
}

// 能量特性枚举
export enum EnergyTrait {
    SHINY = 'SHINY',           // 闪亮：很亮，测试用
    EPHEMERAL = 'EPHEMERAL',   // 临时：回合结束时摧毁
}

// 核心能量单元结构
export interface EnergyUnit {
    id: string;              // 唯一标识符 (UUID)
    type: EnergyType;        // 基础颜色
    traits: Set<EnergyTrait>;// 特性集合
    metadata: Record<string, any>; // 动态元数据 (例如创建来源、创建回合等)
}

// 能量配置结构 (用于描述未来的收入，还没有实例化)
export interface EnergyConfig {
    type: EnergyType;
    traits: Set<EnergyTrait>; // 预设特性列表
}



export interface ComplexCostRequirement {
    // 1. 颜色逻辑 (支持 OR)
    // 如果为空，代表 "Any Color" (万能支付位)
    allowedTypes?: EnergyType[];

    // 2. 特性逻辑 (支持 AND)
    // 必须拥有的特性 (例如：必须是 SHINY)
    requiredTraits?: EnergyTrait[];

    // 3. 排除逻辑 (支持 NOT)
    // 不能拥有的特性 (例如：不能是 FROZEN)
    forbiddenTraits?: EnergyTrait[];
}

//能量支付需求
export type EnergyCostRequirement =
    | EnergyType                  // 情况1：简写，必须是特定颜色，忽略特性
    | ComplexCostRequirement;     // 情况2：复杂逻辑