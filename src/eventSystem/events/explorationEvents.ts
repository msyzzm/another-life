/**
 * 探索类事件
 * 包含发现物品、探索地点等事件
 */

import type { GameEvent } from '../eventTypes';

export const explorationEvents: GameEvent[] = [
  {
    id: 'findItem001',
    type: 'findItem',
    name: '发现宝箱',
    description: '你发现了一个宝箱，里面有一瓶治疗药水。',
    imageUrl: '/assets/events/发现宝箱.png',
    imageAlt: '发现宝箱',
    conditions: [
      { type: 'attribute', key: 'intelligence', operator: '>=', value: 5 }, // 降低门槛
    ],
    outcomes: [
      { type: 'itemGain', key: '治疗药水', value: 1 },
      { type: 'attributeChange', key: 'intelligence', value: 1 }, // 增加智力奖励
    ],
    probability: 0.8, // 提高概率
    weight: 3, // 提高权重
  },
  {
    id: 'findItem002',
    type: 'findItem',
    name: '古老的法术书',
    description: '你在废墟中发现了一本古老的法术书！',
    imageUrl: '/assets/events/古老的法术书.png',
    imageAlt: '古老的法术书',
    conditions: [
      { type: 'attribute', key: 'intelligence', operator: '>=', value: 7 }, // 降低智力要求从10到7
    ],
    outcomes: [
      { type: 'attributeChange', key: 'intelligence', value: 3 },
      { type: 'itemGain', key: '法术书：火球术', value: 1 },
    ],
    probability: 0.5, // 提高概率从30%到50%
    weight: 5, // 提高权重从4到5
  },
  {
    id: 'findItem003',
    type: 'findItem',
    name: '隐藏的洞穴',
    description: '你发现了一个隐藏的洞穴，里面有一些珍贵的矿石。',
    imageUrl: '/assets/events/隐藏的洞穴.png',
    imageAlt: '隐藏的洞穴',
    conditions: [
      { type: 'attribute', key: 'intelligence', operator: '>=', value: 6 }, // 降低门槛
      { type: 'attribute', key: 'agility', operator: '>=', value: 5 }, // 降低门槛
    ],
    conditionLogic: 'OR', // 改为OR，更容易触发
    outcomes: [
      { type: 'itemGain', key: '铁矿石', value: 3 },
      { type: 'itemGain', key: '银矿石', value: 1 },
      { type: 'attributeChange', key: 'agility', value: 1 }, // 增加敏捷奖励
    ],
    probability: 0.7, // 提高概率
    weight: 3,
  },
  {
    id: 'findItem004',
    type: 'findItem',
    name: '古代遗迹',
    description: '你发现了一处古代遗迹，从中获得了神秘的知识。',
    imageUrl: '/assets/events/古代遗迹.png',
    imageAlt: '古代遗迹',
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 4 },
      { type: 'attribute', key: 'intelligence', operator: '>=', value: 15 },
    ],
    conditionLogic: 'AND',
    outcomes: [
      { type: 'attributeChange', key: 'intelligence', value: 4 },
      { type: 'itemGain', key: '古代符文', value: 1 },
    ],
    probability: 0.2,
    weight: 5,
  },
  // 新增低门槛事件
  {
    id: 'findItem005',
    type: 'findItem',
    name: '路边的花朵',
    description: '你在路边发现了一些美丽的花朵，采集后感觉心情愉悦。',
    imageUrl: '/assets/events/路边的花朵.png',
    imageAlt: '路边的花朵',
    conditions: [], // 无条件，任何时候都可能触发
    outcomes: [
      { type: 'attributeChange', key: 'stamina', value: 1 },
      { type: 'attributeChange', key: 'intelligence', value: 1 },
      { type: 'itemGain', key: '野花', value: 2 },
    ],
    probability: 0.6,
    weight: 2,
  },
  {
    id: 'findItem006',
    type: 'findItem',
    name: '清澈的小溪',
    description: '你发现了一条清澈的小溪，喝了一些甘甜的溪水。',
    imageUrl: '/assets/events/清澈的小溪.png',
    imageAlt: '清澈的小溪',
    conditions: [
      { type: 'attribute', key: 'stamina', operator: '<', value: 15 }, // 大部分时候都能满足
    ],
    outcomes: [
      { type: 'attributeChange', key: 'stamina', value: 2 },
      { type: 'attributeChange', key: 'agility', value: 1 },
    ],
    probability: 0.7,
    weight: 3,
  },
];