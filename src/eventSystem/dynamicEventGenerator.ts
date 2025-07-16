/**
 * 动态事件生成器
 * 根据玩家状态、难度和上下文因素动态调整和生成事件
 */

import type { GameEvent, EventCondition, EventOutcome } from './eventTypes';
import type { Character } from '../types/character';
import type { Inventory } from '../types/inventory';
import { HistoryManager } from './historyManager';
import { eventLibrary } from './events/index';

// 动态调整配置
export interface DynamicConfig {
  difficultyScaling: number;      // 难度缩放系数 (0.5 - 2.0)
  rewardMultiplier: number;       // 奖励倍数 (0.5 - 3.0)
  adaptiveMode: boolean;          // 是否启用自适应模式
  playerPowerLevel: number;       // 玩家力量等级（基于属性计算）
  historyInfluence: number;       // 历史影响权重 (0.0 - 1.0)
}

// 事件变体类型
export interface EventVariant {
  baseEventId: string;
  variantName: string;
  difficultyLevel: 'easy' | 'normal' | 'hard' | 'expert';
  adaptedEvent: GameEvent;
}

export class DynamicEventGenerator {
  private config: DynamicConfig;
  private baseEvents: GameEvent[];
  private generatedVariants: Map<string, EventVariant[]> = new Map();

  constructor(config: Partial<DynamicConfig> = {}) {
    this.config = {
      difficultyScaling: 1.0,
      rewardMultiplier: 1.0,
      adaptiveMode: true,
      playerPowerLevel: 1.0,
      historyInfluence: 0.3,
      ...config
    };
    this.baseEvents = [...eventLibrary];
  }

  /**
   * 基于玩家状态动态生成适配的事件
   */
  generateAdaptiveEvents(
    character: Character,
    inventory: Inventory,
    historyManager?: HistoryManager
  ): GameEvent[] {
    // 计算玩家力量等级
    const powerLevel = this.calculatePlayerPowerLevel(character);
    
    // 更新配置
    this.updateDynamicConfig(character, inventory, historyManager);
    
    // 生成适配事件
    const adaptedEvents: GameEvent[] = [];
    
    for (const baseEvent of this.baseEvents) {
      // 为每个基础事件生成变体
      const variants = this.generateEventVariants(baseEvent, character, inventory);
      
      // 选择最适合当前状态的变体
      const bestVariant = this.selectBestVariant(variants, character, powerLevel);
      
      if (bestVariant) {
        adaptedEvents.push(bestVariant.adaptedEvent);
      }
    }
    
    return adaptedEvents;
  }

  /**
   * 计算玩家力量等级
   */
  private calculatePlayerPowerLevel(character: Character): number {
    const statTotal = character.stats.strength + character.stats.intelligence + 
                     character.stats.agility + character.stats.stamina;
    const levelBonus = character.level * 2;
    const baseValue = statTotal + levelBonus;
    
    // 标准化到1-10范围
    return Math.max(1, Math.min(10, baseValue / 5));
  }

  /**
   * 更新动态配置
   */
  private updateDynamicConfig(
    character: Character,
    inventory: Inventory,
    historyManager?: HistoryManager
  ): void {
    if (!this.config.adaptiveMode) return;

    const powerLevel = this.calculatePlayerPowerLevel(character);
    this.config.playerPowerLevel = powerLevel;

    // 根据玩家力量调整难度
    if (powerLevel > 7) {
      this.config.difficultyScaling = 1.3;
      this.config.rewardMultiplier = 1.4;
    } else if (powerLevel < 3) {
      this.config.difficultyScaling = 0.7;
      this.config.rewardMultiplier = 1.1;
    } else {
      this.config.difficultyScaling = 1.0;
      this.config.rewardMultiplier = 1.0;
    }

    // 根据历史调整
    if (historyManager) {
      const recentFailures = this.countRecentFailures(historyManager, character.daysLived || 0);
      if (recentFailures > 3) {
        this.config.difficultyScaling *= 0.8; // 降低难度
        this.config.rewardMultiplier *= 1.2;  // 增加奖励
      }
    }
  }

  /**
   * 为单个事件生成多个难度变体
   */
  private generateEventVariants(
    baseEvent: GameEvent,
    character: Character,
    inventory: Inventory
  ): EventVariant[] {
    const variants: EventVariant[] = [];
    const difficulties: Array<{ level: 'easy' | 'normal' | 'hard' | 'expert', scale: number }> = [
      { level: 'easy', scale: 0.7 },
      { level: 'normal', scale: 1.0 },
      { level: 'hard', scale: 1.4 },
      { level: 'expert', scale: 2.0 }
    ];

    for (const diff of difficulties) {
      const adaptedEvent = this.adaptEventDifficulty(baseEvent, diff.scale);
      
      variants.push({
        baseEventId: baseEvent.id,
        variantName: `${baseEvent.name} (${diff.level})`,
        difficultyLevel: diff.level,
        adaptedEvent
      });
    }

    return variants;
  }

  /**
   * 调整事件难度
   */
  private adaptEventDifficulty(baseEvent: GameEvent, difficultyScale: number): GameEvent {
    const adapted: GameEvent = JSON.parse(JSON.stringify(baseEvent)); // 深拷贝
    
    // 调整ID以区分变体
    adapted.id = `${baseEvent.id}_scale_${difficultyScale}`;
    
    // 调整条件要求
    if (adapted.conditions) {
      adapted.conditions = adapted.conditions.map(condition => {
        if (condition.type === 'attribute' || condition.type === 'level') {
          const newCondition = { ...condition };
          if (typeof condition.value === 'number') {
            newCondition.value = Math.round(condition.value * difficultyScale);
          }
          return newCondition;
        }
        return condition;
      });
    }

    // 调整奖励
    adapted.outcomes = adapted.outcomes.map(outcome => {
      if (outcome.type === 'attributeChange' || outcome.type === 'itemGain') {
        const newOutcome = { ...outcome };
        if (typeof outcome.value === 'number') {
          // 奖励与难度成正比
          newOutcome.value = Math.round(outcome.value * difficultyScale * this.config.rewardMultiplier);
        }
        return newOutcome;
      }
      return outcome;
    });

    // 调整概率（难度越高，概率稍微降低）
    if (adapted.probability) {
      adapted.probability = Math.max(0.05, adapted.probability * (1.1 - difficultyScale * 0.1));
    }

    // 调整权重
    if (adapted.weight) {
      adapted.weight = Math.round(adapted.weight * difficultyScale);
    }

    return adapted;
  }

  /**
   * 选择最适合当前玩家状态的事件变体
   */
  private selectBestVariant(
    variants: EventVariant[],
    character: Character,
    playerPowerLevel: number
  ): EventVariant | null {
    // 根据玩家力量等级选择合适的难度
    let targetDifficulty: 'easy' | 'normal' | 'hard' | 'expert';
    
    if (playerPowerLevel <= 3) {
      targetDifficulty = 'easy';
    } else if (playerPowerLevel <= 6) {
      targetDifficulty = 'normal';
    } else if (playerPowerLevel <= 8) {
      targetDifficulty = 'hard';
    } else {
      targetDifficulty = 'expert';
    }

    // 查找目标难度的变体
    const targetVariant = variants.find(v => v.difficultyLevel === targetDifficulty);
    if (targetVariant) {
      return targetVariant;
    }

    // 如果没有找到目标难度，返回最接近的
    const orderedDifficulties = ['easy', 'normal', 'hard', 'expert'];
    const targetIndex = orderedDifficulties.indexOf(targetDifficulty);
    
    for (let i = 1; i < orderedDifficulties.length; i++) {
      // 先尝试更低难度，再尝试更高难度
      const lowerIndex = targetIndex - i;
      const higherIndex = targetIndex + i;
      
      if (lowerIndex >= 0) {
        const variant = variants.find(v => v.difficultyLevel === orderedDifficulties[lowerIndex]);
        if (variant) return variant;
      }
      
      if (higherIndex < orderedDifficulties.length) {
        const variant = variants.find(v => v.difficultyLevel === orderedDifficulties[higherIndex]);
        if (variant) return variant;
      }
    }

    return variants[0] || null; // 返回第一个变体作为后备
  }

  /**
   * 生成基于历史的自定义事件
   */
  generateHistoryBasedEvents(
    character: Character,
    inventory: Inventory,
    historyManager: HistoryManager
  ): GameEvent[] {
    const customEvents: GameEvent[] = [];
    const history = historyManager.getHistory();
    const currentDay = character.daysLived || 0;

    // 基于连续行为生成特殊事件
    const streakEvents = this.generateStreakEvents(history, currentDay);
    customEvents.push(...streakEvents);

    // 基于累积成就生成里程碑事件
    const milestoneEvents = this.generateMilestoneEvents(history, character);
    customEvents.push(...milestoneEvents);

    return customEvents;
  }

  /**
   * 生成基于连续行为的事件
   */
  private generateStreakEvents(history: any, currentDay: number): GameEvent[] {
    const events: GameEvent[] = [];
    
    // 例：连续多天没有战斗的平静期事件
    const recentBattles = history.eventHistory.filter((event: any) => 
      event.eventType === 'battle' && 
      event.day >= currentDay - 7 && 
      event.day <= currentDay
    );

    if (recentBattles.length === 0 && currentDay > 7) {
      events.push({
        id: 'dynamic_peaceful_period',
        type: 'custom',
        name: '平静的时光',
        description: '长期的和平让你的心灵得到了净化，智慧和体力都有所增长。',
        conditions: [],
        outcomes: [
          { type: 'attributeChange', key: 'intelligence', value: 3 },
          { type: 'attributeChange', key: 'stamina', value: 2 },
          { type: 'custom', key: 'peaceful_mind', value: 1 }
        ],
        probability: 0.8,
        weight: 4
      });
    }

    return events;
  }

  /**
   * 生成基于里程碑的事件
   */
  private generateMilestoneEvents(history: any, character: Character): GameEvent[] {
    const events: GameEvent[] = [];
    
    // 基于总属性点数的里程碑
    const totalStats = character.stats.strength + character.stats.intelligence + 
                      character.stats.agility + character.stats.stamina;
    
    if (totalStats >= 50 && totalStats < 55) {
      events.push({
        id: 'dynamic_power_milestone_50',
        type: 'custom',
        name: '力量的里程碑',
        description: '你的综合实力达到了一个新的高度，感受到了前所未有的力量！',
        conditions: [],
        outcomes: [
          { type: 'attributeChange', key: 'strength', value: 5 },
          { type: 'attributeChange', key: 'intelligence', value: 5 },
          { type: 'attributeChange', key: 'agility', value: 5 },
          { type: 'attributeChange', key: 'stamina', value: 5 },
          { type: 'itemGain', key: '力量结晶', value: 1 }
        ],
        probability: 1.0,
        weight: 10
      });
    }

    return events;
  }

  /**
   * 统计最近的失败次数（用于动态难度调整）
   */
  private countRecentFailures(historyManager: HistoryManager, currentDay: number): number {
    const history = historyManager.getHistory();
    
    // 这里简化实现，实际中可以根据具体的失败定义来统计
    const recentNegativeEvents = history.eventHistory.filter(event => 
      event.day >= currentDay - 5 && 
      event.day <= currentDay &&
      event.eventId.startsWith('danger') // 危险事件视为失败
    );

    return recentNegativeEvents.length;
  }

  /**
   * 获取当前配置
   */
  getConfig(): DynamicConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<DynamicConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 重置生成的变体缓存
   */
  clearVariantCache(): void {
    this.generatedVariants.clear();
  }
} 