import { useCallback } from 'react';
import { PlayerState } from '../types';
import { SideEffect } from '../types/hooks';
import { EFFECT_REGISTRY } from '../data/effects/registry';

export const useSideEffectProcessor = () => {

    /**
     * 核心处理器：将副作用列表转换为新的玩家状态
     * * 流程：
     * 1. 接收当前状态 (Snapshot)
     * 2. 遍历副作用列表
     * 3. 在 Registry 中查找对应的 EffectHandler (StateTransformer)
     * 4. 依次应用转换，生成最终状态
     */
    const process = useCallback((
        currentState: PlayerState,
        effects: SideEffect[]
    ): PlayerState => {
        if (!effects || effects.length === 0) return currentState;

        return effects.reduce((state, effect) => {
            const handler = EFFECT_REGISTRY[effect.type];

            if (handler) {
                // 执行转换
                const transformer = handler(effect);
                return transformer(state);
            } else {
                console.warn(`[EffectProcessor] Unknown SideEffect type: ${effect.type}`, effect);
                return state;
            }
        }, currentState);

    }, []);

    return { process };
};