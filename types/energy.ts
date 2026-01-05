// 基础能量类型
export enum EnergyType {
    WHITE = 'WHITE',
    RED = 'RED',
    GREEN = 'GREEN',
    BLUE = 'BLUE',
    BLACK = 'BLACK'
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