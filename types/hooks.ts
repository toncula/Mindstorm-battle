// 定义通用的 TraitKey
export type TraitKey = string;

// 定义所有可能的触发时机
export enum HookType {
    // 基础检查
    CAN_ACT = 'CAN_ACT',             // 通用行为检查
    CAN_PAY_ENERGY = 'CAN_PAY_ENERGY', // 支付检查

    // 数值修改
    MODIFY_DAMAGE = 'MODIFY_DAMAGE', // 修改伤害值
    MODIFY_COST = 'MODIFY_COST',     // 修改价格

    // 生命周期 / 事件
    ON_TURN_START = 'ON_TURN_START',
    ON_TURN_END = 'ON_TURN_END',

    // 动作响应
    ON_BUY = 'ON_BUY',
    ON_SELL = 'ON_SELL',
    ON_REFRESH = 'ON_REFRESH',
    ON_TAVERN_UPGRADE = 'ON_TAVERN_UPGRADE',
    ON_LOCK = 'ON_LOCK',
    ON_PAY_ENERGY = 'ON_PAY_ENERGY'
}

// 最小实体接口：任何想要使用 Hook 系统的对象都必须至少长这样
export interface TraitEntity {
    id: string;
    // 支持 Set 或 Array，方便不同数据结构接入
    traits?: Set<TraitKey> | TraitKey[];
}

// 泛化的副作用接口
export interface SideEffect {
    type: string;
    [key: string]: any;
}

// 泛化的上下文
// T = 触发者的类型 (EnergyUnit, CardData, PlayerState...)
// P = 额外参数的类型 (比如攻击目标, 伤害数值...)
export interface HookContext<T = any, P = any> {
    self: T;             // 触发者
    gameState: any;      // 全局状态引用 (通常包含 player, round 等)
    params?: P;          // 触发时的特定参数
}

// Hook 执行结果
export interface HookResult {
    prevented?: boolean;        // 是否拦截操作 (用于 check)
    modifiedValue?: any;        // 修改后的数值 (用于 modify)
    sideEffects?: SideEffect[]; // 产生的副作用 (用于 trigger)
    notification?: string;      // 给 UI 的提示消息
}

// 处理器定义
export interface HookHandler<T = any, P = any> {
    priority?: number; // 优先级 (默认0，越高越先执行，用于数值修改或拦截顺序)
    execute: (context: HookContext<T, P>) => HookResult;
}