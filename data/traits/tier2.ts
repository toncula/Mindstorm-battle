import { defineTrait } from '../../hooks/traitHelpers';
import { HookType, HookContext } from '@/types';
import { CardData, UnitType } from '../../types';
import { getMult } from './utils';

export const Tier2Traits = {
    'ADJACENT_GROWTH': defineTrait('ADJACENT_GROWTH', {
        [HookType.ON_TURN_END]: {
            execute: ({ self, gameState }: HookContext<CardData>) => {
                const hand = gameState.player.hand as (CardData | null)[];
                const index = hand.findIndex(c => c && c.id === self.id);
                if (index === -1) return {};

                let adjCount = 0;
                const left = hand[index - 1];
                const right = hand[index + 1];
                if (left && (left.unitType === UnitType.MELEE || left.unitType === UnitType.RANGED)) adjCount++;
                if (right && (right.unitType === UnitType.MELEE || right.unitType === UnitType.RANGED)) adjCount++;

                if (adjCount > 0) {
                    return {
                        sideEffects: [{ type: 'ADD_UNIT_COUNT', targetId: self.id, amount: adjCount * getMult(self) }]
                    };
                }
                return {};
            }
        }
    }),

    'PASSIVE_GOLD': defineTrait('PASSIVE_GOLD', {
        [HookType.ON_TURN_END]: {
            execute: ({ self }: HookContext<CardData>) => ({
                sideEffects: [{ type: 'GAIN_GOLD', amount: 1 * getMult(self) }]
            })
        }
    }),

    'ENTRY_TYPE_GROWTH': defineTrait('ENTRY_TYPE_GROWTH', {
        [HookType.ON_BUY]: {
            execute: ({ self, gameState }: HookContext<CardData>) => {
                const hand = gameState.player.hand as (CardData | null)[];
                const uniqueTypes = new Set<string>();
                hand.forEach(c => { if (c) uniqueTypes.add(c.unitType); });
                uniqueTypes.add(self.unitType);

                const amount = uniqueTypes.size * getMult(self);
                return {
                    sideEffects: [{ type: 'ADD_UNIT_COUNT', targetId: self.id, amount }]
                };
            }
        }
    }),

    'SELL_TRIGGER_GROWTH': defineTrait('SELL_TRIGGER_GROWTH', {
        ['ON_ANY_CARD_SOLD' as HookType]: {
            execute: ({ self, params }: HookContext<CardData>) => {
                if (params && params.cardsSoldThisTurn === 0) {
                    return {
                        sideEffects: [{ type: 'ADD_UNIT_COUNT', targetId: self.id, amount: 1 * getMult(self) }]
                    };
                }
                return {};
            }
        }
    }),
};