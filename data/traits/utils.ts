import { CardData } from '../../types';

// 获取金卡倍率：普通卡 1倍，金卡 2倍
export const getMult = (card: CardData) => card.isGolden ? 2 : 1;