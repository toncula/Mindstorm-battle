import { Tier1Traits } from './tier1';
import { Tier2Traits } from './tier2';
import { Tier3Traits } from './tier3';
import { Tier4Traits } from './tier4';
import { TraitDefinition } from '../../hooks/traitHelpers';

// 聚合所有等级的 Traits
// 这里使用了简单的解构合并，如果未来有命名冲突，可以考虑加前缀或深层合并
export const TraitCatalog: Record<string, TraitDefinition> = {
    ...Tier1Traits,
    ...Tier2Traits,
    ...Tier3Traits,
    ...Tier4Traits,
    // ... 未来扩展 Tier 5, 6 或 Special Traits
};