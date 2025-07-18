/**
 * 战斗类事件
 * 包含各种战斗遭遇和战斗相关的事件
 */

import type { GameEvent } from '../eventTypes';

export const battleEvents: GameEvent[] = [
  {
    id: 'battle001',
    type: 'battle',
    name: '遭遇史莱姆',
    description: '你遇到了一只史莱姆，准备战斗！',
    imageUrl: '/assets/events/遭遇史莱姆3.png',
    imageAlt: '遭遇史莱姆',
    conditions: [
      { type: 'attribute', key: 'strength', operator: '>=', value: 5 },
    ],
    outcomes: [
      { type: 'attributeChange', key: 'strength', value: 1 },
      { type: 'itemGain', key: '史莱姆胶', value: 1 },
    ],
    probability: 0.8,
    weight: 2,
  },
  {
    id: 'battle002',
    type: 'battle',
    name: '遭遇哥布林',
    description: '一只凶恶的哥布林挡住了你的去路！',
    imageUrl: '/assets/events/遭遇哥布林3.png',
    imageAlt: '遭遇哥布林',
    conditions: [
      { type: 'attribute', key: 'strength', operator: '>=', value: 8 },
      { type: 'level', key: 'level', operator: '>=', value: 2 },
    ],
    conditionLogic: 'AND',
    outcomes: [
      { type: 'attributeChange', key: 'strength', value: 2 },
      { type: 'attributeChange', key: 'stamina', value: -1 },
      { type: 'itemGain', key: '哥布林武器', value: 1 },
    ],
    probability: 0.6,
    weight: 3,
  },
  {
    id: 'battle003',
    type: 'battle',
    name: '遭遇野狼',
    description: '一只饥饿的野狼向你扑来！',
    imageUrl: '/assets/events/遭遇野狼3.png',
    imageAlt: '遭遇野狼',
    conditions: [
      { type: 'attribute', key: 'agility', operator: '>=', value: 6 },
    ],
    outcomes: [
      { type: 'attributeChange', key: 'agility', value: 2 },
      { type: 'attributeChange', key: 'stamina', value: -2 },
      { type: 'itemGain', key: '狼皮', value: 1 },
    ],
    probability: 0.7,
    weight: 2,
  },
  {
    id: 'battle004',
    type: 'battle',
    name: '遭遇骷髅战士',
    description: '一具骷髅战士从地下爬起，挥舞着锈蚀的剑！',
    imageUrl: '/assets/events/遭遇骷髅战士3.png',
    imageAlt: '遭遇骷髅战士',
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 3 },
      { type: 'attribute', key: 'strength', operator: '>=', value: 12 },
    ],
    conditionLogic: 'AND',
    outcomes: [
      { type: 'attributeChange', key: 'strength', value: 3 },
      { type: 'attributeChange', key: 'stamina', value: -3 },
      { type: 'itemGain', key: '骨头碎片', value: 2 },
      { type: 'itemGain', key: '古老的剑', value: 1 },
    ],
    probability: 0.4,
    weight: 4,
  },
];