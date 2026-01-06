import { defineTrait } from '../../hooks/traitHelpers';
import { HookType,HookContext } from '@/types';
import { CardData } from '../../types';
import { getMult } from './utils';

export const Tier1Traits = {
    'MILITIA_GROWTH': defineTrait('MILITIA_GROWTH', {
        [HookType.ON_TURN_END]: {
            execute: ({ self }: HookContext<CardData>) => ({
                sideEffects: [{ type: 'ADD_UNIT_COUNT', targetId: self.id, amount: 2 * getMult(self) }],
                notification: `Militia Growth`
            })
        }
    }),

    'TAVERN_GROWTH': defineTrait('TAVERN_GROWTH', {
        [HookType.ON_TAVERN_UPGRADE]: {
            execute: ({ self }: HookContext<CardData>) => ({
                sideEffects: [{ type: 'ADD_UNIT_COUNT', targetId: self.id, amount: 2 * getMult(self) }],
                notification: `Tavern Growth`
            })
        }
    }),

    'SELL_BUFF_RIGHT': defineTrait('SELL_BUFF_RIGHT', {
        [HookType.ON_SELL]: {
            execute: ({ self, gameState }: HookContext<CardData>) => {
                const hand = gameState.player.hand as (CardData | null)[];
                const index = hand.findIndex(c => c && c.id === self.id);

                if (index !== -1 && index + 1 < hand.length) {
                    const rightCard = hand[index + 1];
                    if (rightCard) {
                        return {
                            sideEffects: [{ type: 'ADD_UNIT_COUNT', targetId: rightCard.id, amount: 1 * getMult(self) }],
                            notification: `Legacy Buff`
                        };
                    }
                }
                return {};
            }
        }
    }),

    'SUMMON_ESCORT': defineTrait('SUMMON_ESCORT', {
        [HookType.ON_BUY]: {
            execute: ({ gameState }: HookContext<CardData>) => {
                const hand = gameState.player.hand;
                const emptyCount = hand.filter((c: any) => c === null).length;

                if (emptyCount >= 2) { // 购买占1个，还需要1个空位
                    return {
                        sideEffects: [{ type: 'ADD_CARD', templateId: 'c_escort' }],
                        notification: `Summoned Escort`
                    };
                }
                return { notification: 'No space for Escort' };
            }
        }
    }),
};