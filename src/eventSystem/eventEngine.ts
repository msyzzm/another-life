import type { GameEvent, EventCondition, EventOutcome } from './eventTypes';
import type { Character } from '../types/character';
import type { Inventory } from '../types/inventory';
import { processBatchOutcomes, validateOutcomePrerequisites } from './outcomeProcessor';
import { HistoryManager } from './historyManager';
import { eventChainManager } from './eventChainManager';
import { eventLibrary } from './events/index';
import { 
  withErrorHandling, 
  defaultErrorHandler, 
  ErrorType, 
  ErrorSeverity,
  createProcessingError 
} from './errorHandler';

// 深拷贝工具函数
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const clonedObj = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

/**
 * 检查单个条件是否满足
 * 
 * 这是条件系统的核心实现，支持多种类型的条件检查。
 * 每种条件类型都有其特定的检查逻辑和用途。
 * 
 * @param {Character} character - 角色数据
 * @param {Inventory} inventory - 背包数据
 * @param {EventCondition} condition - 要检查的条件对象
 * @param {HistoryManager} historyManager - 历史记录管理器（历史条件需要）
 * @param {string} chainId - 事件链ID（链上下文条件需要）
 * @returns {boolean} 条件是否满足
 */
export function checkCondition(
  character: Character, 
  inventory: Inventory, 
  condition: EventCondition,
  historyManager?: HistoryManager,
  chainId?: string
): boolean {
  switch (condition.type) {
    case 'attribute': {
      // 属性条件检查 - 检查角色的基础属性（力量、敏捷、智力、体力）
      // 例如：{ type: 'attribute', key: 'strength', operator: '>=', value: 5 }
      const value = (character.stats as any)[condition.key];
      return compare(value, condition.operator, condition.value);
    }
    
    case 'item': {
      // 物品拥有条件检查 - 检查背包中是否拥有特定物品
      // 例如：{ type: 'item', key: 'sword_001', operator: '==' }
      const hasItem = inventory.items.some(item => item.id === condition.key);
      return condition.operator === '==' ? hasItem : !hasItem;
    }
    
    case 'level': {
      // 等级条件检查 - 检查角色等级是否满足要求
      // 例如：{ type: 'level', operator: '>=', value: 3 }
      return compare(character.level, condition.operator, condition.value);
    }
    
    case 'itemCount': {
      // 物品数量条件检查 - 检查特定物品的数量
      // 例如：{ type: 'itemCount', key: 'potion_health', operator: '>=', value: 2 }
      const count = inventory.items.filter(item => item.id === condition.key)
        .reduce((sum, item) => sum + item.quantity, 0);
      return compare(count, condition.operator, condition.value);
    }
    
    case 'chainContext': {
      // 事件链上下文条件检查 - 检查当前事件链的上下文状态
      // 用于事件链中的条件分支和状态传递
      if (!chainId) {
        // 如果没有提供 chainId，则链上下文条件永远不满足
        return false;
      }
      return eventChainManager.checkChainContextCondition(condition, chainId);
    }
    
    // 历史相关条件 - 这些条件都需要历史记录管理器
    case 'history':      // 历史事件条件 - 检查是否发生过特定事件
    case 'streak':       // 连续条件 - 检查连续发生某类事件的次数
    case 'cumulative':   // 累积条件 - 检查累积统计数据
    case 'daysSince':    // 时间间隔条件 - 检查距离某事件的天数
    case 'eventCount':   // 事件计数条件 - 检查某类事件的总发生次数
      {
        if (!historyManager) {
          console.warn(`历史条件检查需要 HistoryManager，但未提供。条件类型: ${condition.type}`);
          return false;
        }
        return historyManager.checkHistoryCondition(condition, character.daysLived || 0);
      }
    
    case 'custom':
      // 自定义条件 - 预留的扩展接口
      // 目前返回false，可在未来版本中实现自定义逻辑
      return false;
      
    default:
      // 未知条件类型 - 安全策略，返回false
      console.warn(`未知的条件类型: ${condition.type}`);
      return false;
  }
}

function compare(a: any, op: string, b: any): boolean {
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
 * 检查事件是否可以触发
 * 
 * 这是事件系统的核心判断函数，决定一个事件是否满足触发条件。
 * 支持复杂的条件组合和多种条件类型。
 * 
 * 支持的条件类型：
 * - attribute: 角色属性条件（如力量 >= 5）
 * - item: 物品拥有条件
 * - level: 等级条件
 * - itemCount: 物品数量条件
 * - history: 历史事件条件
 * - streak: 连续事件条件
 * - chainContext: 事件链上下文条件
 * 
 * 逻辑操作符：
 * - AND: 所有条件都必须满足（默认）
 * - OR: 任意一个条件满足即可
 * 
 * @param {GameEvent} event - 要检查的事件对象
 * @param {Character} character - 当前角色状态
 * @param {Inventory} inventory - 当前背包状态
 * @param {HistoryManager} historyManager - 历史记录管理器（可选）
 * @param {string} chainId - 事件链ID（可选）
 * @returns {boolean} 是否可以触发该事件
 */
export function canTriggerEvent(
  event: GameEvent, 
  character: Character, 
  inventory: Inventory,
  historyManager?: HistoryManager,
  chainId?: string
): boolean {
  // 如果事件没有条件限制，则总是可以触发
  if (!event.conditions || event.conditions.length === 0) {
    return true;
  }

  // 获取逻辑操作符，默认为 AND（所有条件都必须满足）
  const logic = event.conditionLogic || 'AND';
  
  if (logic === 'AND') {
    // AND逻辑：所有条件都必须满足
    return event.conditions.every(cond => 
      checkCondition(character, inventory, cond, historyManager, chainId)
    );
  } else if (logic === 'OR') {
    // OR逻辑：任意一个条件满足即可
    return event.conditions.some(cond => 
      checkCondition(character, inventory, cond, historyManager, chainId)
    );
  }
  
  // 未知的逻辑操作符，默认返回false（安全策略）
  return false;
}

/**
 * 计算事件的动态权重
 * 
 * 动态权重考虑多个因素：
 * 1. 基础权重 - 事件本身的重要性
 * 2. 历史因素 - 最近触发过的事件权重降低
 * 3. 角色状态 - 根据角色属性调整权重
 * 4. 稀有度因素 - 低概率事件权重提升
 * 5. 等级适配 - 事件等级要求与角色等级的匹配度
 * 
 * @param {GameEvent} event - 事件对象
 * @param {Character} character - 角色状态
 * @param {Inventory} inventory - 背包状态
 * @param {HistoryManager} historyManager - 历史管理器（可选）
 * @returns {number} 动态计算的权重值
 */
export function calculateEventWeight(
  event: GameEvent, 
  character: Character, 
  inventory: Inventory,
  historyManager?: HistoryManager
): number {
  let baseWeight = event.weight || 1;
  let dynamicWeight = baseWeight;
  
  // 1. 历史因素：最近触发过的事件降低权重，增加多样性
  if (historyManager) {
    const recentTriggers = historyManager.getRecentEventCount(event.id, 5); // 最近5天
    if (recentTriggers > 0) {
      // 每次触发权重减少30%，最多减少到原来的10%
      dynamicWeight *= Math.pow(0.7, recentTriggers);
      dynamicWeight = Math.max(dynamicWeight, baseWeight * 0.1);
    }
  }
  
  // 2. 角色状态因素：根据属性和事件类型调整权重
  if (event.type === 'battle') {
    // 战斗事件：力量高时权重增加，但不要过度偏向
    const strengthBonus = Math.min((character.stats.strength - 5) * 0.05, 0.3);
    dynamicWeight *= (1 + Math.max(0, strengthBonus));
  } else if (event.type === 'findItem') {
    // 探索事件：智力高时权重增加
    const intelligenceBonus = Math.min((character.stats.intelligence - 5) * 0.05, 0.3);
    dynamicWeight *= (1 + Math.max(0, intelligenceBonus));
  } else if (event.type === 'levelUp') {
    // 升级事件：接近升级时权重大幅提升
    const levelProgress = character.level * 0.1; // 简化的升级进度
    dynamicWeight *= (1 + levelProgress);
  }
  
  // 3. 稀有度因素：低概率事件在满足条件时权重适度提升
  if (event.probability && event.probability < 0.5) {
    const rarityBonus = (1 - event.probability) * 0.5; // 越稀有提升越多
    dynamicWeight *= (1 + rarityBonus);
  }
  
  // 4. 等级适配：事件等级要求与角色等级的匹配度
  const levelRequirementRaw = event.conditions?.find(c => c.type === 'level')?.value;
  const levelRequirement = typeof levelRequirementRaw === 'number' && !isNaN(levelRequirementRaw) ? levelRequirementRaw : 1;
  const levelDiff = character.level - levelRequirement;
  if (levelDiff >= 0 && levelDiff <= 2) {
    // 等级刚好匹配的事件权重提升
    dynamicWeight *= 1.2;
  } else if (levelDiff > 2) {
    // 过低等级的事件权重降低，避免重复简单事件
    dynamicWeight *= Math.max(0.5, 1 - (levelDiff - 2) * 0.1);
  }
  
  return Math.max(0.1, dynamicWeight); // 确保权重不会太低，保持最小可能性
}

// 应用事件结果（使用新的结果处理模块）- 添加错误处理和链上下文支持
export const applyEventOutcome = withErrorHandling(
  function applyEventOutcomeImpl(
    event: GameEvent, 
    character: Character, 
    inventory: Inventory,
    chainId?: string
  ): {
    character: Character;
    inventory: Inventory;
    logs: string[];
  } {
    // 分离链上下文结果和普通结果
    const chainContextOutcomes = event.outcomes.filter(outcome => outcome.type === 'chainContext');
    const regularOutcomes = event.outcomes.filter(outcome => outcome.type !== 'chainContext');
    
    // 处理普通结果
    const result = processBatchOutcomes(character, inventory, regularOutcomes);
    
    // 处理链上下文结果
    if (chainContextOutcomes.length > 0 && chainId) {
      for (const outcome of chainContextOutcomes) {
        const success = eventChainManager.applyChainContextOutcome(outcome, chainId);
        if (!success) {
          console.warn(`链上下文结果应用失败: ${outcome.key}`);
        }
      }
    }
    
    // 检查是否有错误
    if (result.errors && result.errors.length > 0) {
      const error = createProcessingError(
        `Event outcome processing had errors: ${result.errors.join('; ')}`,
        { event, character, inventory }
      );
      defaultErrorHandler.handleError(error);
      
      // 即使有错误，也返回部分成功的结果
      console.warn('事件结果处理存在部分错误，但继续执行:', result.errors);
    }
    
    return {
      character: result.character,
      inventory: result.inventory,
      logs: result.logs
    };
  },
  ErrorType.OUTCOME_PROCESSING_ERROR,
  ErrorSeverity.HIGH
);

// 验证事件结果的先决条件
export function validateEventOutcomes(event: GameEvent, character: Character, inventory: Inventory): {
  valid: boolean;
  invalidOutcomes: Array<{ outcome: EventOutcome; reason: string }>;
} {
  const invalidOutcomes: Array<{ outcome: EventOutcome; reason: string }> = [];
  
  for (const outcome of event.outcomes) {
    const validation = validateOutcomePrerequisites(character, inventory, outcome);
    if (!validation.valid) {
      invalidOutcomes.push({
        outcome,
        reason: validation.reason || 'Unknown validation error'
      });
    }
  }
  
  return {
    valid: invalidOutcomes.length === 0,
    invalidOutcomes
  };
}

/**
 * 尝试触发单个事件
 * 
 * 这是事件触发的核心函数，负责完整的事件触发流程：
 * 1. 条件检查 - 验证事件是否可以触发
 * 2. 先决条件验证 - 确保事件结果可以正确应用
 * 3. 概率计算 - 根据事件概率决定是否触发
 * 4. 事件链处理 - 处理事件链的启动和推进
 * 5. 结果应用 - 将事件效果应用到角色和背包
 * 6. 错误处理 - 处理各种可能的错误情况
 * 
 * @param {GameEvent} event - 要触发的事件对象
 * @param {Character} character - 当前角色状态
 * @param {Inventory} inventory - 当前背包状态
 * @param {HistoryManager} historyManager - 历史记录管理器（可选）
 * @param {string} chainId - 当前事件链ID（可选）
 * @param {number} currentDay - 当前天数（可选）
 * @returns {Object} 触发结果对象
 */
export const tryTriggerEvent = withErrorHandling(
  function tryTriggerEventImpl(
    event: GameEvent, 
    character: Character, 
    inventory: Inventory,
    historyManager?: HistoryManager,
    chainId?: string,
    currentDay?: number
  ): {
    triggered: boolean;
    result?: { character: Character; inventory: Inventory; logs: string[] };
    error?: string;
    chainContext?: any;
  } {
    try {
      // 步骤1：检查事件是否可触发（包括所有条件和链上下文条件）
      if (!canTriggerEvent(event, character, inventory, historyManager, chainId)) {
        console.log(`❌ 事件 ${event.id} 条件不满足，无法触发`);
        return { triggered: false };
      }
      
      // 步骤2：验证事件结果的先决条件
      // 确保事件的所有结果都可以正确应用（如背包空间足够等）
      const validation = validateEventOutcomes(event, character, inventory);
      if (!validation.valid) {
        const errorMessages = validation.invalidOutcomes.map(invalid => invalid.reason).join('; ');
        
        // 记录验证错误到错误处理系统
        const validationError = defaultErrorHandler.createError(
          ErrorType.VALIDATION_ERROR,
          ErrorSeverity.MEDIUM,
          `Event outcome validation failed: ${errorMessages}`,
          undefined,
          { event, character, inventory }
        );
        
        return { 
          triggered: false, 
          error: `Event outcome validation failed: ${errorMessages}` 
        };
      }
      
      // 步骤3：处理事件链逻辑
      // 事件链允许创建连续性的多步骤事件序列
      let currentChainId = chainId;
      let chainContext: any = undefined;
      
      if (event.isChainStart && event.chainId) {
        // 启动新的事件链 - 这是事件链的第一个事件
        chainContext = eventChainManager.startChain(
          event.chainId, 
          event, 
          character, 
          currentDay || character.daysLived || 0
        );
        currentChainId = event.chainId;
      } else if (event.chainId && currentChainId === event.chainId) {
        // 推进现有事件链 - 这是事件链中的后续事件
        eventChainManager.advanceChain(
          event.chainId, 
          event, 
          character, 
          currentDay || character.daysLived || 0
        );
      }
      
      // 步骤4：应用事件结果到角色和背包
      // 这包括属性变化、物品获得/失去、装备变化等
      let result = applyEventOutcome(event, character, inventory, currentChainId);
      
      // 步骤5：处理立即触发的链事件 (delay: 0)
      // 如果是事件链起始事件且有 delay: 0 的后续事件，立即处理
      if (event.isChainStart && currentChainId && currentDay && event.nextEvents && historyManager) {
        result = processImmediateChainEvents(
          event, 
          result, 
          historyManager, 
          currentChainId, 
          currentDay
        );
      }
      
      // 返回成功触发的结果
      return { 
        triggered: true, 
        result, 
        chainContext 
      };
      
    } catch (error: any) {
      // 创建详细的错误信息
      const processingError = defaultErrorHandler.createError(
        ErrorType.EVENT_PROCESSING_ERROR,
        ErrorSeverity.HIGH,
        `Failed to trigger event ${event.id}: ${error.message}`,
        error.stack,
        { event, character, inventory }
      );
      
      // 尝试错误恢复
      defaultErrorHandler.handleError(processingError);
      
      return { 
        triggered: false, 
        error: `Error applying event outcome: ${error.message}` 
      };
    }
  },
  ErrorType.EVENT_PROCESSING_ERROR,
  ErrorSeverity.HIGH
);

/**
 * 处理立即触发的链事件 (delay: 0)
 * 
 * 使用迭代方式而非递归，避免栈溢出和提高性能。
 * 支持多层级的 delay: 0 事件链，同时防止无限循环。
 * 
 * @param {GameEvent} startEvent - 起始事件
 * @param {Object} result - 当前的角色和背包状态
 * @param {HistoryManager} historyManager - 历史管理器
 * @param {string} chainId - 事件链ID
 * @param {number} currentDay - 当前天数
 * @returns {Object} 更新后的角色和背包状态
 */
function processImmediateChainEvents(
  startEvent: GameEvent,
  result: { character: Character; inventory: Inventory; logs: string[] },
  historyManager: HistoryManager,
  chainId: string,
  currentDay: number
): { character: Character; inventory: Inventory; logs: string[] } {
  const maxDepth = 10; // 防止无限循环的最大深度
  const processedEvents = new Set<string>(); // 防止重复处理同一事件
  let currentResult = result;
  let eventsToProcess = startEvent.nextEvents?.filter(nextEvent => (nextEvent.delay || 0) === 0) || [];
  let depth = 0;

  while (eventsToProcess.length > 0 && depth < maxDepth) {
    const currentBatch = [...eventsToProcess];
    eventsToProcess = [];
    depth++;

    console.log(`🔗 处理第${depth}层立即触发事件，共${currentBatch.length}个事件`);

    for (const immediateEvent of currentBatch) {
      // 防止重复处理同一事件
      if (processedEvents.has(immediateEvent.eventId)) {
        console.warn(`🔗 跳过重复事件: ${immediateEvent.eventId}`);
        continue;
      }
      processedEvents.add(immediateEvent.eventId);

      const nextEvent = eventLibrary.find(e => e.id === immediateEvent.eventId);
      if (!nextEvent) {
        console.warn(`🔗 立即触发的链事件未找到: ${immediateEvent.eventId}`);
        continue;
      }

      console.log(`🔗 立即触发链事件: ${nextEvent.name} (${nextEvent.id}) [深度${depth}]`);

      try {
        // 应用可能的上下文更新
        if (immediateEvent.contextUpdate && chainId) {
          eventChainManager.updateChainContext(chainId, immediateEvent.contextUpdate);
        }

        // 检查事件是否可以触发
        if (!canTriggerEvent(nextEvent, currentResult.character, currentResult.inventory, historyManager, chainId)) {
          console.log(`🔗 立即触发事件条件不满足: ${nextEvent.name}`);
          continue;
        }

        // 验证事件结果的先决条件
        const validation = validateEventOutcomes(nextEvent, currentResult.character, currentResult.inventory);
        if (!validation.valid) {
          console.warn(`🔗 立即触发事件验证失败: ${nextEvent.name}`);
          continue;
        }

        // 推进事件链
        if (nextEvent.chainId && chainId === nextEvent.chainId) {
          eventChainManager.advanceChain(
            nextEvent.chainId,
            nextEvent,
            currentResult.character,
            currentDay
          );
        }

        // 应用事件结果
        const eventResult = applyEventOutcome(nextEvent, currentResult.character, currentResult.inventory, chainId);
        
        // 合并日志，避免丢失之前事件的日志
        currentResult = {
          character: eventResult.character,
          inventory: eventResult.inventory,
          logs: [...currentResult.logs, ...eventResult.logs]  // 累积所有日志
        };

        console.log(`🔗 立即触发成功: ${nextEvent.name} [深度${depth}]`);

        // 检查这个事件是否也有 delay: 0 的后续事件
        if (nextEvent.nextEvents) {
          const nextImmediateEvents = nextEvent.nextEvents.filter(ne => (ne.delay || 0) === 0);
          eventsToProcess.push(...nextImmediateEvents);
        }

      } catch (error: any) {
        console.warn(`🔗 立即触发链事件失败: ${nextEvent.id}, 错误: ${error.message}`);
      }
    }
  }

  if (depth >= maxDepth) {
    console.warn(`🔗 立即触发事件链达到最大深度限制 (${maxDepth})，停止处理以防无限循环`);
  }

  console.log(`🔗 立即触发事件链处理完成，总深度: ${depth}，处理事件数: ${processedEvents.size}`);
  return currentResult;
}

// 批量触发事件（考虑权重和互斥性）- 增强错误处理和事件链支持
export const triggerEventsBatch = withErrorHandling(
  function triggerEventsBatchImpl(
    events: GameEvent[],
    character: Character,
    inventory: Inventory,
    maxEvents: number = 3,
    historyManager?: HistoryManager,
    currentDay?: number
  ): Array<{
    event: GameEvent;
    triggered: boolean;
    result?: { character: Character; inventory: Inventory; logs: string[] };
    error?: string;
    chainContext?: any;
  }> {
    const results: Array<{
      event: GameEvent;
      triggered: boolean;
      result?: { character: Character; inventory: Inventory; logs: string[] };
      error?: string;
      chainContext?: any;
    }> = [];
    
    const errors: string[] = [];
    
    try {
      // 获取当前日期的调度链事件
      const dayNum = currentDay || character.daysLived || 0;
      const scheduledChainEvents = eventChainManager.getScheduledEvents(dayNum);
      
      // 调试日志
      if (scheduledChainEvents.length > 0) {
        console.log(`🔗 第${dayNum}天发现 ${scheduledChainEvents.length} 个调度链事件:`, scheduledChainEvents.map(e => e.eventId));
      }
      
      // 首先处理调度的链事件
      let currentCharacter = character;
      let currentInventory = inventory;
      let triggeredCount = 0;
      
      for (const scheduledEvent of scheduledChainEvents) {
        const chainEvent = eventLibrary.find(e => e.id === scheduledEvent.eventId);
        if (!chainEvent) {
          console.warn(`🔗 调度的链事件未找到: ${scheduledEvent.eventId}, 事件库总数量: ${eventLibrary.length}`);
          console.warn(`🔗 事件库前10个事件ID:`, eventLibrary.slice(0, 10).map(e => e.id));
          continue;
        } else {
          console.log(`🔗 找到调度的链事件: ${chainEvent.name} (${chainEvent.id})`);
        }
        
        // 应用上下文更新
        if (scheduledEvent.contextUpdate) {
          eventChainManager.updateChainContext(scheduledEvent.chainId, scheduledEvent.contextUpdate);
        }
        
        try {
          const triggerResult = tryTriggerEvent(
            chainEvent, 
            currentCharacter, 
            currentInventory, 
            historyManager,
            scheduledEvent.chainId,
            dayNum
          );
          
          results.push({
            event: chainEvent,
            triggered: triggerResult.triggered,
            result: triggerResult.result,
            error: triggerResult.error,
            chainContext: triggerResult.chainContext
          });
          
          if (triggerResult.triggered && triggerResult.result) {
            currentCharacter = triggerResult.result.character;
            currentInventory = triggerResult.result.inventory;
            triggeredCount++;
            
            // 如果链事件设置了跳过普通事件，则不处理其他事件
            if (chainEvent.skipNormalEvents) {
              console.log(`🔗 链事件 ${chainEvent.name} 跳过其他普通事件`);
              return results;
            }
          }
        } catch (error: any) {
          errors.push(`链事件触发失败 - 事件 ${chainEvent.id}: ${error.message}`);
          results.push({
            event: chainEvent,
            triggered: false,
            error: error.message
          });
        }
      }
      
      // 如果触发的链事件已达到最大数量，直接返回
      if (triggeredCount >= maxEvents) {
        return results;
      }
      
      // 过滤掉链事件，处理普通事件
      const regularEvents = events.filter(event => !event.chainId || event.isChainStart);
      
      // 计算所有可触发事件的权重
      const eligibleEvents = regularEvents
        .filter(event => {
          try {
            return canTriggerEvent(event, currentCharacter, currentInventory, historyManager);
          } catch (error: any) {
            errors.push(`条件检查失败 - 事件 ${event.id}: ${error.message}`);
            return false;
          }
        })
        .map(event => {
          try {
            return {
              event,
              weight: calculateEventWeight(event, currentCharacter, currentInventory, historyManager)
            };
          } catch (error: any) {
            errors.push(`权重计算失败 - 事件 ${event.id}: ${error.message}`);
            return {
              event,
              weight: 1 // 默认权重
            };
          }
        })
        .sort((a, b) => b.weight - a.weight);
      
      for (const { event } of eligibleEvents) {
        if (triggeredCount >= maxEvents) break;
        
        try {
          const triggerResult = tryTriggerEvent(
            event, 
            currentCharacter, 
            currentInventory, 
            historyManager,
            undefined,
            dayNum
          );
          
          results.push({
            event,
            triggered: triggerResult.triggered,
            result: triggerResult.result,
            error: triggerResult.error,
            chainContext: triggerResult.chainContext
          });
          
          if (triggerResult.triggered && triggerResult.result) {
            currentCharacter = triggerResult.result.character;
            currentInventory = triggerResult.result.inventory;
            triggeredCount++;
          }
        } catch (error: any) {
          errors.push(`事件触发失败 - 事件 ${event.id}: ${error.message}`);
          results.push({
            event,
            triggered: false,
            error: error.message
          });
        }
      }
      
      // 清理完成的事件链
      eventChainManager.cleanupCompletedChains();
      
      // 如果有错误，记录但不中断处理
      if (errors.length > 0) {
        const batchError = defaultErrorHandler.createError(
          ErrorType.EVENT_PROCESSING_ERROR,
          ErrorSeverity.MEDIUM,
          `批量事件处理出现 ${errors.length} 个错误`,
          errors.join('\n'),
          { character, inventory }
        );
        defaultErrorHandler.handleError(batchError);
      }
      console.log(`🔍 批量事件处理完成: ${results.length} 个事件，触发 ${triggeredCount} 个`);
      return results;
      
    } catch (error: any) {
      // 严重错误，整个批处理失败
      const criticalError = defaultErrorHandler.createError(
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.CRITICAL,
        `批量事件处理发生严重错误: ${error.message}`,
        error.stack,
        { character, inventory }
      );
      defaultErrorHandler.handleError(criticalError);
      
      // 返回失败结果
      return events.map(event => ({
        event,
        triggered: false,
        error: '系统错误导致事件处理失败'
      }));
    }
  },
  ErrorType.EVENT_PROCESSING_ERROR,
  ErrorSeverity.HIGH
); 

// === 事件链便捷函数 ===

/**
 * 获取活跃事件链的状态信息
 */
export function getActiveEventChains(): Array<{ chainId: string; step: number; startDay: number }> {
  return eventChainManager.getActiveChains();
}

/**
 * 手动清理完成的事件链
 */
export function cleanupEventChains(): number {
  return eventChainManager.cleanupCompletedChains();
}

/**
 * 检查指定日期是否有调度的链事件
 */
export function hasScheduledChainEvents(targetDay: number): boolean {
  const scheduledEvents = eventChainManager.getScheduledEvents(targetDay);
  return scheduledEvents.length > 0;
} 