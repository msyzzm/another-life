/**
 * 特殊事件
 * 极其稀有的特殊事件，通常有独特的效果
 */

import type { GameEvent } from '../eventTypes';

export const specialEvents: GameEvent[] = [
  {
    id: 'custom007',
    type: 'custom',
    name: '幸运女神的眷顾',
    description: '幸运女神随机提升你的一个属性。',
    conditions: [
      { type: 'attribute', key: 'intelligence', operator: '>=', value: 15 },
    ],
    outcomes: [
      { type: 'custom', key: 'randomAttributeBoost', value: 1 },
    ],
    probability: 0.25,
    weight: 2,
  },
  {
    id: 'special001',
    type: 'custom',
    name: '时间漩涡',
    description: '你遭遇了一个神秘的时间漩涡，虽然迷失了一些时间，但获得了时间的洞察。',
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 8 },
    ],
    outcomes: [
      { type: 'custom', key: 'time_insight', value: 1 },
      { type: 'attributeChange', key: 'intelligence', value: 3 },
      { type: 'attributeChange', key: 'agility', value: 2 },
    ],
    probability: 0.01,
    weight: 12,
  },
  {
    id: 'special002',
    type: 'custom',
    name: '生命之泉',
    description: '你发现了传说中的生命之泉，饮用后感觉整个人都焕然一新。',
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 5 },
    ],
    outcomes: [
      { type: 'custom', key: 'fullRestore', value: 1 },
      { type: 'attributeChange', key: 'strength', value: 2 },
      { type: 'attributeChange', key: 'stamina', value: 3 },
      { type: 'attributeChange', key: 'agility', value: 2 },
      { type: 'attributeChange', key: 'intelligence', value: 2 },
    ],
    probability: 0.01,
    weight: 15,
  },
  {
    id: 'special003',
    type: 'custom',
    name: '命运的转折点',
    description: '你遇到了命运的转折点，可以选择重新分配你的属性点。',
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 10 },
    ],
    outcomes: [
      { type: 'custom', key: 'respec_attributes', value: 1 },
    ],
    probability: 0.005,
    weight: 20,
  },
  {
    id: 'special004',
    type: 'custom',
    name: '古神的试炼',
    description: '古老的神明对你进行试炼，通过者将获得无上的力量。',
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 12 },
      { type: 'attribute', key: 'strength', operator: '>=', value: 25 },
      { type: 'attribute', key: 'intelligence', operator: '>=', value: 25 },
    ],
    conditionLogic: 'AND',
    outcomes: [
      { type: 'attributeChange', key: 'strength', value: 10 },
      { type: 'attributeChange', key: 'intelligence', value: 10 },
      { type: 'attributeChange', key: 'agility', value: 5 },
      { type: 'attributeChange', key: 'stamina', value: 5 },
      { type: 'itemGain', key: '古神的祝福', value: 1 },
    ],
    probability: 0.001,
    weight: 50,
  },
];