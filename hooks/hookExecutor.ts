import { globalHooks } from "./registry";
import { HookType, TraitEntity, SideEffect } from '../types/hooks';

export const HookExecutor = {
    /**
     * 1. 检查拦截 (Check)
     * 用于：能不能买？能不能出牌？
     * 逻辑：只要有一个 Trait 说 "prevented: true"，就返回 false。
     */
    check: <T extends TraitEntity>(
        hookType: HookType,
        entity: T,
        gameState: any,
        params?: any
    ): { allowed: boolean; reason?: string } => {
        const traits = normalizeTraits(entity.traits);

        for (const trait of traits) {
            const handler = globalHooks.getHandler(trait, hookType);
            if (handler) {
                const result = handler.execute({ self: entity, gameState, params });
                if (result.prevented) {
                    return { allowed: false, reason: result.notification };
                }
            }
        }
        return { allowed: true };
    },

    /**
     * 2. 数值管道 (Pipe/Modify)
     * 用于：计算伤害、计算价格、计算治疗量。
     * 逻辑：将初始值传入管道，每个 Trait 可以修改这个值，返回最终结果。
     */
    processValue: <T extends TraitEntity>(
        hookType: HookType,
        entity: T,
        initialValue: number,
        gameState: any,
        params?: any
    ): number => {
        let currentValue = initialValue;
        const traits = normalizeTraits(entity.traits);

        // TODO: 这里理想情况下应该根据 priority 对 traits 进行排序
        // 目前按 traits 列表顺序执行
        for (const trait of traits) {
            const handler = globalHooks.getHandler(trait, hookType);
            if (handler) {
                // 将当前累积的 value 作为参数传给下一个处理器
                const result = handler.execute({
                    self: entity,
                    gameState,
                    params: { ...params, currentValue }
                });
                if (result.modifiedValue !== undefined) {
                    currentValue = result.modifiedValue;
                }
            }
        }
        return currentValue;
    },

    /**
     * 3. 触发事件 (Trigger)
     * 用于：回合开始、死亡时、购买时。
     * 逻辑：执行所有相关的 Trait，收集所有的副作用 (SideEffects)。
     */
    trigger: <T extends TraitEntity>(
        hookType: HookType,
        entity: T,
        gameState: any,
        params?: any
    ): { sideEffects: SideEffect[], notifications: string[] } => {
        const sideEffects: SideEffect[] = [];
        const notifications: string[] = [];
        const traits = normalizeTraits(entity.traits);

        for (const trait of traits) {
            const handler = globalHooks.getHandler(trait, hookType);
            if (handler) {
                const result = handler.execute({ self: entity, gameState, params });
                if (result.sideEffects) sideEffects.push(...result.sideEffects);
                if (result.notification) notifications.push(result.notification);
            }
        }

        return { sideEffects, notifications };
    },

    /**
     * 4. 批量触发 (Batch Trigger)
     * 用于：回合结束时处理所有手牌、处理所有能量球。
     * 逻辑：自动遍历数组，跳过空位。
     */
    triggerBatch: <T extends TraitEntity>(
        hookType: HookType,
        entities: (T | null)[],
        gameState: any,
        params?: any
    ) => {
        let allSideEffects: SideEffect[] = [];
        let allNotifications: string[] = [];

        entities.forEach(entity => {
            if (!entity) return;
            const { sideEffects, notifications } = HookExecutor.trigger(hookType, entity, gameState, params);
            allSideEffects = allSideEffects.concat(sideEffects);
            allNotifications = allNotifications.concat(notifications);
        });

        return { sideEffects: allSideEffects, notifications: allNotifications };
    }
};

// 辅助函数：统一将 traits 转为字符串数组，且处理 undefined
function normalizeTraits(traits?: Set<string> | string[]): string[] {
    if (!traits) return [];
    if (Array.isArray(traits)) return traits;
    return Array.from(traits);
}