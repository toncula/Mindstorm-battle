import { PlayerState, CardData } from '../types';
import { SideEffect } from '../types/hooks';

// --- 核心类型定义 ---

// 状态转换器：输入旧状态，返回新状态
export type StateTransformer = (state: PlayerState) => PlayerState;

// 特效处理器：输入特定的副作用参数，生成一个转换器
export type EffectHandler = (effect: SideEffect) => StateTransformer;

// --- 领域辅助函数 (Domain Helpers) ---
// 这些是操作 PlayerState 的原子工具，data 层的具体效果将调用这些工具

export const DomainHelpers = {
    // 1. 手牌域修改器 (针对整个手牌数组)
    modifyHand: (state: PlayerState, modifier: (hand: (CardData | null)[]) => (CardData | null)[]): PlayerState => ({
        ...state,
        hand: modifier([...state.hand])
    }),

    // 2. 单卡修改器 (针对特定 ID 的卡牌)
    modifyCard: (state: PlayerState, targetId: string, modifier: (card: CardData) => CardData): PlayerState => {
        const index = state.hand.findIndex(c => c && c.id === targetId);
        if (index === -1) return state; // 目标不存在，安全返回

        const newHand = [...state.hand];
        if (newHand[index]) {
            newHand[index] = modifier(newHand[index]!);
        }
        return { ...state, hand: newHand };
    },

    // 3. 经济域修改器 (针对能量队列和收入)
    modifyEconomy: (state: PlayerState, modifier: (queue: any[], income: any[]) => { newQueue?: any[], newIncome?: any[] }): PlayerState => {
        const { newQueue, newIncome } = modifier([...state.energyQueue], [...state.income]);
        return {
            ...state,
            energyQueue: newQueue || state.energyQueue,
            income: newIncome || state.income
        };
    },

    // 4. 属性域修改器 (针对 HP, 科技等级等)
    modifyStats: (state: PlayerState, modifier: (stats: Pick<PlayerState, 'hp' | 'adventurePoints' | 'tavernTier'>) => Partial<PlayerState>): PlayerState => ({
        ...state,
        ...modifier(state)
    })
};