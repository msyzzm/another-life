/**
 * 历史感知事件
 * 基于角色历史行为触发的特殊事件
 */

import type { GameEvent } from '../eventTypes';

export const historyEvents: GameEvent[] = [
  {
    id: 'history001',
    type: 'custom',
    name: '战斗老兵的荣耀',
    description: '连续多日的战斗让你成为了经验丰富的战士，获得了老兵的称号。',
    conditions: [
      {
        type: 'streak',
        key: 'battle001',
        operator: '>=',
        value: 3,
        historyType: 'eventTriggered',
        consecutive: true
      }
    ],
    outcomes: [
      { type: 'attributeChange', key: 'strength', value: 5 },
      { type: 'attributeChange', key: 'stamina', value: 3 },
      { type: 'itemGain', key: '老兵徽章', value: 1 }
    ],
    probability: 0.8, // 降低概率，避免过于频繁
    weight: 4, // 降低权重
  },
  {
    id: 'history002',
    type: 'custom',
    name: '力量成长的见证',
    description: '你的力量在短时间内有了显著提升，肌肉变得更加结实。',
    conditions: [
      {
        type: 'cumulative',
        key: 'strength',
        operator: '>=',
        value: 10,
        historyType: 'attributeChange',
        timeWindow: 7
      }
    ],
    outcomes: [
      { type: 'attributeChange', key: 'strength', value: 3 },
      { type: 'attributeChange', key: 'stamina', value: 2 },
      { type: 'itemGain', key: '力量药剂', value: 1 }
    ],
    probability: 0.6, // 降低概率
    weight: 3, // 降低权重
  },
  {
    id: 'history003',
    type: 'custom',
    name: '收集家的成就',
    description: '你收集了大量的史莱姆胶，成为了著名的收集家。',
    conditions: [
      {
        type: 'cumulative',
        key: '史莱姆胶',
        operator: '>=',
        value: 10,
        historyType: 'itemGained',
        timeWindow: 14
      }
    ],
    outcomes: [
      { type: 'itemGain', key: '收集家徽章', value: 1 },
      { type: 'attributeChange', key: 'intelligence', value: 2 },
      { type: 'itemGain', key: '特殊背包', value: 1 }
    ],
    probability: 0.7, // 降低概率
    weight: 2, // 降低权重
  },
  {
    id: 'history004',
    type: 'custom',
    name: '久违的战斗',
    description: '你已经很久没有参与战斗了，有些生疏但也更加谨慎。',
    conditions: [
      {
        type: 'eventCount',
        key: 'battle001',
        operator: '>=',
        value: 1,
        timeWindow: 999 // 检查整个历史
      },
      {
        type: 'daysSince',
        key: 'battle001',
        operator: '>=',
        value: 7
      }
    ],
    conditionLogic: 'AND', // 必须先有过战斗，且距离上次战斗>=7天
    outcomes: [
      { type: 'attributeChange', key: 'intelligence', value: 2 },
      { type: 'attributeChange', key: 'agility', value: 1 },
      { type: 'attributeChange', key: 'strength', value: -1 }
    ],
    probability: 0.4, // 降低概率
    weight: 1, // 降低权重
  },
  {
    id: 'history005',
    type: 'custom',
    name: '经验丰富的冒险者',
    description: '你已经经历了许多冒险，成为了经验丰富的冒险者。',
    conditions: [
      {
        type: 'eventCount',
        key: 'findItem001',
        operator: '>=',
        value: 5,
        timeWindow: 30
      }
    ],
    outcomes: [
      { type: 'attributeChange', key: 'intelligence', value: 4 },
      { type: 'attributeChange', key: 'agility', value: 2 },
      { type: 'itemGain', key: '冒险者证书', value: 1 }
    ],
    probability: 0.8, // 降低概率
    weight: 3, // 降低权重
  },
  {
    id: 'history006',
    type: 'custom',
    name: '战斗狂热者',
    description: '你对战斗的热爱让你变得更加强大，但也更加鲁莽。',
    conditions: [
      {
        type: 'cumulative',
        key: 'battle002',
        operator: '>=',
        value: 3,
        historyType: 'eventTriggered',
        timeWindow: 5
      }
    ],
    outcomes: [
      { type: 'attributeChange', key: 'strength', value: 4 },
      { type: 'attributeChange', key: 'agility', value: 2 },
      { type: 'attributeChange', key: 'intelligence', value: -1 }
    ],
    probability: 0.7, // 降低概率
    weight: 3, // 降低权重
  },
  {
    id: 'history007',
    type: 'custom',
    name: '和平主义者的觉醒',
    description: '长期避免战斗让你获得了内心的平静和智慧。',
    conditions: [
      {
        type: 'eventCount',
        key: 'battle002',
        operator: '>=',
        value: 1,
        timeWindow: 999 // 检查整个历史
      },
      {
        type: 'daysSince',
        key: 'battle002',
        operator: '>=',
        value: 10
      }
    ],
    conditionLogic: 'AND', // 必须先经历过哥布林战斗，且距离上次>=10天
    outcomes: [
      { type: 'attributeChange', key: 'intelligence', value: 5 },
      { type: 'attributeChange', key: 'stamina', value: 3 },
      { type: 'itemGain', key: '和平符咒', value: 1 }
    ],
    probability: 0.3, // 降低概率
    weight: 1, // 降低权重
  },
  {
    id: 'history008',
    type: 'custom',
    name: '连续探索的奖励',
    description: '你的持续探索精神得到了大自然的认可。',
    conditions: [
      {
        type: 'streak',
        key: 'findItem001',
        operator: '>=',
        value: 4,
        historyType: 'eventTriggered',
        consecutive: true
      }
    ],
    outcomes: [
      { type: 'itemGain', key: '自然的祝福', value: 1 },
      { type: 'attributeChange', key: 'agility', value: 3 },
      { type: 'attributeChange', key: 'intelligence', value: 2 }
    ],
    probability: 0.8, // 降低概率
    weight: 3, // 降低权重
  },
];