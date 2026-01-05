import { EnergyTrait } from '../types/energy';
import { HookType, HookHandler } from '../types/hooks';

class HookRegistry {
    private hooks: Map<EnergyTrait, Partial<Record<HookType, HookHandler>>> = new Map();

    /**
     * 为某个特性注册 Hook 处理器
     */
    register(trait: EnergyTrait, handlers: Partial<Record<HookType, HookHandler>>) {
        this.hooks.set(trait, handlers);
        console.log(`[HookRegistry] Registered handlers for trait: ${trait}`);
    }

    /**
     * 获取指定特性在特定时机的处理器
     */
    getHandler(trait: EnergyTrait, hookType: HookType): HookHandler | undefined {
        return this.hooks.get(trait)?.[hookType];
    }
}

// 导出单例
export const globalHooks = new HookRegistry();