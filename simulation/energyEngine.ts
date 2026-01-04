import { EnergyType } from '../types';

/**
 * 包装能量球对象，用于在算法中标记是否被使用
 */
interface EnergyNode {
    type: EnergyType;
    originalIndex: number;
    used: boolean;
}

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
    requests: EnergyType[]
): boolean => {
    // 结束条件： 如果所有请求都已成功匹配，返回成功
    if (requestIdx >= requests.length) {
        return true;
    }

    // 获取目标： 拿出当前要处理的请求
    const req = requests[requestIdx];

    // 从左向右搜索
    for (let i = 0; i <= currentQueue.length - 1; i++) {
        const node = currentQueue[i];

        // 检查： 这个球符合当前请求吗？且未被占用
        if (!node.used && node.type === req) {
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

    // 无解： 如果遍历完整个队列都找不到能让后续步骤成功的球，返回失败
    return false;
};

/**
 * 尝试支付能量成本
 * @param costRequests 需要的能量类型数组
 * @param currentQueue 当前玩家的能量队列
 * @returns { success: boolean, newQueue: EnergyType[] } 如果成功，返回剩余的新队列；如果失败，返回原队列
 */
export const tryPayEnergy = (
    costRequests: EnergyType[],
    currentQueue: EnergyType[]
): { success: boolean; newQueue: EnergyType[] } => {

    // 1. 包装队列以支持标记状态
    const wrappedQueue: EnergyNode[] = currentQueue.map((type, index) => ({
        type,
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
            .map(node => node.type);
        return { success: true, newQueue };
    } else {
        return { success: false, newQueue: currentQueue };
    }
};

/**
 * 辅助函数：生成纯白色能量的请求数组 (兼容旧的金币逻辑)
 */
export const createWhiteEnergyRequest = (amount: number): EnergyType[] => {
    return Array(amount).fill(EnergyType.WHITE);
};