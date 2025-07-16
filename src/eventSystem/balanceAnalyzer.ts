import type { GameEvent, EventOutcome } from './eventTypes';
import type { Character } from '../types/character';
import type { Inventory } from '../types/inventory';
import { eventLibrary } from './events/index';

/**
 * 事件平衡分析器
 * 用于分析事件系统的平衡性，包括奖励分布、难度曲线、频率等
 */
export class EventBalanceAnalyzer {
  
  /**
   * 分析事件奖励分布
   */
  analyzeRewardDistribution(): {
    attributeRewards: { [key: string]: { total: number; events: number; average: number } };
    itemRewards: { [key: string]: number };
    totalEvents: number;
    summary: string[];
  } {
    const attributeRewards: { [key: string]: { total: number; events: number; average: number } } = {};
    const itemRewards: { [key: string]: number } = {};
    let totalEvents = 0;
    
    eventLibrary.forEach(event => {
      totalEvents++;
      
      event.outcomes?.forEach(outcome => {
        if (outcome.type === 'attributeChange') {
          const attr = outcome.key;
          const value = typeof outcome.value === 'number' ? outcome.value : 0;
          
          if (!attributeRewards[attr]) {
            attributeRewards[attr] = { total: 0, events: 0, average: 0 };
          }
          
          attributeRewards[attr].total += value;
          attributeRewards[attr].events++;
        }
        
        if (outcome.type === 'itemGain') {
          const item = outcome.key;
          const quantity = typeof outcome.value === 'number' ? outcome.value : 1;
          itemRewards[item] = (itemRewards[item] || 0) + quantity;
        }
      });
    });
    
    // 计算平均值
    Object.keys(attributeRewards).forEach(attr => {
      const data = attributeRewards[attr];
      data.average = data.total / data.events;
    });
    
    const summary = [
      `📊 奖励分布分析 (${totalEvents} 个事件)`,
      `属性奖励: ${Object.keys(attributeRewards).length} 种属性`,
      `物品奖励: ${Object.keys(itemRewards).length} 种物品`,
      `最高属性奖励: ${Math.max(...Object.values(attributeRewards).map(r => r.total))}`,
      `平均每事件属性增益: ${(Object.values(attributeRewards).reduce((sum, r) => sum + r.average, 0) / Object.keys(attributeRewards).length).toFixed(2)}`
    ];
    
    return {
      attributeRewards,
      itemRewards,
      totalEvents,
      summary
    };
  }
  
  /**
   * 分析事件难度分布
   */
  analyzeDifficultyDistribution(): {
    byLevel: { [level: number]: number };
    byConditionComplexity: { simple: number; moderate: number; complex: number };
    averageConditions: number;
    summary: string[];
  } {
    const byLevel: { [level: number]: number } = {};
    let simpleEvents = 0; // 0-1 个条件
    let moderateEvents = 0; // 2-3 个条件
    let complexEvents = 0; // 4+ 个条件
    let totalConditions = 0;
    
    eventLibrary.forEach(event => {
      // 分析等级要求
      const levelCondition = event.conditions?.find(c => c.type === 'level');
      const level = levelCondition ? (typeof levelCondition.value === 'number' ? levelCondition.value : 1) : 1;
      byLevel[level] = (byLevel[level] || 0) + 1;
      
      // 分析条件复杂度
      const conditionCount = event.conditions?.length || 0;
      totalConditions += conditionCount;
      
      if (conditionCount <= 1) simpleEvents++;
      else if (conditionCount <= 3) moderateEvents++;
      else complexEvents++;
    });
    
    const averageConditions = totalConditions / eventLibrary.length;
    
    const summary = [
      `🎯 难度分布分析 (${eventLibrary.length} 个事件)`,
      `简单事件 (0-1条件): ${simpleEvents} (${(simpleEvents/eventLibrary.length*100).toFixed(1)}%)`,
      `中等事件 (2-3条件): ${moderateEvents} (${(moderateEvents/eventLibrary.length*100).toFixed(1)}%)`,
      `复杂事件 (4+条件): ${complexEvents} (${(complexEvents/eventLibrary.length*100).toFixed(1)}%)`,
      `平均条件数: ${averageConditions.toFixed(2)}`
    ];
    
    return {
      byLevel,
      byConditionComplexity: { simple: simpleEvents, moderate: moderateEvents, complex: complexEvents },
      averageConditions,
      summary
    };
  }
  
  /**
   * 分析事件权重和概率分布
   */
  analyzeProbabilityDistribution(): {
    weightDistribution: { [range: string]: number };
    probabilityDistribution: { [range: string]: number };
    averageWeight: number;
    averageProbability: number;
    summary: string[];
  } {
    const weightRanges = { 'low(1-3)': 0, 'medium(4-7)': 0, 'high(8-10)': 0, 'veryHigh(11+)': 0 };
    const probRanges = { 'rare(<0.1)': 0, 'uncommon(0.1-0.3)': 0, 'common(0.3-0.7)': 0, 'frequent(0.7+)': 0 };
    
    let totalWeight = 0;
    let totalProbability = 0;
    let weightCount = 0;
    let probCount = 0;
    
    eventLibrary.forEach(event => {
      // 分析权重
      if (event.weight !== undefined) {
        totalWeight += event.weight;
        weightCount++;
        
        if (event.weight <= 3) weightRanges['low(1-3)']++;
        else if (event.weight <= 7) weightRanges['medium(4-7)']++;
        else if (event.weight <= 10) weightRanges['high(8-10)']++;
        else weightRanges['veryHigh(11+)']++;
      }
      
      // 分析概率
      if (event.probability !== undefined) {
        totalProbability += event.probability;
        probCount++;
        
        if (event.probability < 0.1) probRanges['rare(<0.1)']++;
        else if (event.probability < 0.3) probRanges['uncommon(0.1-0.3)']++;
        else if (event.probability < 0.7) probRanges['common(0.3-0.7)']++;
        else probRanges['frequent(0.7+)']++;
      }
    });
    
    const averageWeight = weightCount > 0 ? totalWeight / weightCount : 0;
    const averageProbability = probCount > 0 ? totalProbability / probCount : 0;
    
    const summary = [
      `🎲 概率权重分析 (${eventLibrary.length} 个事件)`,
      `有权重事件: ${weightCount}, 平均权重: ${averageWeight.toFixed(2)}`,
      `有概率事件: ${probCount}, 平均概率: ${averageProbability.toFixed(3)}`,
      `高权重事件占比: ${((weightRanges['high(8-10)'] + weightRanges['veryHigh(11+)']) / weightCount * 100).toFixed(1)}%`,
      `高频率事件占比: ${(probRanges['frequent(0.7+)'] / probCount * 100).toFixed(1)}%`
    ];
    
    return {
      weightDistribution: weightRanges,
      probabilityDistribution: probRanges,
      averageWeight,
      averageProbability,
      summary
    };
  }
  
  /**
   * 模拟游戏进程以分析平衡性
   */
  simulateGameBalance(days: number = 30): {
    finalCharacter: Character;
    progressionCurve: Array<{ day: number; level: number; totalStats: number }>;
    eventHistory: Array<{ day: number; eventName: string; rewards: string[] }>;
    balanceIssues: string[];
    summary: string[];
  } {
    // 模拟角色
    const character: Character = {
      id: 'sim_character',
      name: '模拟角色',
      level: 1,
      profession: '冒险者',
      daysLived: 0,
      stats: {
        strength: 5,
        agility: 5,
        intelligence: 5,
        stamina: 5
      },
      equipment: {},
      inventory: []
    };
    
    const progressionCurve: Array<{ day: number; level: number; totalStats: number }> = [];
    const eventHistory: Array<{ day: number; eventName: string; rewards: string[] }> = [];
    const balanceIssues: string[] = [];
    
    // 记录初始状态
    progressionCurve.push({
      day: 0,
      level: character.level,
      totalStats: Object.values(character.stats).reduce((sum, val) => sum + val, 0)
    });
    
    // 模拟每一天
    for (let day = 1; day <= days; day++) {
      character.daysLived = day;
      
      // 简化的事件选择逻辑 - 选择3个符合条件的事件
      const eligibleEvents = eventLibrary.filter(event => {
        if (!event.conditions) return true;
        
        return event.conditions.every(condition => {
                     switch (condition.type) {
             case 'level':
               return EventBalanceAnalyzer.compareValues(character.level, condition.operator, condition.value);
             case 'attribute':
               const attrValue = (character.stats as any)[condition.key] || 0;
               return EventBalanceAnalyzer.compareValues(attrValue, condition.operator, condition.value);
             default:
               return true;
           }
        });
      });
      
      // 选择权重最高的3个事件
      const selectedEvents = eligibleEvents
        .sort((a, b) => (b.weight || 0) - (a.weight || 0))
        .slice(0, 3);
      
      // 应用事件效果
      selectedEvents.forEach(event => {
        const rewards: string[] = [];
        
        event.outcomes?.forEach(outcome => {
          if (outcome.type === 'attributeChange') {
            const value = typeof outcome.value === 'number' ? outcome.value : 0;
            const currentValue = (character.stats as any)[outcome.key] || 0;
            (character.stats as any)[outcome.key] = currentValue + value;
            rewards.push(`${outcome.key} +${value}`);
          }
          
          if (outcome.type === 'levelChange') {
            const value = typeof outcome.value === 'number' ? outcome.value : 1;
            character.level += value;
            rewards.push(`等级 +${value}`);
          }
        });
        
        eventHistory.push({
          day,
          eventName: event.name,
          rewards
        });
      });
      
      // 记录进度
      const totalStats = Object.values(character.stats).reduce((sum, val) => sum + val, 0);
      progressionCurve.push({
        day,
        level: character.level,
        totalStats
      });
      
      // 检查平衡问题
      if (day === 10) {
        if (character.level > 5) {
          balanceIssues.push(`第10天等级过高: ${character.level} (预期: ≤5)`);
        }
        if (totalStats > 50) {
          balanceIssues.push(`第10天属性总和过高: ${totalStats} (预期: ≤50)`);
        }
      }
      
      if (day === 20) {
        if (character.level > 8) {
          balanceIssues.push(`第20天等级过高: ${character.level} (预期: ≤8)`);
        }
        if (totalStats > 100) {
          balanceIssues.push(`第20天属性总和过高: ${totalStats} (预期: ≤100)`);
        }
      }
    }
    
    // 最终检查
    const finalStats = Object.values(character.stats).reduce((sum, val) => sum + val, 0);
    const avgGrowthPerDay = (finalStats - 20) / days; // 减去初始20点属性
    
    if (avgGrowthPerDay > 3) {
      balanceIssues.push(`属性增长过快: 平均每天 +${avgGrowthPerDay.toFixed(2)} (预期: ≤3)`);
    }
    
    if (character.level > days / 3) {
      balanceIssues.push(`升级过频繁: ${days}天升级到${character.level}级 (预期: 约每3天1级)`);
    }
    
    const summary = [
      `🎮 ${days}天模拟测试结果`,
      `最终等级: ${character.level}`,
      `最终属性总和: ${finalStats}`,
      `平均每日属性增长: ${avgGrowthPerDay.toFixed(2)}`,
      `触发事件总数: ${eventHistory.length}`,
      `发现平衡问题: ${balanceIssues.length} 个`
    ];
    
    return {
      finalCharacter: character,
      progressionCurve,
      eventHistory,
      balanceIssues,
      summary
    };
  }
  
  /**
   * 比较数值的辅助函数
   */
  private static compareValues(actual: any, operator: string, expected: any): boolean {
    const a = typeof actual === 'number' ? actual : 0;
    const e = typeof expected === 'number' ? expected : 0;
    
    switch (operator) {
      case '>': return a > e;
      case '>=': return a >= e;
      case '<': return a < e;
      case '<=': return a <= e;
      case '==': return a === e;
      case '!=': return a !== e;
      default: return true;
    }
  }
  
  /**
   * 生成完整的平衡报告
   */
  generateBalanceReport(): {
    rewardAnalysis: ReturnType<typeof this.analyzeRewardDistribution>;
    difficultyAnalysis: ReturnType<typeof this.analyzeDifficultyDistribution>;
    probabilityAnalysis: ReturnType<typeof this.analyzeProbabilityDistribution>;
    simulationResults: ReturnType<typeof this.simulateGameBalance>;
    overallAssessment: string[];
    recommendations: string[];
  } {
    const rewardAnalysis = this.analyzeRewardDistribution();
    const difficultyAnalysis = this.analyzeDifficultyDistribution();
    const probabilityAnalysis = this.analyzeProbabilityDistribution();
    const simulationResults = this.simulateGameBalance(30);
    
    const overallAssessment = [
      `📋 事件系统平衡评估报告`,
      `=====================================`,
      `事件总数: ${rewardAnalysis.totalEvents}`,
      `平衡问题数量: ${simulationResults.balanceIssues.length}`,
      `整体评级: ${simulationResults.balanceIssues.length === 0 ? '🟢 良好' : 
                 simulationResults.balanceIssues.length <= 3 ? '🟡 需要调整' : '🔴 严重失衡'}`
    ];
    
    const recommendations = [
      `🔧 平衡优化建议`,
      `=====================================`
    ];
    
    // 基于分析结果生成建议
    if (simulationResults.balanceIssues.length > 0) {
      recommendations.push(`⚠️ 发现 ${simulationResults.balanceIssues.length} 个平衡问题:`);
      simulationResults.balanceIssues.forEach(issue => {
        recommendations.push(`  • ${issue}`);
      });
      recommendations.push(``);
    }
    
    if (probabilityAnalysis.averageWeight > 6) {
      recommendations.push(`• 降低平均事件权重 (当前: ${probabilityAnalysis.averageWeight.toFixed(2)})`);
    }
    
    if (difficultyAnalysis.byConditionComplexity.simple / rewardAnalysis.totalEvents > 0.7) {
      recommendations.push(`• 增加更多有条件的复杂事件 (当前简单事件占比过高)`);
    }
    
    return {
      rewardAnalysis,
      difficultyAnalysis,
      probabilityAnalysis,
      simulationResults,
      overallAssessment,
      recommendations
    };
  }
}

// 导出单例实例
export const balanceAnalyzer = new EventBalanceAnalyzer(); 