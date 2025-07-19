/**
 * 社交类事件
 * 包含与NPC互动、商人交易等社交相关事件
 */

import type { GameEvent } from '../eventTypes';

export const socialEvents: GameEvent[] = [
  {
    id: 'custom003',
    type: 'custom',
    name: '神秘商人',
    description: '你遇到了一位神秘商人，他用你的物品换取了更好的装备。',
    imageUrl: '/assets/events/神秘商人.png',
    imageAlt: '神秘商人',
    conditions: [
      { type: 'itemCount', key: '史莱姆胶', operator: '>=', value: 2 },
    ],
    outcomes: [
      { type: 'itemLoss', key: '史莱姆胶', value: 2 },
      { type: 'itemGain', key: '魔法护符', value: 1 },
    ],
    probability: 0.6,
    weight: 3,
  },
  {
    id: 'custom008',
    type: 'custom',
    name: '遇到友善村民',
    description: '你遇到了一位友善的村民，他分享了一些有用的信息。',
    imageUrl: '/assets/events/遇到友善村民.png',
    imageAlt: '遇到友善村民',
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 2 },
    ],
    outcomes: [
      { type: 'attributeChange', key: 'intelligence', value: 1 },
      { type: 'itemGain', key: '村民的礼物', value: 1 },
    ],
    probability: 0.7,
    weight: 2,
  },
  {
    id: 'social001',
    type: 'custom',
    name: '酒馆聚会',
    description: '你在酒馆中与其他冒险者交流，学到了一些有用的技巧。',
    imageUrl: '/assets/events/酒馆聚会.png',
    imageAlt: '酒馆聚会',
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 3 },
    ],
    outcomes: [
      { type: 'attributeChange', key: 'agility', value: 1 },
      { type: 'attributeChange', key: 'intelligence', value: 1 },
      { type: 'itemGain', key: '冒险者地图', value: 1 },
    ],
    probability: 0.5,
    weight: 2,
  },
  {
    id: 'social002',
    type: 'custom',
    name: '帮助迷路的商人',
    description: '你帮助了一位迷路的商人，他给了你一些报酬。',
    imageUrl: '/assets/events/帮助迷路的商人.png',
    imageAlt: '帮助迷路的商人',
    conditions: [
      { type: 'attribute', key: 'intelligence', operator: '>=', value: 8 },
    ],
    outcomes: [
      { type: 'itemGain', key: '金币', value: 50 },
      { type: 'attributeChange', key: 'intelligence', value: 1 },
    ],
    probability: 0.6,
    weight: 2,
  },
  // 新增低门槛社交事件
  {
    id: 'social003',
    type: 'custom',
    name: '路遇旅人',
    description: '你在路上遇到了一位友善的旅人，你们互相分享了旅行见闻。',
    imageUrl: '/assets/events/路遇旅人.png',
    imageAlt: '路遇旅人',
    conditions: [], // 无条件
    outcomes: [
      { type: 'attributeChange', key: 'intelligence', value: 1 },
      { type: 'attributeChange', key: 'agility', value: 1 },
      { type: 'itemGain', key: '旅行小贴士', value: 1 },
    ],
    probability: 0.6,
    weight: 3,
  },
  {
    id: 'social004',
    type: 'custom',
    name: '小镇集市',
    description: '你来到了一个热闹的小镇集市，感受到了人间烟火气。',
    imageUrl: '/assets/events/小镇集市.png',
    imageAlt: '小镇集市',
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 1 }, // 极低门槛
    ],
    outcomes: [
      { type: 'attributeChange', key: 'stamina', value: 1 },
      { type: 'attributeChange', key: 'intelligence', value: 1 },
      { type: 'itemGain', key: '集市纪念品', value: 1 },
    ],
    probability: 0.5,
    weight: 2,
  },
];