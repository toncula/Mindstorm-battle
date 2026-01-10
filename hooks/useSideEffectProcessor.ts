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
     * usage:
     *  setPlayer(prev => {
            return processSideEffects(prev, sideEffects);
        });
     */
    const process = useCallback((
        currentState: PlayerState,
        effects: SideEffect[]
    ): PlayerState => {
        console.log(`[EffectProcessor] START: Processing ${effects ? effects.length : 0} effects. Initial State Snapshot:`, { ...currentState });

        if (!effects || effects.length === 0) {
            console.log('[EffectProcessor] No effects to process, returning current state.');
            return currentState;
        }

        // 使用 reduce 依次应用状态转换
        const finalState = effects.reduce((state, effect, index) => {
            console.groupCollapsed(`[EffectProcessor] STEP ${index + 1}/${effects.length}: Type=${effect.type}`);
            console.log('  > Effect Payload:', effect);

            const handler = EFFECT_REGISTRY[effect.type];

            if (handler) {
                // 查找成功
                console.log(`  > Handler found in Registry: ${effect.type}`);

                // 执行转换
                const transformer = handler(effect);
                const newState = transformer(state);

                // 打印转换结果（注意：只打印差异或关键部分）
                console.log('  > State BEFORE update:', { ...state });
                console.log('  > State AFTER update:', { ...newState });

                console.groupEnd();
                return newState;
            } else {
                // 查找失败
                console.warn(`[EffectProcessor] Unknown SideEffect type: ${effect.type}. Effect was skipped.`, effect);
                console.groupEnd();
                return state;
            }
        }, currentState);

        console.log('[EffectProcessor] END: All effects processed. Final State:', { ...finalState });
        return finalState;

    }, []);

    return { process };
};