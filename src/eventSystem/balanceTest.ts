import { eventLibrary } from './events/index';
import type { GameEvent } from './eventTypes';

/**
 * 简单的平衡测试函数
 * 分析当前事件库的平衡性
 */
export function runBalanceTest(): {
  eventCount: number;
  rewardAnalysis: { [key: string]: number };
  difficultyAnalysis: { simple: number; moderate: number; complex: number };
  balanceIssues: string[];
  recommendations: string[];
} {
  const eventCount = eventLibrary.length;
  const rewardAnalysis: { [key: string]: number } = {};
  let simpleEvents = 0;
  let moderateEvents = 0;
  let complexEvents = 0;
  const balanceIssues: string[] = [];
  const recommendations: string[] = [];
  
  // 分析奖励分布
  eventLibrary.forEach(event => {
    // 计算条件复杂度
    const conditionCount = event.conditions?.length || 0;
    if (conditionCount <= 1) simpleEvents++;
    else if (conditionCount <= 3) moderateEvents++;
    else complexEvents++;
    
    // 分析奖励
    event.outcomes?.forEach(outcome => {
      if (outcome.type === 'attributeChange') {
        const attr = outcome.key;
        const value = typeof outcome.value === 'number' ? outcome.value : 0;
        rewardAnalysis[attr] = (rewardAnalysis[attr] || 0) + value;
      }
    });
  });
  
  // 检查平衡问题
  const totalAttributeReward = Object.values(rewardAnalysis).reduce((sum, val) => sum + val, 0);
  const averageRewardPerEvent = totalAttributeReward / eventCount;
  
  if (averageRewardPerEvent > 2.5) {
    balanceIssues.push(`平均每事件奖励过高: ${averageRewardPerEvent.toFixed(2)} (建议: ≤2.5)`);
    recommendations.push('降低部分事件的属性奖励值');
  }
  
  if (simpleEvents / eventCount > 0.7) {
    balanceIssues.push(`简单事件占比过高: ${(simpleEvents/eventCount*100).toFixed(1)}% (建议: ≤70%)`);
    recommendations.push('增加更多有条件要求的事件');
  }
  
  if (rewardAnalysis.strength && rewardAnalysis.strength > totalAttributeReward * 0.5) {
    balanceIssues.push('力量奖励占比过高，可能导致力量属性增长过快');
    recommendations.push('平衡各属性的奖励分布');
  }
  
  return {
    eventCount,
    rewardAnalysis,
    difficultyAnalysis: { simple: simpleEvents, moderate: moderateEvents, complex: complexEvents },
    balanceIssues,
    recommendations
  };
}

/**
 * 格式化输出平衡测试报告
 */
export function printBalanceReport(): void {
  const result = runBalanceTest();
  
  console.log('\n🎯 事件系统平衡测试报告');
  console.log('=====================================');
  console.log(`📊 事件总数: ${result.eventCount}`);
  console.log('\n📈 奖励分布:');
  Object.entries(result.rewardAnalysis).forEach(([attr, total]) => {
    console.log(`  ${attr}: ${total} (平均每事件: ${(total/result.eventCount).toFixed(2)})`);
  });
  
  console.log('\n🎯 难度分布:');
  console.log(`  简单事件: ${result.difficultyAnalysis.simple} (${(result.difficultyAnalysis.simple/result.eventCount*100).toFixed(1)}%)`);
  console.log(`  中等事件: ${result.difficultyAnalysis.moderate} (${(result.difficultyAnalysis.moderate/result.eventCount*100).toFixed(1)}%)`);
  console.log(`  复杂事件: ${result.difficultyAnalysis.complex} (${(result.difficultyAnalysis.complex/result.eventCount*100).toFixed(1)}%)`);
  
  if (result.balanceIssues.length > 0) {
    console.log('\n⚠️ 发现的平衡问题:');
    result.balanceIssues.forEach(issue => console.log(`  • ${issue}`));
  }
  
  if (result.recommendations.length > 0) {
    console.log('\n🔧 优化建议:');
    result.recommendations.forEach(rec => console.log(`  • ${rec}`));
  }
  
  const overallRating = result.balanceIssues.length === 0 ? '🟢 良好' : 
                       result.balanceIssues.length <= 2 ? '🟡 需要调整' : '🔴 需要重新平衡';
  console.log(`\n📋 整体评级: ${overallRating}`);
} 