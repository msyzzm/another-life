/**
 * 升级类事件
 * 包含角色升级和成长相关的事件
 */

import type { GameEvent } from '../eventTypes';

export const levelUpEvents: GameEvent[] = [
  {
    id: 'levelUp001',
    type: 'levelUp',
    name: '升级',
    description: '你获得了足够经验，提升了等级！',
    imageUrl: '/assets/events/升级.png',
    imageAlt: '升级',
    conditions: [
      { type: 'attribute', key: 'strength', operator: '>=', value: 10 },
      { type: 'attribute', key: 'intelligence', operator: '>=', value: 8 },
    ],
    conditionLogic: 'OR',
    outcomes: [
      { type: 'levelChange', key: 'level', value: 1 },
      { type: 'attributeChange', key: 'strength', value: 2 },
      { type: 'attributeChange', key: 'intelligence', value: 2 },
    ],
    probability: 0.4,
    weight: 5,
  },
  {
    id: 'levelUp002',
    type: 'levelUp',
    name: '突破极限',
    description: '通过不断的训练，你突破了自己的极限！',
    imageUrl: '/assets/events/突破极限.png',
    imageAlt: '突破极限',
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 3 },
      { type: 'attribute', key: 'stamina', operator: '>=', value: 15 },
    ],
    conditionLogic: 'AND',
    outcomes: [
      { type: 'levelChange', key: 'level', value: 1 },
      { type: 'attributeChange', key: 'strength', value: 3 },
      { type: 'attributeChange', key: 'stamina', value: 3 },
      { type: 'attributeChange', key: 'agility', value: 2 },
    ],
    probability: 0.3,
    weight: 6,
  },
  {
    id: 'levelUp003',
    type: 'levelUp',
    name: '智慧觉醒',
    description: '你的智慧达到了新的高度，获得了深刻的洞察力！',
    imageUrl: '/assets/events/智慧觉醒.png',
    imageAlt: '智慧觉醒',
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 5 },
      { type: 'attribute', key: 'intelligence', operator: '>=', value: 20 },
    ],
    conditionLogic: 'AND',
    outcomes: [
      { type: 'levelChange', key: 'level', value: 1 },
      { type: 'attributeChange', key: 'intelligence', value: 5 },
      { type: 'itemGain', key: '智慧之石', value: 1 },
    ],
    probability: 0.2,
    weight: 7,
  },
];