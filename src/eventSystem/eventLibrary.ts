/**
 * 事件库 - 重构后的模块化版本
 * 
 * 原有的大型事件库已被拆分为多个模块化文件：
 * - battleEvents.ts - 战斗事件
 * - explorationEvents.ts - 探索事件  
 * - levelUpEvents.ts - 升级事件
 * - professionEvents.ts - 职业专属事件
 * - socialEvents.ts - 社交事件
 * - recoveryEvents.ts - 恢复事件
 * - historyEvents.ts - 历史感知事件
 * - advancedEvents.ts - 高级稀有事件
 * - specialEvents.ts - 特殊事件
 * - eventChains.ts - 事件链
 * 
 * 请使用 './events/index.ts' 作为新的导入入口
 */

// 重新导出新的模块化事件库
export { 
  eventLibrary,
  eventsByType,
  eventStats,
  getEventsByType,
  getEventsByProbability,
  getEventsByWeight,
  getChainStartEvents,
  getEventsByChainId
} from './events/index';

// 为了向后兼容，保留原有的导出方式
import { eventLibrary as newEventLibrary } from './events/index';
export const eventLibrary_legacy = newEventLibrary;

// 废弃警告
console.warn('⚠️  eventLibrary.ts 已被重构为模块化结构。请使用 "./events/index.ts" 作为新的导入入口。');

// 原有事件数据已被移除并重构为模块化结构
// 请使用新的 ./events/index.ts 入口访问事件数据
// 所有事件数据现在位于 ./events/ 目录下的各个文件中