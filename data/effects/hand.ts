import { SideEffect } from '../../types/hooks';
import { CardData } from '../../types';
import { DomainHelpers, EffectHandler } from '../../hooks/effectHandlers';
import { CARD_TEMPLATES } from '../../constants';

export const HandEffects: Record<string, EffectHandler> = {
    // 增加单位数量 (Buff)
    'ADD_UNIT_COUNT': (effect: SideEffect) => (state) => {
        console.log('[HandEffects] ADD_UNIT_COUNT triggered', effect);
        if (!effect.targetId || !effect.amount) {
            console.warn('[HandEffects] ADD_UNIT_COUNT skipped: missing targetId or amount');
            return state;
        }

        return DomainHelpers.modifyCard(state, effect.targetId, (card) => {
            console.log(`[HandEffects] Increasing unit count for card ${card.name} (${card.id}): ${card.unitCount} -> ${card.unitCount + effect.amount!}`);
            return {
                ...card,
                unitCount: card.unitCount + effect.amount!
            };
        });
    },

    // 获得新卡牌 (Summon / Token)
    'ADD_CARD': (effect: SideEffect) => (state) => {
        console.log('[HandEffects] ADD_CARD triggered', effect);
        if (!effect.templateId) {
            console.warn('[HandEffects] ADD_CARD skipped: missing templateId');
            return state;
        }

        return DomainHelpers.modifyHand(state, (hand) => {
            const emptyIndex = hand.findIndex(c => c === null);
            if (emptyIndex === -1) {
                console.warn('[HandEffects] ADD_CARD failed: Hand is full');
                return hand; // 满手牌忽略
            }

            const template = Object.values(CARD_TEMPLATES).find((t: any) => t.id === effect.templateId);
            if (!template) {
                console.error(`[HandEffects] ADD_CARD failed: Template not found for id ${effect.templateId}`, Object.keys(CARD_TEMPLATES));
                return hand;
            }

            console.log(`[HandEffects] Creating new card from template: ${template.name}`);

            const newCard: CardData = {
                // @ts-ignore - Compatible construction
                ...template,
                id: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                justBought: Date.now(),
                traits: [],
                upgrades: []
            };

            hand[emptyIndex] = newCard;
            return hand;
        });
    },
};