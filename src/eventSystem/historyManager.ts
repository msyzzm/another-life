/**
 * 玩家历史记录管理器
 * 用于跟踪玩家的行为历史，支持历史条件检查
 */

import type { 
  PlayerHistory, 
  DailyRecord, 
  EventRecord, 
  AttributeChange, 
  ItemChange,
  EventCondition 
} from './eventTypes';
import type { Character } from '../types/character';
import type { Inventory } from '../types/inventory';

export class HistoryManager {
  private history: PlayerHistory;

  constructor(characterId: string) {
    this.history = {
      characterId,
      dailyRecords: [],
      eventHistory: [],
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  }

  /**
   * 记录新的一天开始
   */
  recordDayStart(day: number, character: Character): void {
    const dailyRecord: DailyRecord = {
      day,
      events: [],
      attributeChanges: [],
      itemsGained: [],
      itemsLost: [],
      finalStats: { ...character.stats },
      timestamp: new Date()
    };
    
    this.history.dailyRecords.push(dailyRecord);
    this.history.lastUpdated = new Date();
  }

  /**
   * 记录事件触发
   */
  recordEvent(
    eventId: string, 
    eventName: string, 
    eventType: string, 
    day: number, 
    outcomes: string[]
  ): void {
    // 添加到事件历史
    const eventRecord: EventRecord = {
      eventId,
      eventName,
      eventType: eventType as any,
      day,
      outcomes,
      timestamp: new Date()
    };
    
    this.history.eventHistory.push(eventRecord);
    
    // 添加到当日记录
    const todayRecord = this.history.dailyRecords.find(record => record.day === day);
    if (todayRecord) {
      todayRecord.events.push(eventId);
    }
    
    this.history.lastUpdated = new Date();
  }

  /**
   * 记录属性变化
   */
  recordAttributeChange(
    day: number, 
    attribute: string, 
    from: number, 
    to: number
  ): void {
    const todayRecord = this.history.dailyRecords.find(record => record.day === day);
    if (todayRecord) {
      todayRecord.attributeChanges.push({
        attribute,
        from,
        to,
        change: to - from
      });
      
      // 更新最终属性
      todayRecord.finalStats[attribute] = to;
    }
    
    this.history.lastUpdated = new Date();
  }

  /**
   * 记录物品获得
   */
  recordItemGain(day: number, itemId: string, itemName: string, quantity: number): void {
    const todayRecord = this.history.dailyRecords.find(record => record.day === day);
    if (todayRecord) {
      todayRecord.itemsGained.push({
        itemId,
        itemName,
        quantity
      });
    }
    
    this.history.lastUpdated = new Date();
  }

  /**
   * 记录物品失去
   */
  recordItemLoss(day: number, itemId: string, itemName: string, quantity: number): void {
    const todayRecord = this.history.dailyRecords.find(record => record.day === day);
    if (todayRecord) {
      todayRecord.itemsLost.push({
        itemId,
        itemName,
        quantity
      });
    }
    
    this.history.lastUpdated = new Date();
  }

  /**
   * 获取最近N天内特定事件的触发次数
   * 
   * @param {string} eventId - 事件ID
   * @param {number} days - 查询的天数范围
   * @returns {number} 触发次数
   */
  getRecentEventCount(eventId: string, days: number = 5): number {
    const currentDay = this.getCurrentDay();
    const startDay = Math.max(0, currentDay - days);
    
    let count = 0;
    for (const entry of this.history.eventHistory) {
      if (entry.day >= startDay && entry.day <= currentDay && entry.eventId === eventId) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * 获取当前天数
   */
  private getCurrentDay(): number {
    // 从最新的历史记录中获取当前天数
    if (this.history.dailyRecords.length > 0) {
      return this.history.dailyRecords[this.history.dailyRecords.length - 1].day;
    }
    return 0;
  }

  /**
   * 检查历史条件
   */
  checkHistoryCondition(condition: EventCondition, currentDay: number): boolean {
    switch (condition.type) {
      case 'history':
        return this.checkGeneralHistory(condition, currentDay);
      case 'streak':
        return this.checkStreak(condition, currentDay);
      case 'cumulative':
        return this.checkCumulative(condition, currentDay);
      case 'daysSince':
        return this.checkDaysSince(condition, currentDay);
      case 'eventCount':
        return this.checkEventCount(condition, currentDay);
      default:
        return false;
    }
  }

  /**
   * 检查一般历史条件
   */
  private checkGeneralHistory(condition: EventCondition, currentDay: number): boolean {
    const timeWindow = condition.timeWindow || 30; // 默认30天窗口
    const fromDay = Math.max(0, currentDay - timeWindow);
    
    switch (condition.historyType) {
      case 'eventTriggered':
        return this.history.eventHistory.some(event => 
          event.eventId === condition.key && 
          event.day >= fromDay && 
          event.day <= currentDay
        );
        
      case 'attributeChange':
        return this.history.dailyRecords.some(record => 
          record.day >= fromDay && 
          record.day <= currentDay &&
          record.attributeChanges.some(change => 
            change.attribute === condition.key &&
            this.compare(change.change, condition.operator, condition.value)
          )
        );
        
      case 'itemGained':
        return this.history.dailyRecords.some(record => 
          record.day >= fromDay && 
          record.day <= currentDay &&
          record.itemsGained.some(item => 
            item.itemId === condition.key &&
            this.compare(item.quantity, condition.operator, condition.value)
          )
        );
        
      default:
        return false;
    }
  }

  /**
   * 检查连续行为（streak）
   */
  private checkStreak(condition: EventCondition, currentDay: number): boolean {
    const targetDays = Number(condition.value);
    const consecutiveDays = [];
    
    // 从当前天往前检查
    for (let day = currentDay; day >= Math.max(0, currentDay - targetDays); day--) {
      const dailyRecord = this.history.dailyRecords.find(record => record.day === day);
      
      if (this.checkDayMeetsCondition(dailyRecord, condition)) {
        consecutiveDays.push(day);
      } else {
        break; // 中断连续性
      }
    }
    
    return consecutiveDays.length >= targetDays;
  }

  /**
   * 检查累积统计
   */
  private checkCumulative(condition: EventCondition, currentDay: number): boolean {
    const timeWindow = condition.timeWindow || 30;
    const fromDay = Math.max(0, currentDay - timeWindow);
    
    let totalCount = 0;
    
    switch (condition.historyType) {
      case 'eventTriggered':
        totalCount = this.history.eventHistory.filter(event => 
          event.eventId === condition.key &&
          event.day >= fromDay && 
          event.day <= currentDay
        ).length;
        break;
        
      case 'itemGained':
        totalCount = this.history.dailyRecords
          .filter(record => record.day >= fromDay && record.day <= currentDay)
          .reduce((sum, record) => 
            sum + record.itemsGained
              .filter(item => item.itemId === condition.key)
              .reduce((itemSum, item) => itemSum + item.quantity, 0), 0
          );
        break;
        
      default:
        return false;
    }
    
    return this.compare(totalCount, condition.operator, condition.value);
  }

  /**
   * 检查距离上次事件的天数
   */
  private checkDaysSince(condition: EventCondition, currentDay: number): boolean {
    const lastEvent = this.history.eventHistory
      .filter(event => event.eventId === condition.key)
      .sort((a, b) => b.day - a.day)[0]; // 最近的事件
    
    if (!lastEvent) {
      // 如果从未发生过，应该返回 false，避免历史事件在游戏开始就触发
      // 只有真正经历过相关事件后，才能谈论"距离上次事件的天数"
      return false;
    }
    
    const daysSince = currentDay - lastEvent.day;
    return this.compare(daysSince, condition.operator, condition.value);
  }

  /**
   * 检查事件发生次数
   */
  private checkEventCount(condition: EventCondition, currentDay: number): boolean {
    const timeWindow = condition.timeWindow || 999; // 默认检查所有历史
    const fromDay = Math.max(0, currentDay - timeWindow);
    
    const eventCount = this.history.eventHistory.filter(event => 
      event.eventId === condition.key &&
      event.day >= fromDay && 
      event.day <= currentDay
    ).length;
    
    return this.compare(eventCount, condition.operator, condition.value);
  }

  /**
   * 检查某一天是否满足条件
   */
  private checkDayMeetsCondition(dailyRecord: DailyRecord | undefined, condition: EventCondition): boolean {
    if (!dailyRecord) return false;
    
    switch (condition.historyType) {
      case 'eventTriggered':
        return dailyRecord.events.includes(condition.key);
        
      case 'attributeChange':
        return dailyRecord.attributeChanges.some(change => 
          change.attribute === condition.key &&
          this.compare(change.change, condition.operator, condition.value)
        );
        
      default:
        return false;
    }
  }

  /**
   * 比较操作
   */
  private compare(a: any, op: string, b: any): boolean {
    switch (op) {
      case '>': return a > b;
      case '>=': return a >= b;
      case '<': return a < b;
      case '<=': return a <= b;
      case '==': return a == b;
      case '!=': return a != b;
      default: return false;
    }
  }

  /**
   * 获取历史记录
   */
  getHistory(): PlayerHistory {
    return this.history;
  }

  /**
   * 从JSON数据加载历史记录
   */
  loadFromJSON(jsonData: any): void {
    this.history = {
      ...jsonData,
      createdAt: new Date(jsonData.createdAt),
      lastUpdated: new Date(jsonData.lastUpdated),
      dailyRecords: jsonData.dailyRecords.map((record: any) => ({
        ...record,
        timestamp: new Date(record.timestamp)
      })),
      eventHistory: jsonData.eventHistory.map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp)
      }))
    };
  }

  /**
   * 导出为JSON格式
   */
  toJSON(): any {
    return this.history;
  }
} 