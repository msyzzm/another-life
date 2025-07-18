import type { 
  ActiveEventChain, 
  EventChainContext, 
  ChainNextEvent, 
  GameEvent,
  EventCondition,
  EventOutcome
} from './eventTypes';
import type { Character } from '../types/character';

/**
 * 事件链管理器
 * 
 * 事件链是Another Life游戏中的高级功能，允许创建多步骤的连续事件序列。
 * 事件链支持以下特性：
 * 
 * 1. **上下文传递** - 在事件之间传递状态和数据
 * 2. **条件分支** - 根据玩家选择或状态决定后续事件
 * 3. **延迟触发** - 支持在未来的某一天触发后续事件
 * 4. **状态管理** - 跟踪链的进度和完成状态
 * 5. **错误恢复** - 处理链执行过程中的异常情况
 * 
 * 典型的事件链流程：
 * 启动事件 → 上下文设置 → 条件检查 → 后续事件调度 → 链完成
 * 
 * 示例用途：
 * - 多步骤任务（如神秘商人交易）
 * - 探险序列（如龙穴探险）
 * - 角色发展剧情
 * - 复杂的选择后果系统
 */
export class EventChainManager {
  // 存储所有活跃的事件链，使用chainId作为键
  private activeChains: Map<string, ActiveEventChain> = new Map();
  
  /**
   * 启动新的事件链
   * 
   * 这是事件链系统的入口点，当一个标记为isChainStart的事件被触发时调用。
   * 
   * 功能：
   * 1. 创建事件链上下文，保存初始状态
   * 2. 建立活跃链记录，用于后续跟踪
   * 3. 调度下一步事件（如果有的话）
   * 4. 处理初始上下文数据
   * 
   * @param {string} chainId - 事件链的唯一标识符
   * @param {GameEvent} startEvent - 启动事件对象
   * @param {Character} character - 当前角色状态（用于创建快照）
   * @param {number} currentDay - 当前游戏天数
   * @param {Object} initialContext - 初始上下文数据（可选）
   * @returns {EventChainContext} 创建的事件链上下文
   */
  startChain(
    chainId: string, 
    startEvent: GameEvent, 
    character: Character, 
    currentDay: number,
    initialContext: { [key: string]: any } = {}
  ): EventChainContext {
    // 创建事件链上下文 - 这是事件链的"记忆"
    const chainContext: EventChainContext = {
      chainId,                                          // 链的唯一标识
      step: 0,
      data: { ...initialContext },                      // 上下文数据（可在事件间传递）
      character: this.createCharacterSnapshot(character), // 角色状态快照
      timestamp: new Date(),                            // 创建时间戳
      previousEventId: startEvent.id                    // 上一个事件的ID
    };
    
    // 创建活跃链记录 - 用于管理链的生命周期
    const activeChain: ActiveEventChain = {
      chainId,                                          // 链标识
      currentStep: chainContext.step,                   // 当前步骤
      context: chainContext,                            // 链上下文
      nextScheduledEvents: [],                          // 待调度的后续事件
      startDay: currentDay,                             // 链开始的天数
      isComplete: false                                 // 链是否已完成
    };
    
    // 处理下一步事件的调度
    // 如果启动事件定义了后续事件，则安排它们在适当的时间触发
    if (startEvent.nextEvents && startEvent.nextEvents.length > 0) {
      this.scheduleNextEvents(activeChain, startEvent.nextEvents, currentDay);
    }
    
    this.activeChains.set(chainId, activeChain);
    
    console.log(`🔗 启动事件链: ${chainId}, 起始事件: ${startEvent.name}`);
    return chainContext;
  }
  
  /**
   * 更新事件链上下文
   */
  updateChainContext(chainId: string, updates: { [key: string]: any }): boolean {
    const chain = this.activeChains.get(chainId);
    if (!chain) {
      console.warn(`事件链 ${chainId} 不存在，无法更新上下文`);
      return false;
    }
    
    // 深度合并上下文数据
    chain.context.data = { ...chain.context.data, ...updates };
    chain.context.timestamp = new Date();
    
    console.log(`🔗 更新事件链上下文: ${chainId}`, updates);
    return true;
  }
  
  /**
   * 推进事件链到下一步
   * 
   * 当事件链中的一个事件被触发时调用此方法来推进链的进度。
   * 
   * 功能：
   * 1. 更新链的当前步骤
   * 2. 更新上下文中的角色状态
   * 3. 调度后续事件（如果有的话）
   * 4. 检查链是否完成
   * 5. 处理链的结束逻辑
   * 
   * @param {string} chainId - 要推进的事件链ID
   * @param {GameEvent} currentEvent - 当前触发的事件
   * @param {Character} character - 更新后的角色状态
   * @param {number} currentDay - 当前游戏天数
   */
  advanceChain(
    chainId: string, 
    currentEvent: GameEvent, 
    character: Character, 
    currentDay: number
  ): void {
    const chain = this.activeChains.get(chainId);
    if (!chain) {
      console.warn(`事件链 ${chainId} 不存在，无法推进`);
      return;
    }
    
    // 更新链状态
    chain.currentStep = chain.currentStep + 1;
    chain.context.step = chain.currentStep;
    chain.context.previousEventId = currentEvent.id;
    chain.context.character = this.createCharacterSnapshot(character);
    chain.context.timestamp = new Date();
    
    // 检查是否为链的结束事件
    if (currentEvent.isChainEnd) {
      this.completeChain(chainId);
      return;
    }
    
    // 调度下一步事件
    if (currentEvent.nextEvents && currentEvent.nextEvents.length > 0) {
      this.scheduleNextEvents(chain, currentEvent.nextEvents, currentDay);
    }
    
    console.log(`🔗 推进事件链: ${chainId} 到步骤 ${chain.currentStep}`);
  }
  
  /**
   * 获取指定日期应该触发的链事件
   */
  getScheduledEvents(targetDay: number): Array<{
    chainId: string;
    eventId: string;
    context: EventChainContext;
    contextUpdate?: { [key: string]: any };
  }> {
    const scheduledEvents: Array<{
      chainId: string;
      eventId: string;
      context: EventChainContext;
      contextUpdate?: { [key: string]: any };
    }> = [];
    
    for (const [chainId, chain] of this.activeChains.entries()) {
      if (chain.isComplete) continue;
      
      const eventsForToday = chain.nextScheduledEvents.filter(
        event => event.scheduledDay === targetDay
      );
      
      for (const scheduledEvent of eventsForToday) {
        scheduledEvents.push({
          chainId,
          eventId: scheduledEvent.eventId,
          context: chain.context,
          contextUpdate: scheduledEvent.contextUpdate
        });
      }
      
      // 移除已处理的事件
      chain.nextScheduledEvents = chain.nextScheduledEvents.filter(
        event => event.scheduledDay !== targetDay
      );
    }
    
    return scheduledEvents;
  }
  
  /**
   * 检查链上下文条件
   * 
   * 这是事件链条件系统的核心方法，用于检查基于链上下文的条件。
   * 链上下文条件允许事件根据链的当前状态来决定是否触发。
   * 
   * 支持的条件类型：
   * - 等值比较：检查上下文值是否等于特定值
   * - 数值比较：支持 >, >=, <, <= 等数值比较
   * - 存在性检查：检查某个上下文键是否存在
   * - 类型检查：验证上下文值的数据类型
   * 
   * 使用场景：
   * - 玩家选择分支：根据之前的选择决定后续事件
   * - 进度检查：根据任务进度触发不同事件
   * - 状态验证：确保链处于正确的状态
   * 
   * @param {EventCondition} condition - 要检查的条件对象
   * @param {string} chainId - 事件链的ID
   * @returns {boolean} 条件是否满足
   */
  checkChainContextCondition(condition: EventCondition, chainId: string): boolean {
    const chain = this.activeChains.get(chainId);
    if (!chain) return false;
    
    const { contextPath, key, operator, value } = condition;
    const context = chain.context.data;
    
    // 获取上下文中的值
    let contextValue: any;
    if (contextPath) {
      contextValue = this.getNestedValue(context, contextPath);
    } else {
      contextValue = context[key];
    }
    
    // 执行比较
    return this.compareValues(contextValue, operator, value);
  }
  
  /**
   * 应用链上下文结果
   * 
   * 当事件的结果包含chainContext类型的outcome时，此方法负责将
   * 这些变化应用到对应事件链的上下文中。
   * 
   * 支持的上下文操作：
   * - set: 设置或覆盖上下文值
   * - add: 数值累加（用于计数器、分数等）
   * - remove: 移除上下文键
   * - append: 向数组添加元素
   * - toggle: 布尔值切换
   * 
   * 操作示例：
   * ```typescript
   * // 设置玩家选择
   * { type: 'chainContext', key: 'playerChoice', value: 'accept', contextOperation: 'set' }
   * 
   * // 增加任务进度
   * { type: 'chainContext', key: 'questProgress', value: 1, contextOperation: 'add' }
   * 
   * // 移除临时标记
   * { type: 'chainContext', key: 'tempFlag', contextOperation: 'remove' }
   * ```
   * 
   * @param {EventOutcome} outcome - 要应用的结果对象
   * @param {string} chainId - 目标事件链的ID
   * @returns {boolean} 操作是否成功
   */
  applyChainContextOutcome(outcome: EventOutcome, chainId: string): boolean {
    const chain = this.activeChains.get(chainId);
    if (!chain) return false;
    
    const { contextOperation = 'set', contextPath, key, value } = outcome;
    
    try {
      if (contextPath) {
        this.setNestedValue(chain.context.data, contextPath, value, contextOperation);
      } else {
        this.applyContextOperation(chain.context.data, key, value, contextOperation);
      }
      
      chain.context.timestamp = new Date();
      console.log(`🔗 应用链上下文操作: ${chainId}.${contextPath || key} ${contextOperation} ${value}`);
      return true;
    } catch (error: any) {
      console.error(`链上下文操作失败: ${error.message}`);
      return false;
    }
  }
  
  /**
   * 获取活跃链的信息
   */
  getActiveChains(): Array<{ chainId: string; step: number; startDay: number }> {
    return Array.from(this.activeChains.values())
      .filter(chain => !chain.isComplete)
      .map(chain => ({
        chainId: chain.chainId,
        step: chain.currentStep,
        startDay: chain.startDay
      }));
  }
  
  /**
   * 清理已完成的事件链
   * 
   * 定期清理已完成的事件链，释放内存并保持系统性能。
   * 这个方法应该定期调用，建议在每天结束时或每隔几天调用一次。
   * 
   * 清理条件：
   * 1. 链标记为完成（isComplete = true）
   * 2. 没有待调度的后续事件
   * 3. 链已经运行了足够长的时间
   * 
   * 功能：
   * - 识别可以清理的链
   * - 从activeChains Map中移除
   * - 释放相关的内存资源
   * - 返回清理的链数量
   * 
   * @returns {number} 被清理的事件链数量
   */
  cleanupCompletedChains(): number {
    const initialSize = this.activeChains.size;
    
    for (const [chainId, chain] of this.activeChains.entries()) {
      if (chain.isComplete && chain.nextScheduledEvents.length === 0) {
        this.activeChains.delete(chainId);
        console.log(`🔗 清理已完成的事件链: ${chainId}`);
      }
    }
    
    return initialSize - this.activeChains.size;
  }
  
  // === 私有辅助方法 ===
  
  private scheduleNextEvents(
    chain: ActiveEventChain, 
    nextEvents: ChainNextEvent[], 
    currentDay: number
  ): void {
    for (const nextEvent of nextEvents) {
      const scheduledDay = currentDay + (nextEvent.delay || 0);
      
      chain.nextScheduledEvents.push({
        eventId: nextEvent.eventId,
        scheduledDay,
        contextUpdate: nextEvent.contextUpdate
      });
      
      console.log(`🔗 调度链事件: ${nextEvent.eventId} 在第 ${scheduledDay} 天`);
    }
  }
  
  private completeChain(chainId: string): void {
    const chain = this.activeChains.get(chainId);
    if (chain) {
      chain.isComplete = true;
      console.log(`🔗 完成事件链: ${chainId}`);
    }
  }
  
  private createCharacterSnapshot(character: Character): Partial<Character> {
    return {
      id: character.id,
      name: character.name,
      level: character.level,
      daysLived: character.daysLived,
      stats: { ...character.stats }
    };
  }
  
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  private setNestedValue(obj: any, path: string, value: any, operation: string): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    this.applyContextOperation(target, lastKey, value, operation);
  }
  
  private applyContextOperation(target: any, key: string, value: any, operation: string): void {
    switch (operation) {
      case 'set':
        target[key] = value;
        break;
      case 'add':
        target[key] = (target[key] || 0) + Number(value);
        break;
      case 'remove':
        delete target[key];
        break;
      case 'append':
        if (!Array.isArray(target[key])) {
          target[key] = [];
        }
        target[key].push(value);
        break;
      default:
        target[key] = value;
    }
  }
  
  private compareValues(a: any, operator: string, b: any): boolean {
    switch (operator) {
      case '>': return a > b;
      case '>=': return a >= b;
      case '<': return a < b;
      case '<=': return a <= b;
      case '==': return a == b;
      case '!=': return a != b;
      default: return false;
    }
  }
}

// 导出单例实例
export const eventChainManager = new EventChainManager(); 