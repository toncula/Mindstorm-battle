import { EffectHandler } from '../../hooks/effectHandlers';
import { HandEffects } from './hand';
import { EconomyEffects } from './economy';
import { VitalEffects } from './vital';

// 聚合所有的 Effect Map
export const EFFECT_REGISTRY: Record<string, EffectHandler> = {
    ...HandEffects,
    ...EconomyEffects,
    ...VitalEffects,
};