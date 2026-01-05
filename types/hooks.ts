import { EnergyUnit } from './energy';

// Hook 触发时机
export enum HookType {
    CAN_PAY_ENERGY = 'CAN_PAY_ENERGY',             // 验证：能否支付？
    ON_PAY_ENERGY = 'ON_PAY_ENERGY',               // 动作：支付后触发
    ON_TURN_START = 'ON_TURN_START',               // 动作：回合开始
    ON_TURN_END = 'ON_TURN_END',                   // 动作：回合结束
    ON_CARD_BUY = 'ON_CARD_BUY',                   // 动作：购买卡牌后
    ON_SHOP_REFRESH = 'ON_SHOP_REFRESH',           // 动作：刷新商店后
}

// 定义触发源类型
export type TriggerSource =
    | { type: 'UNIT'; unit: EnergyUnit }           // 能量球触发
    | { type: 'CARD'; cardId: string }             // 卡牌触发
    | { type: 'GAME_RULE'; ruleId: string }        // 规则触发
    | { type: 'ARTIFACT'; artifactId: string };    // 神器触发

// Hook 上下文 
export interface HookContext {
    // 必填：谁触发的？
    source: TriggerSource;

    // 可选：如果 source 是 UNIT，这里方便直接访问 (语法糖)
    unit?: EnergyUnit;

    // 必填：游戏状态快照 (为了方便逻辑判断，建议改为必填，或者在执行器里自动填充)
    gameState?: any;

    // 可选：触发参数 (例如 "买了哪张卡", "消耗了多少钱")
    triggerParams?: any;
}

// 副作用定义
export interface SideEffect {
    type: string;
    payload?: any;
}

// Hook 执行结果
export interface HookResult {
    prevented?: boolean;       // 是否阻止默认行为
    modifiedValue?: any;       // 修改后的值 (例如 matchAny: true)
    sideEffects?: SideEffect[];// 副作用列表
}

// Hook 处理器
export interface HookHandler {
    priority: number; // 默认 0，越高越先执行
    execute: (context: HookContext) => HookResult;
}