import type { RandomValueConfig, EventOutcome } from './eventTypes';

/**
 * 随机值处理器
 * 
 * 负责处理各种类型的随机值生成，包括：
 * - 范围随机：在指定范围内生成随机数
 * - 选择随机：从给定选项中随机选择
 * - 权重随机：基于权重进行加权随机选择
 */
export class RandomProcessor {
  
  /**
   * 根据随机配置生成随机值
   * 
   * @param config 随机值配置
   * @returns 生成的随机值
   */
  static generateRandomValue(config: RandomValueConfig): number | string {
    switch (config.type) {
      case 'range':
        return this.generateRangeValue(config);
      case 'choice':
        return this.generateChoiceValue(config);
      case 'weighted':
        return this.generateWeightedValue(config);
      default:
        throw new Error(`未知的随机类型: ${(config as any).type}`);
    }
  }
  
  /**
   * 生成范围内的随机值
   * 
   * @param config 范围随机配置
   * @returns 范围内的随机数
   */
  private static generateRangeValue(config: RandomValueConfig): number {
    if (config.min === undefined || config.max === undefined) {
      throw new Error('范围随机需要指定 min 和 max 值');
    }
    
    if (config.min > config.max) {
      throw new Error('min 值不能大于 max 值');
    }
    
    const randomValue = Math.random() * (config.max - config.min) + config.min;
    
    // 根据配置决定是否返回浮点数
    return config.allowFloat ? randomValue : Math.floor(randomValue);
  }
  
  /**
   * 从选项中随机选择
   * 
   * @param config 选择随机配置
   * @returns 随机选择的值
   */
  private static generateChoiceValue(config: RandomValueConfig): number | string {
    if (!config.choices || config.choices.length === 0) {
      throw new Error('选择随机需要提供 choices 数组');
    }
    
    const randomIndex = Math.floor(Math.random() * config.choices.length);
    return config.choices[randomIndex];
  }
  
  /**
   * 基于权重进行随机选择
   * 
   * @param config 权重随机配置
   * @returns 权重随机选择的值
   */
  private static generateWeightedValue(config: RandomValueConfig): number | string {
    if (!config.weightedChoices || config.weightedChoices.length === 0) {
      throw new Error('权重随机需要提供 weightedChoices 数组');
    }
    
    // 计算总权重
    const totalWeight = config.weightedChoices.reduce((sum, choice) => sum + choice.weight, 0);
    
    if (totalWeight <= 0) {
      throw new Error('权重总和必须大于0');
    }
    
    // 生成随机数
    let random = Math.random() * totalWeight;
    
    // 轮盘赌选择
    for (const choice of config.weightedChoices) {
      random -= choice.weight;
      if (random <= 0) {
        return choice.value;
      }
    }
    
    // 兜底返回最后一个选项
    return config.weightedChoices[config.weightedChoices.length - 1].value;
  }
  
  /**
   * 处理随机结果类型的 EventOutcome
   * 
   * @param outcome 随机结果配置
   * @returns 随机选择的结果
   */
  static processRandomOutcome(outcome: EventOutcome): EventOutcome {
    if (outcome.type !== 'randomOutcome') {
      throw new Error('只能处理 randomOutcome 类型的结果');
    }
    
    if (!outcome.possibleOutcomes || outcome.possibleOutcomes.length === 0) {
      throw new Error('randomOutcome 需要提供 possibleOutcomes 数组');
    }
    
    // 过滤满足概率条件的结果
    const eligibleOutcomes = outcome.possibleOutcomes.filter(item => {
      const probability = item.probability ?? 1.0;
      return Math.random() <= probability;
    });
    
    if (eligibleOutcomes.length === 0) {
      // 如果没有结果满足概率条件，返回一个空的自定义结果
      return {
        type: 'custom',
        key: 'noEffect',
        value: 0
      };
    }
    
    // 如果有权重，使用权重随机选择
    const hasWeights = eligibleOutcomes.some(item => item.weight !== undefined);
    
    if (hasWeights) {
      const totalWeight = eligibleOutcomes.reduce((sum, item) => sum + (item.weight ?? 1), 0);
      let random = Math.random() * totalWeight;
      
      for (const item of eligibleOutcomes) {
        random -= (item.weight ?? 1);
        if (random <= 0) {
          return item.outcome;
        }
      }
    }
    
    // 否则使用均匀随机选择
    const randomIndex = Math.floor(Math.random() * eligibleOutcomes.length);
    return eligibleOutcomes[randomIndex].outcome;
  }
  
  /**
   * 解析带有随机配置的 EventOutcome，生成最终的固定值
   * 
   * @param outcome 可能包含随机配置的结果
   * @returns 解析后的固定值结果
   */
  static resolveRandomOutcome(outcome: EventOutcome): EventOutcome {
    // 如果是随机结果类型，先处理随机选择
    if (outcome.type === 'randomOutcome') {
      outcome = this.processRandomOutcome(outcome);
    }
    
    // 如果有随机值配置，生成随机值
    if (outcome.random) {
      const randomValue = this.generateRandomValue(outcome.random);
      return {
        ...outcome,
        value: randomValue,
        random: undefined // 清除随机配置，避免重复处理
      };
    }
    
    // 如果没有随机配置，直接返回原结果
    return outcome;
  }
  
  /**
   * 验证随机配置的有效性
   * 
   * @param config 随机配置
   * @returns 验证结果
   */
  static validateRandomConfig(config: RandomValueConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    switch (config.type) {
      case 'range':
        if (config.min === undefined) errors.push('范围随机缺少 min 值');
        if (config.max === undefined) errors.push('范围随机缺少 max 值');
        if (config.min !== undefined && config.max !== undefined && config.min > config.max) {
          errors.push('min 值不能大于 max 值');
        }
        break;
        
      case 'choice':
        if (!config.choices || config.choices.length === 0) {
          errors.push('选择随机需要提供非空的 choices 数组');
        }
        break;
        
      case 'weighted':
        if (!config.weightedChoices || config.weightedChoices.length === 0) {
          errors.push('权重随机需要提供非空的 weightedChoices 数组');
        } else {
          const totalWeight = config.weightedChoices.reduce((sum, choice) => sum + choice.weight, 0);
          if (totalWeight <= 0) {
            errors.push('权重总和必须大于0');
          }
        }
        break;
        
      default:
        errors.push(`未知的随机类型: ${(config as any).type}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * 随机结果工厂类
 * 
 * 提供便捷的方法来创建各种类型的随机结果配置
 */
export class RandomOutcomeFactory {
  
  /**
   * 创建范围随机配置
   */
  static range(min: number, max: number, allowFloat: boolean = false): RandomValueConfig {
    return {
      type: 'range',
      min,
      max,
      allowFloat
    };
  }
  
  /**
   * 创建选择随机配置
   */
  static choice(choices: Array<number | string>): RandomValueConfig {
    return {
      type: 'choice',
      choices
    };
  }
  
  /**
   * 创建权重随机配置
   */
  static weighted(weightedChoices: Array<{ value: number | string; weight: number }>): RandomValueConfig {
    return {
      type: 'weighted',
      weightedChoices
    };
  }
  
  /**
   * 创建随机属性变化结果
   */
  static randomAttributeChange(attribute: string, randomConfig: RandomValueConfig): EventOutcome {
    return {
      type: 'attributeChange',
      key: attribute,
      random: randomConfig
    };
  }
  
  /**
   * 创建随机物品获得结果
   */
  static randomItemGain(itemId: string, randomConfig: RandomValueConfig): EventOutcome {
    return {
      type: 'itemGain',
      key: itemId,
      random: randomConfig
    };
  }
  
  /**
   * 创建多选一随机结果
   */
  static multipleChoice(outcomes: Array<{
    outcome: EventOutcome;
    probability?: number;
    weight?: number;
  }>): EventOutcome {
    return {
      type: 'randomOutcome',
      key: 'multipleChoice',
      possibleOutcomes: outcomes
    };
  }
}