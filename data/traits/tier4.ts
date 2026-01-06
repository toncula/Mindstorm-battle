import { defineTrait } from '../../hooks/traitHelpers';
import { HookType, HookContext } from '@/types';
import { CardData, UnitType } from '../../types';
import { SideEffect } from '../../types/hooks';
import { getMult } from './utils';

export const Tier4Traits = {
    'ALL_MELEE_GROWTH': defineTrait('ALL_MELEE_GROWTH', {
        [HookType.ON_TURN_END]: {
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

    'INHERIT_HALF_ON_SELL': defineTrait('INHERIT_HALF_ON_SELL', {
        ['ON_ANY_CARD_SOLD' as HookType]: {
            execute: ({ self, params }: HookContext<CardData>) => {
                if (params && params.soldCard) {
                    const bonus = Math.floor(params.soldCard.unitCount * 0.5) * getMult(self);
                    if (bonus > 0) {
                        return {
                            sideEffects: [{ type: 'ADD_UNIT_COUNT', targetId: self.id, amount: bonus }]
                        };
                    }
                }
                return {};
            }
        }
    }),

    'GROWTH_ON_UPGRADED_SELL': defineTrait('GROWTH_ON_UPGRADED_SELL', {
        ['ON_ANY_CARD_SOLD' as HookType]: {
            execute: ({ self, params }: HookContext<CardData>) => {
                if (params && params.soldCard && params.soldCard.upgrades && params.soldCard.upgrades.length > 0) {
                    const bonus = (params.soldCard.upgrades.length * 3) * getMult(self);
                    return {
                        sideEffects: [{ type: 'ADD_UNIT_COUNT', targetId: self.id, amount: bonus }]
                    };
                }
                return {};
            }
        }
    })
};