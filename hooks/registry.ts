import { HookType, HookHandler, TraitKey } from '../types/hooks';

class HookRegistry {
    private hooks: Map<TraitKey, Partial<Record<HookType, HookHandler>>> = new Map();

    /**
     * 为某个特性注册 Hook 处理器
     */
    register(trait: TraitKey, handlers: Partial<Record<HookType, HookHandler>>) {
        this.hooks.set(trait, handlers);
        console.log(`[HookRegistry] Registered handlers for trait: ${trait}`);
    }

    /**
     * 获取指定特性在特定时机的处理器
     */
    getHandler(trait: TraitKey, hookType: HookType): HookHandler | undefined {
        return this.hooks.get(trait)?.[hookType];
    }
}

// 导出单例
export const globalHooks = new HookRegistry();