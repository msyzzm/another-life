/**
 * 高级事件
 * 需要高等级和高属性才能触发的稀有事件
 */

import type { GameEvent } from '../eventTypes';

export const advancedEvents: GameEvent[] = [
  {
    id: 'advance001',
    type: 'custom',
    name: '剑圣的传承',
    description: '传说中的剑圣现身，传授给你无上的剑术。',
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 7 },
      { type: 'attribute', key: 'strength', operator: '>=', value: 20 },
    ],
    conditionLogic: 'AND',
    outcomes: [
      { type: 'attributeChange', key: 'strength', value: 6 },
      { type: 'attributeChange', key: 'agility', value: 3 },
      { type: 'itemGain', key: '剑圣传承', value: 1 },
    ],
    probability: 0.03,
    weight: 10,
  },
  {
    id: 'advance002',
    type: 'custom',
    name: '大法师的秘密',
    description: '你无意中发现了大法师隐藏的魔法实验室，学到了禁忌的魔法知识。',
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 6 },
      { type: 'attribute', key: 'intelligence', operator: '>=', value: 22 },
    ],
    conditionLogic: 'AND',
    outcomes: [
      { type: 'attributeChange', key: 'intelligence', value: 7 },
      { type: 'itemGain', key: '禁忌法术书', value: 1 },
      { type: 'custom', key: 'forbidden_knowledge', value: 1 },
    ],
    probability: 0.02,
    weight: 10,
  },
  {
    id: 'advance003',
    type: 'custom',
    name: '影子大师的认可',
    description: '传说中的影子大师从暗处现身，认可了你的潜行技艺。',
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 6 },
      { type: 'attribute', key: 'agility', operator: '>=', value: 25 },
    ],
    conditionLogic: 'AND',
    outcomes: [
      { type: 'attributeChange', key: 'agility', value: 8 },
      { type: 'attributeChange', key: 'intelligence', value: 2 },
      { type: 'itemGain', key: '影之斗篷', value: 1 },
    ],
    probability: 0.02,
    weight: 10,
  },
  {
    id: 'advance004',
    type: 'custom',
    name: '神圣的启示',
    description: '神明向你显现，赐予了你神圣的力量。',
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 8 },
      { type: 'attribute', key: 'intelligence', operator: '>=', value: 20 },
    ],
    conditionLogic: 'AND',
    outcomes: [
      { type: 'attributeChange', key: 'intelligence', value: 6 },
      { type: 'attributeChange', key: 'stamina', value: 4 },
      { type: 'itemGain', key: '神圣权杖', value: 1 },
    ],
    probability: 0.01,
    weight: 12,
  },
];