/**
 * 事件结果工厂
 * 提供便捷的结果创建方法，简化事件定义过程
 */

import type { EventOutcome } from './eventTypes';

export class OutcomeFactory {
  /**
   * 创建属性变化结果
   */
  static attributeChange(key: string, value: number): EventOutcome {
    return {
      type: 'attributeChange',
      key,
      value
    };
  }

  /**
   * 创建等级变化结果
   */
  static levelChange(value: number): EventOutcome {
    return {
      type: 'levelChange',
      key: 'level',
      value
    };
  }

  /**
   * 创建物品获得结果
   */
  static itemGain(itemId: string, quantity: number): EventOutcome {
    return {
      type: 'itemGain',
      key: itemId,
      value: quantity
    };
  }

  /**
   * 创建物品失去结果
   */
  static itemLoss(itemId: string, quantity: number): EventOutcome {
    return {
      type: 'itemLoss',
      key: itemId,
      value: quantity
    };
  }

  /**
   * 创建自定义结果
   */
  static custom(key: string, value: number | string): EventOutcome {
    return {
      type: 'custom',
      key,
      value
    };
  }
}

/**
 * 常用结果预设
 */
export class CommonOutcomes {
  /**
   * 力量增加
   */
  static strengthGain(value: number) {
    return OutcomeFactory.attributeChange('strength', value);
  }

  /**
   * 力量减少
   */
  static strengthLoss(value: number) {
    return OutcomeFactory.attributeChange('strength', -Math.abs(value));
  }

  /**
   * 智力增加
   */
  static intelligenceGain(value: number) {
    return OutcomeFactory.attributeChange('intelligence', value);
  }

  /**
   * 智力减少
   */
  static intelligenceLoss(value: number) {
    return OutcomeFactory.attributeChange('intelligence', -Math.abs(value));
  }

  /**
   * 敏捷增加
   */
  static agilityGain(value: number) {
    return OutcomeFactory.attributeChange('agility', value);
  }

  /**
   * 敏捷减少
   */
  static agilityLoss(value: number) {
    return OutcomeFactory.attributeChange('agility', -Math.abs(value));
  }

  /**
   * 体力增加
   */
  static staminaGain(value: number) {
    return OutcomeFactory.attributeChange('stamina', value);
  }

  /**
   * 体力减少
   */
  static staminaLoss(value: number) {
    return OutcomeFactory.attributeChange('stamina', -Math.abs(value));
  }

  /**
   * 升级
   */
  static levelUp(levels: number = 1) {
    return OutcomeFactory.levelChange(levels);
  }

  /**
   * 降级（通常不使用，但保留接口）
   */
  static levelDown(levels: number = 1) {
    return OutcomeFactory.levelChange(-Math.abs(levels));
  }

  /**
   * 完全治疗（自定义结果）
   */
  static fullHeal() {
    return OutcomeFactory.custom('fullHeal', 1);
  }

  /**
   * 随机属性提升（自定义结果）
   */
  static randomAttributeBoost() {
    return OutcomeFactory.custom('randomAttributeBoost', 1);
  }

  /**
   * 获得金币
   */
  static goldGain(amount: number) {
    return OutcomeFactory.itemGain('金币', amount);
  }

  /**
   * 失去金币
   */
  static goldLoss(amount: number) {
    return OutcomeFactory.itemLoss('金币', amount);
  }

  /**
   * 获得经验值
   */
  static experienceGain(amount: number) {
    return OutcomeFactory.itemGain('经验值', amount);
  }
}

/**
 * 结果组合器
 * 帮助创建复杂的结果组合
 */
export class OutcomeBuilder {
  private outcomes: EventOutcome[] = [];

  /**
   * 添加结果
   */
  add(outcome: EventOutcome): OutcomeBuilder {
    this.outcomes.push(outcome);
    return this;
  }

  /**
   * 添加多个结果
   */
  addAll(outcomes: EventOutcome[]): OutcomeBuilder {
    this.outcomes.push(...outcomes);
    return this;
  }

  /**
   * 添加属性变化
   */
  addAttributeChange(key: string, value: number): OutcomeBuilder {
    this.outcomes.push(OutcomeFactory.attributeChange(key, value));
    return this;
  }

  /**
   * 添加物品获得
   */
  addItemGain(itemId: string, quantity: number): OutcomeBuilder {
    this.outcomes.push(OutcomeFactory.itemGain(itemId, quantity));
    return this;
  }

  /**
   * 添加物品失去
   */
  addItemLoss(itemId: string, quantity: number): OutcomeBuilder {
    this.outcomes.push(OutcomeFactory.itemLoss(itemId, quantity));
    return this;
  }

  /**
   * 添加等级变化
   */
  addLevelChange(value: number): OutcomeBuilder {
    this.outcomes.push(OutcomeFactory.levelChange(value));
    return this;
  }

  /**
   * 构建最终结果
   */
  build(): EventOutcome[] {
    return [...this.outcomes];
  }

  /**
   * 重置构建器
   */
  reset(): OutcomeBuilder {
    this.outcomes = [];
    return this;
  }

  /**
   * 创建新的构建器实例
   */
  static create(): OutcomeBuilder {
    return new OutcomeBuilder();
  }
}

/**
 * 战斗结果预设模板
 */
export class BattleOutcomes {
  /**
   * 胜利结果模板
   */
  static victory(
    strengthGain: number = 1,
    experienceGain: number = 10,
    loot?: { itemId: string; quantity: number }
  ): EventOutcome[] {
    const outcomes = [
      CommonOutcomes.strengthGain(strengthGain),
      CommonOutcomes.experienceGain(experienceGain)
    ];

    if (loot) {
      outcomes.push(OutcomeFactory.itemGain(loot.itemId, loot.quantity));
    }

    return outcomes;
  }

  /**
   * 失败结果模板
   */
  static defeat(staminaLoss: number = 2): EventOutcome[] {
    return [
      CommonOutcomes.staminaLoss(staminaLoss)
    ];
  }

  /**
   * 艰难胜利结果模板
   */
  static hardVictory(
    strengthGain: number = 2,
    staminaLoss: number = 1,
    experienceGain: number = 15,
    loot?: { itemId: string; quantity: number }
  ): EventOutcome[] {
    const outcomes = [
      CommonOutcomes.strengthGain(strengthGain),
      CommonOutcomes.staminaLoss(staminaLoss),
      CommonOutcomes.experienceGain(experienceGain)
    ];

    if (loot) {
      outcomes.push(OutcomeFactory.itemGain(loot.itemId, loot.quantity));
    }

    return outcomes;
  }
}

// 导出便捷函数
export const Outcomes = {
  ...OutcomeFactory,
  ...CommonOutcomes
};

export default OutcomeFactory; 