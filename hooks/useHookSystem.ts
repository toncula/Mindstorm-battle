import { useRef, useEffect } from 'react';
import { HookType, TraitEntity } from '../types/hooks';
import { HookExecutor } from './hookExecutor';
import { useSideEffectProcessor } from './useSideEffectProcessor';
import { registerTraits } from './traitHelpers';
import { TraitCatalog } from '../data/traits/registry';

export const useHookSystem = () => {
    // 1. 获取副作用处理器
    // [FIX] 使用别名解构：将 'process' 重命名为 'processSideEffects'
    // 这样既匹配了 useSideEffectProcessor 的实际返回值，又能在当前文件中保持语义清晰
    const { process: processSideEffects } = useSideEffectProcessor();

    // 2. 初始化注册表 (确保只需执行一次)
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            console.log('[HookSystem] Initializing trait registry...');
            registerTraits(TraitCatalog);
            // 未来如果有 EnemyTraitCatalog 等，也在这里注册
            // registerTraits(EnemyTraitCatalog);
            initialized.current = true;
        }
    }, []);

    // 3. 封装 HookExecutor 的方法

    /**
     * 检查是否允许进行某个操作 (拦截器)
     */
    const check = <T extends TraitEntity>(
        hookType: HookType,
        entity: T,
        gameState: any,
        params?: any
    ) => {
        return HookExecutor.check(hookType, entity, gameState, params);
    };

    /**
     * 计算数值 (管道修正，如伤害、价格)
     */
    const processValue = <T extends TraitEntity>(
        hookType: HookType,
        entity: T,
        initialValue: number,
        gameState: any,
        params?: any
    ) => {
        return HookExecutor.processValue(hookType, entity, initialValue, gameState, params);
    };

    /**
     * 触发单体事件 (产生副作用)
     */
    const trigger = <T extends TraitEntity>(
        hookType: HookType,
        entity: T,
        gameState: any,
        params?: any
    ) => {
        return HookExecutor.trigger(hookType, entity, gameState, params);
    };

    /**
     * 触发群体/批量事件 (自动过滤 null，用于回合结束等场景)
     */
    const triggerBatch = <T extends TraitEntity>(
        hookType: HookType,
        entities: (T | null)[],
        gameState: any,
        params?: any
    ) => {
        return HookExecutor.triggerBatch(hookType, entities, gameState, params);
    };

    // 4. 返回所有工具接口
    return {
        check,
        processValue,
        trigger,
        triggerBatch,
        processSideEffects // 这里导出的就是上面重命名后的函数
    };
};