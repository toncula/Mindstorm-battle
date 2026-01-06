import { defineTrait } from '../../hooks/traitHelpers';
import { HookType, HookContext } from '@/types';
import { CardData, UnitType } from '../../types';
import { SideEffect } from '../../types/hooks';
import { getMult } from './utils';

export const Tier3Traits = {
    'MELEE_BUFF_ON_ENTER': defineTrait('MELEE_BUFF_ON_ENTER', {
        [HookType.ON_BUY]: {
            execute: ({ self, gameState }: HookContext<CardData>) => {
                const hand = gameState.player.hand as (CardData | null)[];
                const effects: SideEffect[] = [];
                hand.forEach(c => {
                    if (c && c.unitType === UnitType.MELEE) {
                        effects.push({ type: 'ADD_UNIT_COUNT', targetId: c.id, amount: 1 * getMult(self) });
                    }
                });
                return { sideEffects: effects };
            }
        }
    }),

    'GROWTH_ON_SELL': defineTrait('GROWTH_ON_SELL', {
        ['ON_ANY_CARD_SOLD' as HookType]: {
            execute: ({ self }: HookContext<CardData>) => ({
                sideEffects: [{ type: 'ADD_UNIT_COUNT', targetId: self.id, amount: 1 * getMult(self) }]
            })
        }
    }),

    'GROWTH_ON_LARGE_SELL': defineTrait('GROWTH_ON_LARGE_SELL', {
        ['ON_ANY_CARD_SOLD' as HookType]: {
            execute: ({ self, params }: HookContext<CardData>) => {
                if (params && params.soldCard && params.soldCard.unitCount > 10) {
                    return {
                        sideEffects: [{ type: 'ADD_UNIT_COUNT', targetId: self.id, amount: 2 * getMult(self) }]
                    };
                }
                return {};
            }
        }
    }),

    'LEFTMOST_GROWTH': defineTrait('LEFTMOST_GROWTH', {
        [HookType.ON_TURN_END]: {
            execute: ({ self, gameState }: HookContext<CardData>) => {
                const hand = gameState.player.hand as (CardData | null)[];
                const leftmostIndex = hand.findIndex(c => c !== null);
                if (leftmostIndex !== -1 && hand[leftmostIndex]) {
                    return {
                        sideEffects: [{ type: 'ADD_UNIT_COUNT', targetId: hand[leftmostIndex]!.id, amount: 1 * getMult(self) }]
                    };
                }
                return {};
            }
        }
    }),
};