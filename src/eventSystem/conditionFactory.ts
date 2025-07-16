/**
 * 事件条件工厂
 * 提供便捷的条件创建方法，简化事件定义过程
 */

import type { EventCondition } from './eventTypes';

export class ConditionFactory {
  /**
   * 创建属性条件
   */
  static attribute(key: string, operator: '>=' | '>' | '<=' | '<' | '==' | '!=', value: number): EventCondition {
    return {
      type: 'attribute',
      key,
      operator,
      value
    };
  }

  /**
   * 创建等级条件
   */
  static level(operator: '>=' | '>' | '<=' | '<' | '==' | '!=', value: number): EventCondition {
    return {
      type: 'level',
      key: 'level',
      operator,
      value
    };
  }


  /**
   * 创建物品拥有条件
   */
  static hasItem(itemId: string): EventCondition {
    return {
      type: 'item',
      key: itemId,
      operator: '==',
      value: 'true'
    };
  }

  /**
   * 创建物品数量条件
   */
  static itemCount(itemId: string, operator: '>=' | '>' | '<=' | '<' | '==' | '!=', count: number): EventCondition {
    return {
      type: 'itemCount',
      key: itemId,
      operator,
      value: count
    };
  }

  /**
   * 创建自定义条件
   */
  static custom(key: string, operator: '>=' | '>' | '<=' | '<' | '==' | '!=', value: number | string): EventCondition {
    return {
      type: 'custom',
      key,
      operator,
      value
    };
  }

  /**
   * 创建历史条件 - 检查某个事件是否在指定时间窗口内发生过
   */
  static history(
    eventId: string, 
    timeWindow: number = 30,
    historyType: 'eventTriggered' | 'attributeChange' | 'itemGained' | 'itemLost' = 'eventTriggered'
  ): EventCondition {
    return {
      type: 'history',
      key: eventId,
      operator: '==',
      value: 'true',
      historyType,
      timeWindow
    };
  }

  /**
   * 创建连续行为条件 - 检查是否连续N天发生某事件
   */
  static streak(
    eventIdOrKey: string,
    consecutiveDays: number,
    historyType: 'eventTriggered' | 'attributeChange' | 'itemGained' = 'eventTriggered'
  ): EventCondition {
    return {
      type: 'streak',
      key: eventIdOrKey,
      operator: '>=',
      value: consecutiveDays,
      historyType,
      consecutive: true
    };
  }

  /**
   * 创建累积统计条件 - 检查在时间窗口内的累积次数或数量
   */
  static cumulative(
    eventIdOrKey: string,
    operator: '>=' | '>' | '<=' | '<' | '==' | '!=',
    targetCount: number,
    timeWindow: number = 30,
    historyType: 'eventTriggered' | 'itemGained' = 'eventTriggered'
  ): EventCondition {
    return {
      type: 'cumulative',
      key: eventIdOrKey,
      operator,
      value: targetCount,
      historyType,
      timeWindow
    };
  }

  /**
   * 创建距离上次事件天数条件
   */
  static daysSince(
    eventId: string,
    operator: '>=' | '>' | '<=' | '<' | '==' | '!=',
    days: number
  ): EventCondition {
    return {
      type: 'daysSince',
      key: eventId,
      operator,
      value: days
    };
  }

  /**
   * 创建事件计数条件 - 检查某事件总共发生过多少次
   */
  static eventCount(
    eventId: string,
    operator: '>=' | '>' | '<=' | '<' | '==' | '!=',
    count: number,
    timeWindow?: number
  ): EventCondition {
    return {
      type: 'eventCount',
      key: eventId,
      operator,
      value: count,
      timeWindow
    };
  }
}

/**
 * 常用条件预设
 */
export class CommonConditions {
  /**
   * 最小力量要求
   */
  static minStrength(value: number) {
    return ConditionFactory.attribute('strength', '>=', value);
  }

  /**
   * 最小智力要求
   */
  static minIntelligence(value: number) {
    return ConditionFactory.attribute('intelligence', '>=', value);
  }

  /**
   * 最小敏捷要求
   */
  static minAgility(value: number) {
    return ConditionFactory.attribute('agility', '>=', value);
  }

  /**
   * 最小体力要求
   */
  static minStamina(value: number) {
    return ConditionFactory.attribute('stamina', '>=', value);
  }

  /**
   * 最小等级要求
   */
  static minLevel(value: number) {
    return ConditionFactory.level('>=', value);
  }


  /**
   * 低体力状态（小于50%）
   */
  static lowStamina(threshold: number = 8) {
    return ConditionFactory.attribute('stamina', '<', threshold);
  }

  /**
   * 高力量状态
   */
  static highStrength(threshold: number = 15) {
    return ConditionFactory.attribute('strength', '>=', threshold);
  }

  /**
   * 高智力状态
   */
  static highIntelligence(threshold: number = 15) {
    return ConditionFactory.attribute('intelligence', '>=', threshold);
  }
}

/**
 * 条件组合器
 * 帮助创建复杂的条件组合
 */
export class ConditionBuilder {
  private conditions: EventCondition[] = [];
  private logic: 'AND' | 'OR' = 'AND';

  /**
   * 设置条件逻辑（AND/OR）
   */
  setLogic(logic: 'AND' | 'OR'): ConditionBuilder {
    this.logic = logic;
    return this;
  }

  /**
   * 添加条件
   */
  add(condition: EventCondition): ConditionBuilder {
    this.conditions.push(condition);
    return this;
  }

  /**
   * 添加多个条件
   */
  addAll(conditions: EventCondition[]): ConditionBuilder {
    this.conditions.push(...conditions);
    return this;
  }

  /**
   * 构建最终结果
   */
  build(): { conditions: EventCondition[]; conditionLogic: 'AND' | 'OR' } {
    return {
      conditions: [...this.conditions],
      conditionLogic: this.logic
    };
  }

  /**
   * 重置构建器
   */
  reset(): ConditionBuilder {
    this.conditions = [];
    this.logic = 'AND';
    return this;
  }

  /**
   * 创建新的构建器实例
   */
  static create(): ConditionBuilder {
    return new ConditionBuilder();
  }
}

// 导出便捷函数
export const Conditions = {
  ...ConditionFactory,
  ...CommonConditions
};

export default ConditionFactory; 