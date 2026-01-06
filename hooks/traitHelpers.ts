import { HookHandler, HookType, TraitKey } from '../types/hooks';
import { globalHooks } from './registry';

// 定义一个标准的特性配置结构
export interface TraitDefinition {
    key: TraitKey;
    hooks: Partial<Record<HookType, HookHandler>>;
}

/**
 * 辅助函数：定义一个特性
 * 作用：提供类型检查，确保写的逻辑符合规范
 */
export const defineTrait = (
    key: string,
    hooks: Partial<Record<HookType, HookHandler>>
): TraitDefinition => {
    return { key, hooks };
};

/**
 * 批量注册函数
 * 作用：在游戏启动时一次性把所有特性加载进注册表
 */
export const registerTraits = (definitions: Record<string, TraitDefinition>) => {
    Object.values(definitions).forEach(def => {
        globalHooks.register(def.key, def.hooks);
    });
    console.log(`[TraitSystem] Loaded ${Object.keys(definitions).length} traits.`);
};