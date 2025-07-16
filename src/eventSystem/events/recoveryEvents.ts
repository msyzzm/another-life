/**
 * 恢复类事件
 * 包含休息、治疗、恢复体力等事件
 */

import type { GameEvent } from '../eventTypes';

export const recoveryEvents: GameEvent[] = [
  {
    id: 'custom004',
    type: 'custom',
    name: '疲劳恢复',
    description: '你在树荫下休息了一会儿，恢复了体力。',
    conditions: [
      { type: 'attribute', key: 'stamina', operator: '<', value: 12 }, // 提高触发条件
    ],
    outcomes: [
      { type: 'attributeChange', key: 'stamina', value: 3 },
    ],
    probability: 0.9,
    weight: 3, // 提高权重
  },
  {
    id: 'custom005',
    type: 'custom',
    name: '智慧启发',
    description: '你在冥想中获得了新的见解，智力得到提升。',
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 3 },
      { type: 'attribute', key: 'intelligence', operator: '>=', value: 12 },
    ],
    conditionLogic: 'AND',
    outcomes: [
      { type: 'attributeChange', key: 'intelligence', value: 2 },
    ],
    probability: 0.4,
    weight: 2,
  },
  {
    id: 'custom006',
    type: 'custom',
    name: '神秘治疗师',
    description: '一位神秘的治疗师为你完全恢复所有属性。',
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 4 },
    ],
    outcomes: [
      { type: 'custom', key: 'fullHeal', value: 1 },
    ],
    probability: 0.2,
    weight: 3,
  },
  {
    id: 'recovery001',
    type: 'custom',
    name: '温泉疗养',
    description: '你发现了一处天然温泉，浸泡后感觉身心舒畅。',
    conditions: [
      { type: 'attribute', key: 'stamina', operator: '<', value: 12 },
    ],
    outcomes: [
      { type: 'attributeChange', key: 'stamina', value: 5 },
      { type: 'attributeChange', key: 'strength', value: 1 },
    ],
    probability: 0.3,
    weight: 3,
  },
  // 新增低门槛恢复事件
  {
    id: 'recovery002',
    type: 'custom',
    name: '深呼吸',
    description: '你停下脚步，深深地呼吸新鲜空气，感觉精神焕发。',
    conditions: [], // 无条件
    outcomes: [
      { type: 'attributeChange', key: 'stamina', value: 1 },
      { type: 'attributeChange', key: 'intelligence', value: 1 },
    ],
    probability: 0.5,
    weight: 2,
  },
  {
    id: 'recovery003',
    type: 'custom',
    name: '观察星空',
    description: '夜晚时，你仰望星空，思考人生，获得了内心的平静。',
    conditions: [
      { type: 'attribute', key: 'intelligence', operator: '>=', value: 5 }, // 低门槛
    ],
    outcomes: [
      { type: 'attributeChange', key: 'intelligence', value: 2 },
      { type: 'attributeChange', key: 'stamina', value: 1 },
    ],
    probability: 0.4,
    weight: 2,
  },
];