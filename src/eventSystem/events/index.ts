/**
 * 事件库主入口
 * 整合所有事件模块并导出统一的事件库
 */

import type { GameEvent } from '../eventTypes';

// 导入各类事件
import { battleEvents } from './battleEvents';
import { explorationEvents } from './explorationEvents';
import { levelUpEvents } from './levelUpEvents';
import { socialEvents } from './socialEvents';
import { recoveryEvents } from './recoveryEvents';
import { dailyLifeEvents } from './dailyLifeEvents';
import { historyEvents } from './historyEvents';
import { advancedEvents } from './advancedEvents';
import { specialEvents } from './specialEvents';
import { mysteriousMerchantChain, dragonLairChain } from './eventChains';
import { randomEvents } from './randomEvents';

// 合并所有事件
export const eventLibrary: GameEvent[] = [
  // 基础事件类型
  ...battleEvents,           // 战斗事件
  ...explorationEvents,      // 探索事件
  ...levelUpEvents,          // 升级事件
  
  // 角色相关事件
  ...socialEvents,           // 社交事件
  ...recoveryEvents,         // 恢复事件
  ...dailyLifeEvents,        // 日常生活事件
  
  // 高级事件类型
  ...historyEvents,          // 历史感知事件
  ...advancedEvents,         // 高级稀有事件
  ...specialEvents,          // 特殊事件
  
  // 事件链
  ...mysteriousMerchantChain, // 神秘商人事件链
  ...dragonLairChain,        // 龙穴探险事件链
  
  // 随机事件
  ...randomEvents,           // 随机结果事件
];

// 按类型分类导出，方便按需使用
export const eventsByType = {
  battle: battleEvents,
  exploration: explorationEvents,
  levelUp: levelUpEvents,
  social: socialEvents,
  recovery: recoveryEvents,
  dailyLife: dailyLifeEvents,
  history: historyEvents,
  advanced: advancedEvents,
  special: specialEvents,
  chains: {
    mysteriousMerchant: mysteriousMerchantChain,
    dragonLair: dragonLairChain,
  }
};

// 统计信息
export const eventStats = {
  total: eventLibrary.length,
  byType: {
    battle: battleEvents.length,
    exploration: explorationEvents.length,
    levelUp: levelUpEvents.length,
    social: socialEvents.length,
    recovery: recoveryEvents.length,
    dailyLife: dailyLifeEvents.length,
    history: historyEvents.length,
    advanced: advancedEvents.length,
    special: specialEvents.length,
    chains: mysteriousMerchantChain.length + dragonLairChain.length,
  }
};

// 工具函数：根据类型获取事件
export function getEventsByType(type: string): GameEvent[] {
  switch (type) {
    case 'battle': return battleEvents;
    case 'exploration': return explorationEvents;
    case 'levelUp': return levelUpEvents;
    case 'social': return socialEvents;
    case 'recovery': return recoveryEvents;
    case 'dailyLife': return dailyLifeEvents;
    case 'history': return historyEvents;
    case 'advanced': return advancedEvents;
    case 'special': return specialEvents;
    default: return [];
  }
}

// 工具函数：根据概率范围获取事件
export function getEventsByProbability(minProb: number, maxProb: number): GameEvent[] {
  return eventLibrary.filter(event => {
    const prob = event.probability || 1.0;
    return prob >= minProb && prob <= maxProb;
  });
}

// 工具函数：根据权重范围获取事件
export function getEventsByWeight(minWeight: number, maxWeight: number): GameEvent[] {
  return eventLibrary.filter(event => {
    const weight = event.weight || 1;
    return weight >= minWeight && weight <= maxWeight;
  });
}

// 工具函数：获取事件链起始事件
export function getChainStartEvents(): GameEvent[] {
  return eventLibrary.filter(event => event.isChainStart);
}

// 工具函数：根据链ID获取事件链中的所有事件
export function getEventsByChainId(chainId: string): GameEvent[] {
  return eventLibrary.filter(event => event.chainId === chainId);
}