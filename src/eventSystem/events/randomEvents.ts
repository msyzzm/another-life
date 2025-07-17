/**
 * 随机结果事件示例
 * 
 * 展示如何使用新的随机结果功能创建更有趣和多样化的事件
 */

import type { GameEvent } from '../eventTypes';
import { OutcomeFactory } from '../outcomeFactory';

export const randomEvents: GameEvent[] = [
  {
    id: 'random_training',
    type: 'custom',
    name: '随机训练',
    description: '你进行了一次训练，效果因人而异',
    conditions: [
      { type: 'attribute', key: 'stamina', operator: '>=', value: 3 }
    ],
    outcomes: [
      // 随机范围的力量增加 (1-3点)
      OutcomeFactory.randomAttributeChange('strength', 1, 3),
      // 固定的体力消耗
      OutcomeFactory.attributeChange('stamina', -1)
    ],
    probability: 0.8,
    weight: 5
  },

  {
    id: 'treasure_chest',
    type: 'findItem',
    name: '神秘宝箱',
    description: '你发现了一个神秘的宝箱，里面可能有各种宝物',
    conditions: [
      { type: 'attribute', key: 'intelligence', operator: '>=', value: 5 }
    ],
    outcomes: [
      // 多选一随机结果：要么获得金币，要么获得装备，要么获得药水
      OutcomeFactory.multipleChoice([
        {
          outcome: OutcomeFactory.randomItemGain('gold', 10, 50), // 10-50金币
          weight: 5
        },
        {
          outcome: OutcomeFactory.randomItemFromList(['sword', 'shield', 'armor'], 1), // 随机装备
          weight: 2
        },
        {
          outcome: OutcomeFactory.randomItemGain('health_potion', 1, 3), // 1-3个药水
          weight: 3
        }
      ])
    ],
    probability: 0.3,
    weight: 8
  },

  {
    id: 'skill_practice',
    type: 'custom',
    name: '技能练习',
    description: '你花时间练习各种技能，随机提升某项属性',
    conditions: [],
    outcomes: [
      // 随机选择提升的属性
      OutcomeFactory.choiceAttributeChange('strength', [1, 2]),
      OutcomeFactory.choiceAttributeChange('agility', [1, 2]),
      OutcomeFactory.choiceAttributeChange('intelligence', [1, 2]),
      OutcomeFactory.choiceAttributeChange('stamina', [1, 2])
    ],
    probability: 0.6,
    weight: 4
  },

  {
    id: 'gambling_game',
    type: 'custom',
    name: '赌博游戏',
    description: '你参与了一场赌博，结果难以预料',
    conditions: [
      { type: 'item', key: 'gold', operator: '==', value: 1 }
    ],
    outcomes: [
      // 权重随机结果：大概率小赢，小概率大赢或大输
      OutcomeFactory.weightedAttributeChange('gold', [
        { value: -10, weight: 20 }, // 20% 概率输10金币
        { value: -5, weight: 30 },  // 30% 概率输5金币
        { value: 5, weight: 35 },   // 35% 概率赢5金币
        { value: 20, weight: 10 },  // 10% 概率赢20金币
        { value: 50, weight: 5 }    // 5% 概率赢50金币
      ])
    ],
    probability: 0.4,
    weight: 3
  },

  {
    id: 'random_encounter',
    type: 'battle',
    name: '随机遭遇',
    description: '你遇到了一个神秘的存在，结果完全随机',
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 2 }
    ],
    outcomes: [
      // 复杂的多选一结果：不同的遭遇类型
      OutcomeFactory.multipleChoice([
        {
          // 友好遭遇：获得礼物
          outcome: OutcomeFactory.multipleChoice([
            {
              outcome: OutcomeFactory.randomItemGain('rare_gem', 1, 1),
              probability: 0.8
            },
            {
              outcome: OutcomeFactory.randomAttributeChange('intelligence', 2, 5),
              probability: 0.8
            }
          ]),
          weight: 4,
          probability: 0.7
        },
        {
          // 中性遭遇：交换
          outcome: OutcomeFactory.multipleChoice([
            {
              outcome: OutcomeFactory.attributeChange('strength', 1),
              weight: 1
            },
            {
              outcome: OutcomeFactory.attributeChange('agility', 1),
              weight: 1
            }
          ]),
          weight: 3,
          probability: 0.9
        },
        {
          // 敌对遭遇：战斗
          outcome: OutcomeFactory.multipleChoice([
            {
              outcome: OutcomeFactory.attributeChange('stamina', -2),
              weight: 3
            },
            {
              outcome: OutcomeFactory.attributeChange('strength', -1),
              weight: 1
            }
          ]),
          weight: 2,
          probability: 0.6
        }
      ])
    ],
    probability: 0.2,
    weight: 6
  },

  {
    id: 'weather_effect',
    type: 'custom',
    name: '天气影响',
    description: '今天的天气对你产生了随机影响',
    conditions: [],
    outcomes: [
      // 基于概率的多种可能结果
      OutcomeFactory.multipleChoice([
        {
          outcome: OutcomeFactory.attributeChange('agility', 1), // 晴天：敏捷+1
          probability: 0.4,
          weight: 1
        },
        {
          outcome: OutcomeFactory.attributeChange('stamina', -1), // 雨天：体力-1
          probability: 0.3,
          weight: 1
        },
        {
          outcome: OutcomeFactory.attributeChange('intelligence', 1), // 多云：智力+1
          probability: 0.2,
          weight: 1
        },
        {
          outcome: OutcomeFactory.custom('noEffect', 0), // 无影响
          probability: 0.1,
          weight: 1
        }
      ])
    ],
    probability: 0.5,
    weight: 2
  }
];

export default randomEvents;