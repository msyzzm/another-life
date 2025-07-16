/**
 * 事件系统测试辅助模块
 * 提供测试工具和模拟数据
 */

import type { Character } from '../types/character';
import type { Inventory } from '../types/inventory';
import type { GameEvent, EventCondition, EventOutcome } from './eventTypes';

/**
 * 创建测试角色数据
 */
export function createTestCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'test-character-1',
    name: '测试角色',
    level: 1,
    profession: '战士',
    daysLived: 0, // 添加缺失的daysLived字段
    stats: {
      strength: 10,
      intelligence: 8,
      agility: 6,
      stamina: 12
    },
    equipment: {
      weapon: undefined,
      armor: undefined,
      accessory: undefined
    },
    inventory: [],
    ...overrides
  };
}

/**
 * 创建测试物品栏数据
 */
export function createTestInventory(overrides: Partial<Inventory> = {}): Inventory {
  return {
    ownerId: 'test-character-1',
    items: [
      {
        id: '治疗药水',
        name: '治疗药水',
        type: 'consumable',
        quantity: 3,
        ownerId: 'test-character-1'
      },
      {
        id: '史莱姆胶',
        name: '史莱姆胶',
        type: 'material',
        quantity: 5,
        ownerId: 'test-character-1'
      }
    ],
    ...overrides
  };
}

/**
 * 创建简单测试事件
 */
export function createTestEvent(overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: 'test-event-1',
    type: 'custom',
    name: '测试事件',
    description: '这是一个用于测试的事件',
    conditions: [
      {
        type: 'attribute',
        key: 'strength',
        operator: '>=',
        value: 5
      }
    ],
    outcomes: [
      {
        type: 'attributeChange',
        key: 'strength',
        value: 1
      }
    ],
    probability: 1.0,
    weight: 1,
    ...overrides
  };
}

/**
 * 创建测试条件
 */
export function createTestCondition(overrides: Partial<EventCondition> = {}): EventCondition {
  return {
    type: 'attribute',
    key: 'strength',
    operator: '>=',
    value: 10,
    ...overrides
  };
}

/**
 * 创建测试结果
 */
export function createTestOutcome(overrides: Partial<EventOutcome> = {}): EventOutcome {
  return {
    type: 'attributeChange',
    key: 'strength',
    value: 1,
    ...overrides
  };
}

/**
 * 事件系统测试套件
 */
export class EventSystemTestSuite {
  /**
   * 测试条件检查功能
   */
  static testConditionChecking() {
    const character = createTestCharacter();
    const inventory = createTestInventory();
    const results: { [key: string]: boolean } = {};

    // 测试各种条件类型
    const conditions = [
      { type: 'attribute', key: 'strength', operator: '>=', value: 5 },
      { type: 'attribute', key: 'strength', operator: '>', value: 15 },
      { type: 'level', key: 'level', operator: '==', value: 1 },
      { type: 'profession', key: 'profession', operator: '==', value: '战士' },
      { type: 'itemCount', key: '治疗药水', operator: '>=', value: 2 }
    ];

    // 这里需要导入实际的条件检查函数来测试
    // results[`condition_${index}`] = checkCondition(condition, character, inventory);

    return results;
  }

  /**
   * 测试结果应用功能
   */
  static testOutcomeApplication() {
    const character = createTestCharacter();
    const inventory = createTestInventory();
    const results: { [key: string]: any } = {};

    const outcomes = [
      { type: 'attributeChange', key: 'strength', value: 5 },
      { type: 'itemGain', key: '新物品', value: 1 },
      { type: 'levelChange', key: 'level', value: 1 }
    ];

    // 这里需要导入实际的结果应用函数来测试
    // results.character = character;
    // results.inventory = inventory;

    return results;
  }

  /**
   * 性能测试
   */
  static performanceTest(iterations: number = 1000) {
    const character = createTestCharacter();
    const inventory = createTestInventory();
    const event = createTestEvent();

    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      // 这里进行性能测试
      // canTriggerEvent(event, character, inventory);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    return {
      iterations,
      totalTime: duration,
      averageTime: duration / iterations,
      operationsPerSecond: iterations / (duration / 1000)
    };
  }

  /**
   * 压力测试
   */
  static stressTest() {
    const character = createTestCharacter();
    const inventory = createTestInventory();
    const events: GameEvent[] = [];

    // 创建大量测试事件
    for (let i = 0; i < 1000; i++) {
      events.push(createTestEvent({
        id: `stress-test-event-${i}`,
        name: `压力测试事件 ${i}`,
        conditions: [
          {
            type: 'attribute',
            key: 'strength',
            operator: '>=',
            value: Math.floor(Math.random() * 20)
          }
        ]
      }));
    }

    const startTime = performance.now();
    let processedEvents = 0;

    // 尝试处理所有事件
    events.forEach(event => {
      // 这里需要导入实际的事件处理函数
      // if (canTriggerEvent(event, character, inventory)) {
      //   processedEvents++;
      // }
    });

    const endTime = performance.now();

    return {
      totalEvents: events.length,
      processedEvents,
      processingTime: endTime - startTime,
      eventsPerSecond: events.length / ((endTime - startTime) / 1000)
    };
  }
}

/**
 * 事件验证工具
 */
export class EventValidator {
  /**
   * 验证事件的结构完整性
   */
  static validateEventStructure(event: GameEvent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!event.id) errors.push('Event must have an ID');
    if (!event.name) errors.push('Event must have a name');
    if (!event.description) errors.push('Event must have a description');
    if (!event.type) errors.push('Event must have a type');
    if (!event.outcomes || event.outcomes.length === 0) {
      errors.push('Event must have at least one outcome');
    }
    if (event.probability !== undefined && (event.probability < 0 || event.probability > 1)) {
      errors.push('Event probability must be between 0 and 1');
    }
    if (event.weight !== undefined && event.weight < 0) {
      errors.push('Event weight must be non-negative');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证条件的有效性
   */
  static validateCondition(condition: EventCondition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!condition.type) errors.push('Condition must have a type');
    if (!condition.key) errors.push('Condition must have a key');
    if (!condition.operator) errors.push('Condition must have an operator');
    if (condition.value === undefined) errors.push('Condition must have a value');

    const validOperators = ['>=', '>', '<=', '<', '==', '!='];
    if (!validOperators.includes(condition.operator)) {
      errors.push(`Invalid operator: ${condition.operator}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证结果的有效性
   */
  static validateOutcome(outcome: EventOutcome): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!outcome.type) errors.push('Outcome must have a type');
    if (!outcome.key) errors.push('Outcome must have a key');
    if (outcome.value === undefined) errors.push('Outcome must have a value');

    const validTypes = ['attributeChange', 'itemGain', 'itemLoss', 'levelChange', 'custom'];
    if (!validTypes.includes(outcome.type)) {
      errors.push(`Invalid outcome type: ${outcome.type}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * 模拟数据生成器
 */
export class MockDataGenerator {
  /**
   * 生成随机角色
   */
  static generateRandomCharacter(): Character {
    const professions = ['战士', '法师', '盗贼', '牧师'];
    const names = ['阿尔托', '露娜', '凯尔', '艾莉雅', '达格'];

    return createTestCharacter({
      id: `char-${Math.random().toString(36).substr(2, 9)}`,
      name: names[Math.floor(Math.random() * names.length)],
      level: Math.floor(Math.random() * 10) + 1,
      profession: professions[Math.floor(Math.random() * professions.length)],
      stats: {
        strength: Math.floor(Math.random() * 20) + 5,
        intelligence: Math.floor(Math.random() * 20) + 5,
        agility: Math.floor(Math.random() * 20) + 5,
        stamina: Math.floor(Math.random() * 20) + 5
      }
    });
  }

  /**
   * 生成随机物品栏
   */
  static generateRandomInventory(ownerId: string): Inventory {
    const itemNames = ['治疗药水', '法力药水', '史莱姆胶', '铁剑', '木盾', '面包', '金币'];
    const items = [];

    const numItems = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < numItems; i++) {
      const itemName = itemNames[Math.floor(Math.random() * itemNames.length)];
      items.push({
        id: itemName,
        name: itemName,
        type: 'misc' as const,
        quantity: Math.floor(Math.random() * 10) + 1,
        ownerId
      });
    }

    return {
      ownerId,
      items
    };
  }

  /**
   * 生成随机事件
   */
  static generateRandomEvent(): GameEvent {
    const eventTypes = ['battle', 'findItem', 'levelUp', 'custom'];
    const attributes = ['strength', 'intelligence', 'agility', 'stamina'];
    const operators = ['>=', '>', '<=', '<', '=='];

    return createTestEvent({
      id: `event-${Math.random().toString(36).substr(2, 9)}`,
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)] as any,
      name: `随机事件 ${Math.floor(Math.random() * 1000)}`,
      conditions: [
        {
          type: 'attribute',
          key: attributes[Math.floor(Math.random() * attributes.length)],
          operator: operators[Math.floor(Math.random() * operators.length)] as any,
          value: Math.floor(Math.random() * 15) + 1
        }
      ],
      outcomes: [
        {
          type: 'attributeChange',
          key: attributes[Math.floor(Math.random() * attributes.length)],
          value: Math.floor(Math.random() * 5) + 1
        }
      ],
      probability: Math.random(),
      weight: Math.floor(Math.random() * 5) + 1
    });
  }
}

export default {
  createTestCharacter,
  createTestInventory,
  createTestEvent,
  createTestCondition,
  createTestOutcome,
  EventSystemTestSuite,
  EventValidator,
  MockDataGenerator
}; 