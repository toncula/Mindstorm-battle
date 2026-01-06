import { useEffect, useRef } from 'react';
import { registerTraits } from './traitHelpers';
import { TraitCatalog } from '@/data/traits/registry';

// 这里可以导入其他的 Catalog，比如 EnemyTraits, EnergyTraits
// import { EnergyTraitCatalog } from '../data/traits/energyCatalog';

export const useHookSystem = () => {
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            console.log('[HookSystem] Initializing...');

            // 1. 注册卡牌特性
            registerTraits(TraitCatalog);

            // 2. 注册其他特性 (如果有)
            // registerTraits(EnergyTraitCatalog);

            initialized.current = true;
        }
    }, []);
};