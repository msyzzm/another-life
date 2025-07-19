/**
 * 日常生活事件
 * 包含各种日常活动和小事件，门槛很低，增加游戏的生活感
 */

import type { GameEvent } from '../eventTypes';

export const dailyLifeEvents: GameEvent[] = [
  {
    id: 'daily001',
    type: 'custom',
    name: '晨练',
    description: '清晨时分，你进行了一些简单的体能训练，感觉身体更有活力了。',
    imageUrl: '/assets/events/晨练.png',
    imageAlt: '晨练',
    conditions: [], // 无条件
    outcomes: [
      { type: 'attributeChange', key: 'strength', value: 1 },
      { type: 'attributeChange', key: 'stamina', value: 1 },
    ],
    probability: 0.4,
    weight: 2,
  },
  {
    id: 'daily002',
    type: 'custom',
    name: '读书学习',
    description: '你找到了一本有趣的书籍，认真阅读后增长了见识。',
    imageUrl: '/assets/events/读书学习.png',
    imageAlt: '读书学习',
    conditions: [
      { type: 'attribute', key: 'intelligence', operator: '>=', value: 5 },
    ],
    outcomes: [
      { type: 'attributeChange', key: 'intelligence', value: 2 },
    ],
    probability: 0.5,
    weight: 3,
  },
  {
    id: 'daily003',
    type: 'custom',
    name: '练习技巧',
    description: '你花时间练习各种技巧，手脚变得更加灵活。',
    imageUrl: '/assets/events/练习技巧.png',
    imageAlt: '练习技巧',
    conditions: [], // 无条件
    outcomes: [
      { type: 'attributeChange', key: 'agility', value: 1 },
      { type: 'attributeChange', key: 'intelligence', value: 1 },
    ],
    probability: 0.4,
    weight: 2,
  },
  {
    id: 'daily004',
    type: 'custom',
    name: '美食体验',
    description: '你品尝了当地的美食，不仅填饱了肚子，还恢复了精神。',
    imageUrl: '/assets/events/美食体验.png',
    imageAlt: '美食体验',
    conditions: [
      { type: 'attribute', key: 'stamina', operator: '<', value: 20 }, // 大部分时候满足
    ],
    outcomes: [
      { type: 'attributeChange', key: 'stamina', value: 2 },
      { type: 'attributeChange', key: 'strength', value: 1 },
      { type: 'itemGain', key: '美食回忆', value: 1 },
    ],
    probability: 0.6,
    weight: 3,
  },
  {
    id: 'daily005',
    type: 'custom',
    name: '整理装备',
    description: '你花时间整理和维护自己的装备，让一切都井井有条。',
    imageUrl: '/assets/events/整理装备.png',
    imageAlt: '整理装备',
    conditions: [], // 无条件
    outcomes: [
      { type: 'attributeChange', key: 'intelligence', value: 1 },
      { type: 'attributeChange', key: 'agility', value: 1 },
    ],
    probability: 0.3,
    weight: 2,
  },
  {
    id: 'daily006',
    type: 'custom',
    name: '欣赏风景',
    description: '你停下脚步欣赏周围的美丽风景，心情变得愉悦。',
    imageUrl: '/assets/events/欣赏风景.png',
    imageAlt: '欣赏风景',
    conditions: [], // 无条件
    outcomes: [
      { type: 'attributeChange', key: 'stamina', value: 1 },
      { type: 'attributeChange', key: 'intelligence', value: 1 },
    ],
    probability: 0.5,
    weight: 2,
  },
];