/**
 * 事件构建器
 * 提供流畅的API来创建完整的游戏事件
 */

import type { GameEvent, EventType, EventCondition, EventOutcome } from './eventTypes';
import { ConditionBuilder } from './conditionFactory';
import { OutcomeBuilder } from './outcomeFactory';

export class EventBuilder {
  private event: Partial<GameEvent> = {};

  /**
   * 设置事件ID
   */
  setId(id: string): EventBuilder {
    this.event.id = id;
    return this;
  }

  /**
   * 设置事件类型
   */
  setType(type: EventType): EventBuilder {
    this.event.type = type;
    return this;
  }

  /**
   * 设置事件名称
   */
  setName(name: string): EventBuilder {
    this.event.name = name;
    return this;
  }

  /**
   * 设置事件描述
   */
  setDescription(description: string): EventBuilder {
    this.event.description = description;
    return this;
  }

  /**
   * 设置触发概率
   */
  setProbability(probability: number): EventBuilder {
    this.event.probability = Math.max(0, Math.min(1, probability));
    return this;
  }

  /**
   * 设置事件权重
   */
  setWeight(weight: number): EventBuilder {
    this.event.weight = Math.max(0, weight);
    return this;
  }

  /**
   * 设置条件
   */
  setConditions(conditions: EventCondition[]): EventBuilder {
    this.event.conditions = conditions;
    return this;
  }

  /**
   * 设置条件逻辑
   */
  setConditionLogic(logic: 'AND' | 'OR'): EventBuilder {
    this.event.conditionLogic = logic;
    return this;
  }

  /**
   * 设置结果
   */
  setOutcomes(outcomes: EventOutcome[]): EventBuilder {
    this.event.outcomes = outcomes;
    return this;
  }

  /**
   * 添加单个条件
   */
  addCondition(condition: EventCondition): EventBuilder {
    if (!this.event.conditions) {
      this.event.conditions = [];
    }
    this.event.conditions.push(condition);
    return this;
  }

  /**
   * 添加多个条件
   */
  addConditions(conditions: EventCondition[]): EventBuilder {
    if (!this.event.conditions) {
      this.event.conditions = [];
    }
    this.event.conditions.push(...conditions);
    return this;
  }

  /**
   * 添加单个结果
   */
  addOutcome(outcome: EventOutcome): EventBuilder {
    if (!this.event.outcomes) {
      this.event.outcomes = [];
    }
    this.event.outcomes.push(outcome);
    return this;
  }

  /**
   * 添加多个结果
   */
  addOutcomes(outcomes: EventOutcome[]): EventBuilder {
    if (!this.event.outcomes) {
      this.event.outcomes = [];
    }
    this.event.outcomes.push(...outcomes);
    return this;
  }

  /**
   * 使用条件构建器
   */
  withConditions(builderFn: (builder: ConditionBuilder) => ConditionBuilder): EventBuilder {
    const builder = ConditionBuilder.create();
    const result = builderFn(builder).build();
    this.event.conditions = result.conditions;
    this.event.conditionLogic = result.conditionLogic;
    return this;
  }

  /**
   * 使用结果构建器
   */
  withOutcomes(builderFn: (builder: OutcomeBuilder) => OutcomeBuilder): EventBuilder {
    const builder = OutcomeBuilder.create();
    this.event.outcomes = builderFn(builder).build();
    return this;
  }

  /**
   * 构建最终事件
   */
  build(): GameEvent {
    if (!this.event.id) {
      throw new Error('Event ID is required');
    }
    if (!this.event.type) {
      throw new Error('Event type is required');
    }
    if (!this.event.name) {
      throw new Error('Event name is required');
    }
    if (!this.event.description) {
      throw new Error('Event description is required');
    }
    if (!this.event.outcomes || this.event.outcomes.length === 0) {
      throw new Error('Event must have at least one outcome');
    }

    return this.event as GameEvent;
  }

  /**
   * 重置构建器
   */
  reset(): EventBuilder {
    this.event = {};
    return this;
  }

  /**
   * 创建新的构建器实例
   */
  static create(): EventBuilder {
    return new EventBuilder();
  }
}

/**
 * 事件模板工厂
 * 提供常见事件类型的快速创建模板
 */
export class EventTemplates {
  /**
   * 创建战斗事件模板
   */
  static battle(options: {
    id: string;
    name: string;
    description: string;
    minStrength?: number;
    strengthGain?: number;
    loot?: { itemId: string; quantity: number };
    probability?: number;
    weight?: number;
  }): EventBuilder {
    const builder = EventBuilder.create()
      .setId(options.id)
      .setType('battle')
      .setName(options.name)
      .setDescription(options.description)
      .setProbability(options.probability || 0.7)
      .setWeight(options.weight || 2);

    if (options.minStrength) {
      builder.addCondition({
        type: 'attribute',
        key: 'strength',
        operator: '>=',
        value: options.minStrength
      });
    }

    if (options.strengthGain) {
      builder.addOutcome({
        type: 'attributeChange',
        key: 'strength',
        value: options.strengthGain
      });
    }

    if (options.loot) {
      builder.addOutcome({
        type: 'itemGain',
        key: options.loot.itemId,
        value: options.loot.quantity
      });
    }

    return builder;
  }

  /**
   * 创建发现物品事件模板
   */
  static findItem(options: {
    id: string;
    name: string;
    description: string;
    item: { itemId: string; quantity: number };
    minIntelligence?: number;
    probability?: number;
    weight?: number;
  }): EventBuilder {
    const builder = EventBuilder.create()
      .setId(options.id)
      .setType('findItem')
      .setName(options.name)
      .setDescription(options.description)
      .setProbability(options.probability || 0.6)
      .setWeight(options.weight || 2)
      .addOutcome({
        type: 'itemGain',
        key: options.item.itemId,
        value: options.item.quantity
      });

    if (options.minIntelligence) {
      builder.addCondition({
        type: 'attribute',
        key: 'intelligence',
        operator: '>=',
        value: options.minIntelligence
      });
    }

    return builder;
  }

  /**
   * 创建升级事件模板
   */
  static levelUp(options: {
    id: string;
    name: string;
    description: string;
    requirements?: EventCondition[];
    attributeBonus?: { [key: string]: number };
    probability?: number;
    weight?: number;
  }): EventBuilder {
    const builder = EventBuilder.create()
      .setId(options.id)
      .setType('levelUp')
      .setName(options.name)
      .setDescription(options.description)
      .setProbability(options.probability || 0.3)
      .setWeight(options.weight || 5)
      .addOutcome({
        type: 'levelChange',
        key: 'level',
        value: 1
      });

    if (options.requirements) {
      builder.addConditions(options.requirements);
    }

    if (options.attributeBonus) {
      Object.entries(options.attributeBonus).forEach(([key, value]) => {
        builder.addOutcome({
          type: 'attributeChange',
          key,
          value
        });
      });
    }

    return builder;
  }

  /**
   * 创建职业专属事件模板
   */
  static professionEvent(options: {
    id: string;
    name: string;
    description: string;
    profession: string;
    requirements?: EventCondition[];
    rewards: EventOutcome[];
    probability?: number;
    weight?: number;
  }): EventBuilder {
    const builder = EventBuilder.create()
      .setId(options.id)
      .setType('custom')
      .setName(options.name)
      .setDescription(options.description)
      .setProbability(options.probability || 0.5)
      .setWeight(options.weight || 3)
      .addCondition({
        type: 'profession',
        key: 'profession',
        operator: '==',
        value: options.profession
      })
      .addOutcomes(options.rewards);

    if (options.requirements) {
      builder.addConditions(options.requirements);
    }

    return builder;
  }

  /**
   * 创建交易事件模板
   */
  static trade(options: {
    id: string;
    name: string;
    description: string;
    cost: { itemId: string; quantity: number };
    reward: { itemId: string; quantity: number };
    probability?: number;
    weight?: number;
  }): EventBuilder {
    return EventBuilder.create()
      .setId(options.id)
      .setType('custom')
      .setName(options.name)
      .setDescription(options.description)
      .setProbability(options.probability || 0.6)
      .setWeight(options.weight || 3)
      .addCondition({
        type: 'itemCount',
        key: options.cost.itemId,
        operator: '>=',
        value: options.cost.quantity
      })
      .addOutcome({
        type: 'itemLoss',
        key: options.cost.itemId,
        value: options.cost.quantity
      })
      .addOutcome({
        type: 'itemGain',
        key: options.reward.itemId,
        value: options.reward.quantity
      });
  }

  /**
   * 创建恢复事件模板
   */
  static recovery(options: {
    id: string;
    name: string;
    description: string;
    attributeKey: string;
    recoveryAmount: number;
    triggerThreshold?: number;
    probability?: number;
    weight?: number;
  }): EventBuilder {
    const builder = EventBuilder.create()
      .setId(options.id)
      .setType('custom')
      .setName(options.name)
      .setDescription(options.description)
      .setProbability(options.probability || 0.8)
      .setWeight(options.weight || 1)
      .addOutcome({
        type: 'attributeChange',
        key: options.attributeKey,
        value: options.recoveryAmount
      });

    if (options.triggerThreshold !== undefined) {
      builder.addCondition({
        type: 'attribute',
        key: options.attributeKey,
        operator: '<',
        value: options.triggerThreshold
      });
    }

    return builder;
  }
}

export default EventBuilder; 