import { SideEffect } from '../../types/hooks';
import { CardData } from '../../types';
import { DomainHelpers, EffectHandler } from '../../hooks/effectHandlers';
import { CARD_TEMPLATES } from '../../constants';

export const HandEffects: Record<string, EffectHandler> = {
    // 增加单位数量 (Buff)
    'ADD_UNIT_COUNT': (effect: SideEffect) => (state) => {
        if (!effect.targetId || !effect.amount) return state;

        return DomainHelpers.modifyCard(state, effect.targetId, (card) => ({
            ...card,
            unitCount: card.unitCount + effect.amount!
        }));
    },

    // 获得新卡牌 (Summon / Token)
    'ADD_CARD': (effect: SideEffect) => (state) => {
        if (!effect.templateId) return state;

        return DomainHelpers.modifyHand(state, (hand) => {
            const emptyIndex = hand.findIndex(c => c === null);
            if (emptyIndex === -1) return hand; // 满手牌忽略

            const template = CARD_TEMPLATES.find(t => t.templateId === effect.templateId);
            if (!template) return hand;

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

    // (示例) 丢弃最右边的卡
    'DISCARD_RIGHTMOST': (effect: SideEffect) => (state) => {
        return DomainHelpers.modifyHand(state, (hand) => {
            // 倒序查找第一个非空卡位
            let idx = hand.length - 1;
            while (idx >= 0 && hand[idx] === null) idx--;

            if (idx >= 0) {
                hand[idx] = null;
            }
            return hand;
        });
    }
};