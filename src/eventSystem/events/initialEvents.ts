/**
 * 初始事件
 * 在游戏开始时触发的事件，用于设置角色的基本属性（职业/种族/性别）
 */

import type { GameEvent } from '../eventTypes';

export const initialEvents: GameEvent[] = [
  {
    id: 'initial001',
    type: 'initial', // 新的事件类型
    name: '人类战士',
    description: '你是一名人类战士，擅长近身战斗和防御。',
    imageUrl: '/assets/events/人类战士.png',
    imageAlt: '人类战士',
    conditions: [], // 无条件，初始事件
    outcomes: [
      { type: 'custom', key: 'setProfession', value: '战士' },
      { type: 'custom', key: 'setRace', value: '人类' },
      { type: 'custom', key: 'setGender', value: '男' },
      { type: 'attributeChange', key: 'strength', value: 3 }, // 战士力量加成
      { type: 'attributeChange', key: 'stamina', value: 2 }, // 战士体力加成
    ],
    probability: 1.0, // 必定触发
    weight: 10,
  },
  {
    id: 'initial002',
    type: 'initial',
    name: '精灵法师',
    description: '你是一名精灵法师，擅长魔法和智慧。',
    imageUrl: '/assets/events/精灵法师.png',
    imageAlt: '精灵法师',
    conditions: [],
    outcomes: [
      { type: 'custom', key: 'setProfession', value: '法师' },
      { type: 'custom', key: 'setRace', value: '精灵' },
      { type: 'custom', key: 'setGender', value: '女' },
      { type: 'attributeChange', key: 'intelligence', value: 4 }, // 法师智力加成
      { type: 'attributeChange', key: 'agility', value: 1 }, // 精灵敏捷加成
    ],
    probability: 1.0,
    weight: 10,
  },
  {
    id: 'initial003',
    type: 'initial',
    name: '矮人工匠',
    description: '你是一名矮人工匠，擅长制造和耐力。',
    imageUrl: '/assets/events/矮人工匠.png',
    imageAlt: '矮人工匠',
    conditions: [],
    outcomes: [
      { type: 'custom', key: 'setProfession', value: '工匠' },
      { type: 'custom', key: 'setRace', value: '矮人' },
      { type: 'custom', key: 'setGender', value: '男' },
      { type: 'attributeChange', key: 'stamina', value: 3 }, // 矮人体力加成
      { type: 'attributeChange', key: 'strength', value: 2 }, // 工匠力量加成
    ],
    probability: 1.0,
    weight: 10,
  },
  {
    id: 'initial004',
    type: 'initial',
    name: '兽人猎手',
    description: '你是一名兽人猎手，擅长追踪和狩猎。',
    imageUrl: '/assets/events/兽人猎手.png',
    imageAlt: '兽人猎手',
    conditions: [],
    outcomes: [
      { type: 'custom', key: 'setProfession', value: '猎手' },
      { type: 'custom', key: 'setRace', value: '兽人' },
      { type: 'custom', key: 'setGender', value: '男' },
      { type: 'attributeChange', key: 'agility', value: 3 }, // 猎手敏捷加成
      { type: 'attributeChange', key: 'strength', value: 2 }, // 兽人力量加成
    ],
    probability: 1.0,
    weight: 10,
  },
  {
    id: 'initial005',
    type: 'initial',
    name: '暗夜盗贼',
    description: '你是一名暗夜精灵盗贼，擅长潜行和敏捷动作。',
    imageUrl: '/assets/events/暗夜盗贼.png',
    imageAlt: '暗夜盗贼',
    conditions: [],
    outcomes: [
      { type: 'custom', key: 'setProfession', value: '盗贼' },
      { type: 'custom', key: 'setRace', value: '暗夜精灵' },
      { type: 'custom', key: 'setGender', value: '女' },
      { type: 'attributeChange', key: 'agility', value: 4 }, // 盗贼敏捷加成
      { type: 'attributeChange', key: 'intelligence', value: 1 }, // 暗夜精灵智力加成
    ],
    probability: 1.0,
    weight: 10,
  },
];