import { EnergyType, EnergyUnit,EnergyConfig,EnergyCostRequirement} from '../types/energy';
import { globalHooks } from '../hooks/registry'; // 预留 Hook 调用

/**
 * 包装能量球对象，用于在算法中标记是否被使用
 */
interface EnergyNode {
    unit: EnergyUnit;  // 引用实体
    originalIndex: number;
    used: boolean;
}

/**
 * 核心匹配逻辑：判断一个能量球是否满足某个支付需求
 * @param unit 能量球
 * @param req 支付需求
 * @returns true/false
 */
const matches = (unit: EnergyUnit, req: EnergyCostRequirement): boolean => {
    // 1. 如果需求只是一个简单的颜色
    if (typeof req === 'string') {
        return unit.type === req;
        // 注意：这里默认策略是“简单颜色需求不检查特性”，
    }

    // 2. 复杂对象匹配

    // A. 检查颜色白名单 (OR 逻辑)
    // 如果 allowedTypes 存在且不为空，则球的颜色必须在列表中
    // 如果 allowedTypes 为空，则视为“任意颜色” (Wildcard)
    if (req.allowedTypes && req.allowedTypes.length > 0) {
        if (!req.allowedTypes.includes(unit.type)) {
            return false;
        }
    }

    // B. 检查必须拥有的特性 (AND 逻辑)
    if (req.requiredTraits && req.requiredTraits.length > 0) {
        // 球必须拥有列表中的每一个特性
        const hasAllTraits = req.requiredTraits.every(t => unit.traits.has(t));
        if (!hasAllTraits) return false;
    }

    // C. 检查禁止的特性 (NOT 逻辑)
    if (req.forbiddenTraits && req.forbiddenTraits.length > 0) {
        // 球不能拥有列表中的任何一个特性
        const hasForbidden = req.forbiddenTraits.some(t => unit.traits.has(t));
        if (hasForbidden) return false;
    }

    return true;
};

/**
 * 核心匹配算法：FindSolution
 * @param requestIdx 当前处理的请求索引
 * @param currentQueue 当前的能量队列（包装过）
 * @param requests 完整的请求列表
 * @returns 是否成功匹配
 */
const findSolutionRecursive = (
    requestIdx: number,
    currentQueue: EnergyNode[],
    requests: EnergyCostRequirement[]
): boolean => {
    // 结束条件： 如果所有请求都已成功匹配，返回成功
    if (requestIdx >= requests.length) {
        return true;
    }

    // 获取目标： 拿出当前要处理的请求
    const req = requests[requestIdx];

    // 倒序搜索： 从队列的第一个小球开始，向最后一个一个小球遍历
    for (let i = 0; i <= currentQueue.length - 1; i++) {
        const node = currentQueue[i];

        // 检查： 这个球符合当前请求吗？且未被占用
        // TODO: Phase 3 将在这里引入 Hook (CAN_PAY_ENERGY) 进行更复杂的判定
        const isMatch = matches(node.unit, req);

        // 结合 Hook 系统 (如果有)
        // 比如 FROZEN 可能会在这里通过 Hook 强制返回 false
        // const isHookAllowed = checkHooks(node.unit, req);

        if (!node.used && isMatch) {
            // 尝试： 如果符合，暂时将这个球标记为“已占用”
            node.used = true;

            // 递归： 继续调用 FindSolution 处理下一个请求
            if (findSolutionRecursive(requestIdx + 1, currentQueue, requests)) {
                // 如果下一步返回成功，则直接返回成功
                return true;
            }

            // 回溯： 取消“已占用”标记（把球放回去），继续向前找下一个符合条件的小球
            node.used = false;
        }
    }

    // 无解
    return false;
};

/**
 * 尝试支付能量成本
 * @param costRequests 需要的能量类型数组
 * @param currentQueue 当前玩家的能量队列 (EnergyUnit[])
 * @returns { success: boolean, newQueue: EnergyUnit[] }
 */
export const tryPayEnergy = (
    costRequests: EnergyCostRequirement[],
    currentQueue: EnergyUnit[]
): { success: boolean; newQueue: EnergyUnit[] } => {

    // 1. 包装队列以支持标记状态
    const wrappedQueue: EnergyNode[] = currentQueue.map((unit, index) => ({
        unit,
        originalIndex: index,
        used: false
    }));

    // 2. 执行算法
    const success = findSolutionRecursive(0, wrappedQueue, costRequests);

    // 3. 处理结果
    if (success) {
        // 过滤掉被标记为 used 的能量球，生成新队列
        const newQueue = wrappedQueue
            .filter(node => !node.used)
            .map(node => node.unit);
        return { success: true, newQueue };
    } else {
        return { success: false, newQueue: currentQueue };
    }
};

/**
 * 获取用于支付成本的能量球索引
 */
export const getUsedIndices = (
    costRequests: EnergyCostRequirement[],
    currentQueue: EnergyUnit[]
): number[] | null => {
    // 1. 包装队列
    const wrappedQueue: EnergyNode[] = currentQueue.map((unit, index) => ({
        unit,
        originalIndex: index,
        used: false
    }));

    // 2. 执行算法
    const success = findSolutionRecursive(0, wrappedQueue, costRequests);

    // 3. 返回结果
    if (success) {
        return wrappedQueue
            .filter(node => node.used)
            .map(node => node.originalIndex);
    } else {
        return null;
    }
};

