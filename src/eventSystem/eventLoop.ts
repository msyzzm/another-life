import type { Character } from '../types/character';
import type { Inventory } from '../types/inventory';
import type { GameEvent } from './eventTypes';
import { eventLibrary } from './events/index';
import { canTriggerEvent, tryTriggerEvent, triggerEventsBatch, calculateEventWeight } from './eventEngine';
import { EventSystemAdapter } from './eventAdapter';
import { HistoryManager } from './historyManager';
import { 
  withErrorHandling, 
  defaultErrorHandler, 
  ErrorType, 
  ErrorSeverity,
  createSystemError 
} from './errorHandler';

export interface EventTriggerResult {
  event: GameEvent;
  triggered: boolean;
  logs?: string[];
  error?: string;
}

export interface EventLoopResult {
  character: Character;
  inventory: Inventory;
  results: EventTriggerResult[];
  summary: {
    totalEvents: number;
    triggeredEvents: number;
    logs: string[];
    errors: string[];
  };
}

// 简单事件循环：遍历事件库，尝试触发所有可用事件（向后兼容）- 添加错误处理
export const runEventLoop = withErrorHandling(
  function runEventLoopImpl(character: Character, inventory: Inventory): EventTriggerResult[] {
    const results: EventTriggerResult[] = [];
    
    // 创建副本以避免修改原对象
    let currentCharacter = JSON.parse(JSON.stringify(character));
    let currentInventory = JSON.parse(JSON.stringify(inventory));
    
    const errors: string[] = [];
    
    // 实例化 HistoryManager
    const historyManager = new HistoryManager(character.id);

    for (const event of eventLibrary) {
      try {
        if (canTriggerEvent(event, currentCharacter, currentInventory, historyManager)) {
          const triggerResult = tryTriggerEvent(event, currentCharacter, currentInventory, historyManager);
          results.push({ 
            event, 
            triggered: triggerResult.triggered,
            logs: triggerResult.result?.logs,
            error: triggerResult.error
          });
          
          // 如果事件触发成功，更新当前状态
          if (triggerResult.triggered && triggerResult.result) {
            currentCharacter = triggerResult.result.character;
            currentInventory = triggerResult.result.inventory;
          }
        }
      } catch (error: any) {
        errors.push(`事件 ${event.id} 处理失败: ${error.message}`);
        results.push({
          event,
          triggered: false,
          error: error.message
        });
      }
    }
    
    // 记录累积的错误
    if (errors.length > 0) {
      const loopError = defaultErrorHandler.createError(
        ErrorType.EVENT_PROCESSING_ERROR,
        ErrorSeverity.MEDIUM,
        `事件循环处理出现 ${errors.length} 个错误`,
        errors.join('\n'),
        { character, inventory }
      );
      defaultErrorHandler.handleError(loopError);
    }
    
    return results;
  },
  ErrorType.SYSTEM_ERROR,
  ErrorSeverity.HIGH
);

/**
 * 加权随机选择事件
 * 
 * 这个函数实现了加权随机选择算法，既考虑事件权重又保持随机性。
 * 权重高的事件有更大概率被选中，但不是绝对的。
 * 
 * @param {GameEvent[]} events - 可选择的事件列表
 * @param {Character} character - 角色状态
 * @param {Inventory} inventory - 背包状态
 * @param {number} maxEvents - 最大选择数量
 * @param {HistoryManager} historyManager - 历史管理器
 * @returns {GameEvent[]} 选中的事件列表
 */
function selectEventsWithWeightedRandom(
  events: GameEvent[],
  character: Character,
  inventory: Inventory,
  maxEvents: number,
  historyManager?: HistoryManager
): GameEvent[] {
  // 安全检查：确保输入参数有效
  if (!events || !Array.isArray(events) || events.length === 0) {
    return [];
  }

  const selectedEvents: GameEvent[] = [];
  const availableEvents = [...events];
  
  console.log(`🔍 从 ${availableEvents.length} 个可用事件中选择，最大数量: ${maxEvents}`);
  for (let i = 0; i < maxEvents && availableEvents.length > 0; i++) {
    // 计算每个事件的动态权重
    const weightedEvents = availableEvents.map(event => ({
      event,
      weight: calculateEventWeight(event, character, inventory, historyManager)
    }));
    console.log(`🔍 当前可选事件权重: ${weightedEvents.map(e => `${e.event.name}: ${e.weight}`).join(', ')}`);
    // 加权随机选择
    const selectedEvent = weightedRandomSelect(weightedEvents);
    if (selectedEvent) {
      selectedEvents.push(selectedEvent);
      
      // 从可用事件中移除已选择的事件，避免重复选择
      const index = availableEvents.indexOf(selectedEvent);
      if (index !== -1) {
        availableEvents.splice(index, 1);
      }
    }
  }
  
  console.log(`🔍 最终选择了 ${selectedEvents.length} 个事件`);
  return selectedEvents;
}

/**
 * 加权随机选择算法
 * 
 * 使用轮盘赌算法（Roulette Wheel Selection）进行加权随机选择。
 * 权重越高的事件被选中的概率越大。
 * 
 * @param {Array} weightedEvents - 包含事件和权重的数组
 * @returns {GameEvent} 被选中的事件
 */
function weightedRandomSelect(weightedEvents: Array<{event: GameEvent, weight: number}>): GameEvent | null {
  // 安全检查：确保输入数组有效且不为空
  if (!weightedEvents || !Array.isArray(weightedEvents) || weightedEvents.length === 0) {
    return null;
  }
  
  // 计算总权重
  const totalWeight = weightedEvents.reduce((sum, item) => sum + (item.weight || 0), 0);
  
  // 如果总权重为0或所有权重都无效，随机选择一个
  if (totalWeight === 0) {
    const randomIndex = Math.floor(Math.random() * weightedEvents.length);
    return weightedEvents[randomIndex]?.event || null;
  }
  
  // 生成0到总权重之间的随机数
  let random = Math.random() * totalWeight;
  
  // 轮盘赌选择
  for (const item of weightedEvents) {
    if (item && item.weight > 0) {
      random -= item.weight;
      if (random <= 0) {
        return item.event;
      }
    }
  }
  
  // 兜底返回最后一个有效事件
  for (let i = weightedEvents.length - 1; i >= 0; i--) {
    if (weightedEvents[i]?.event) {
      return weightedEvents[i].event;
    }
  }
  
  return null;
}

/**
 * 数组随机打乱函数（Fisher-Yates洗牌算法）
 * 
 * @param {T[]} array - 要打乱的数组
 * @returns {T[]} 打乱后的新数组
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 高级事件循环系统 - 游戏事件处理的核心引擎
 * 
 * 这是Another Life游戏中最重要的函数之一，负责处理每一天的所有事件。
 * 它实现了复杂的事件筛选、排序、触发和结果处理逻辑。
 * 
 * 主要功能：
 * 1. 智能事件筛选 - 根据角色状态和历史记录筛选可触发事件
 * 2. 权重排序 - 按事件重要性和优先级排序
 * 3. 批量处理 - 高效处理多个事件
 * 4. 事件链支持 - 处理连续性事件和上下文传递
 * 5. 错误恢复 - 单个事件失败不影响整体流程
 * 6. 历史感知 - 基于角色历史做智能决策
 * 
 * @param {Character} character - 角色数据对象
 * @param {Inventory} inventory - 背包数据对象
 * @param {Object} options - 配置选项
 * @param {number} options.maxEvents - 每天最大事件数量，默认3个
 * @param {boolean} options.useWeights - 是否使用权重排序，默认true
 * @param {boolean} options.guaranteeEvent - 是否保证至少触发一个事件，默认true
 * @param {string[]} options.eventTypeFilter - 事件类型过滤器，可限制特定类型事件
 * @param {HistoryManager} options.historyManager - 历史记录管理器，用于历史感知事件
 * 
 * @returns {Promise<EventLoopResult>} 事件循环执行结果
 */
export async function runAdvancedEventLoop(
  character: Character,
  inventory: Inventory,
  options: {
    maxEvents?: number;
    useWeights?: boolean;
    guaranteeEvent?: boolean;
    eventTypeFilter?: string[];
    historyManager?: HistoryManager; // 添加 historyManager 参数
    forceEvents?: GameEvent[]; // 添加强制事件参数
  } = {}
): Promise<{
  character: Character;
  inventory: Inventory;
  results: EventTriggerResult[];
  summary: {
    totalEvents: number;
    triggeredEvents: number;
    logs: string[];
    errors: string[];
    newLevel?: number;
  };
}> {
  // 解构配置选项，设置默认值
  const { 
    maxEvents = 3,           // 每天最多触发3个事件，平衡游戏节奏
    useWeights = true,       // 启用权重排序，确保重要事件优先
    guaranteeEvent = true,   // 保证每天至少有一个事件，避免无聊的空白天
    eventTypeFilter,         // 可选的事件类型过滤器
    historyManager,          // 历史记录管理器，用于历史感知事件
    forceEvents              // 强制触发的事件列表
  } = options;
  
  // 初始化错误收集数组和结果数组
  const errors: string[] = [];
  let results: EventTriggerResult[] = [];
  let finalCharacter = { ...character };
  let finalInventory = { ...inventory };

  try {
    // 步骤1：递增角色的生存天数
    // 这是每天开始时的第一个操作，确保天数正确递增
    finalCharacter = { ...character, daysLived: character.daysLived + 1 };

    // 安全检查：确保事件库已正确加载
    if (!eventLibrary || !Array.isArray(eventLibrary)) {
      throw new Error('事件库未正确加载或为空');
    }

    // 步骤2：处理强制事件或从事件库中筛选可触发事件
    let triggerableEvents: GameEvent[];
    
    if (forceEvents && forceEvents.length > 0) {
      // 调试模式：使用强制指定的事件
      console.log(`🔧 调试模式：强制使用 ${forceEvents.length} 个指定事件`);
      triggerableEvents = forceEvents;
    } else {
      // 正常模式：从事件库中筛选出所有可触发的事件
      // 这里会检查每个事件的触发条件，包括：
      // - 属性要求（如力量 >= 5）
      // - 物品要求（如拥有特定物品）
      // - 等级要求
      // - 历史条件（如之前发生过某事件）
      // - 事件链条件等
      triggerableEvents = eventLibrary.filter(event =>
        canTriggerEvent(event, finalCharacter, finalInventory, historyManager)
      );
    }

    // 步骤3：应用事件类型过滤器（如果提供）
    // 允许限制只触发特定类型的事件，用于特殊场景
    if (eventTypeFilter && eventTypeFilter.length > 0) {
      triggerableEvents = triggerableEvents.filter(event =>
        eventTypeFilter.includes(event.type)
      );
    }

    // 步骤4：概率预筛选 - 在选择前先进行概率检查，增加随机性
    // 强制事件跳过概率检查
    if (!forceEvents || forceEvents.length === 0) {
      triggerableEvents = triggerableEvents.filter(event => {
        if (!event) return false;
        const probability = event.probability !== undefined ? event.probability : 1;
        return Math.random() <= probability;
      });
    }

    // 步骤5：智能事件选择 - 使用加权随机选择替代固定排序
    console.log(`🔍 筛选可触发事件: ${triggerableEvents.length} 个事件符合条件`);
    let eventsToTrigger: GameEvent[] = [];
    
    if (forceEvents && forceEvents.length > 0) {
      // 调试模式：直接使用强制事件
      eventsToTrigger = triggerableEvents.slice(0, maxEvents);
      console.log(`🔧 调试模式：直接触发 ${eventsToTrigger.length} 个强制事件`);
    } else if (useWeights && triggerableEvents.length > 0) {
      // 使用加权随机选择，既考虑权重又保持随机性
      eventsToTrigger = selectEventsWithWeightedRandom(
        triggerableEvents, 
        finalCharacter, 
        finalInventory, 
        maxEvents,
        historyManager
      );
    } else if (triggerableEvents.length > 0) {
      // 纯随机选择
      eventsToTrigger = shuffleArray([...triggerableEvents]).slice(0, maxEvents);
    }

    // 步骤6：事件触发保证机制
    // 如果没有选中任何事件但有可触发事件，强制选择一个
    // 这确保玩家每天都有事件体验，避免空白无聊的天数
    console.log(`🔍 选择要触发的事件: ${eventsToTrigger.length} 个事件`);
    if (guaranteeEvent && eventsToTrigger.length === 0) {
      // 重新获取所有可触发事件（不进行概率筛选）
      const allTriggerableEvents = eventLibrary?.filter(event =>
        canTriggerEvent(event, finalCharacter, finalInventory, historyManager)
      ) || [];
      
      if (allTriggerableEvents.length > 0) {
        // 从所有可触发事件中随机选择一个，确保有事件发生
        const randomEvent = allTriggerableEvents[Math.floor(Math.random() * allTriggerableEvents.length)];
        eventsToTrigger.push(randomEvent);
      }
    }

    // 批量触发事件
    const batchResultsArray = triggerEventsBatch(
      eventsToTrigger,
      finalCharacter,
      finalInventory,
      maxEvents,
      historyManager,
      finalCharacter.daysLived // 传递当前天数
    );

    // 初始化这些变量用于循环处理
    let currentCharacterState = { ...finalCharacter };
    let currentInventoryState = { ...finalInventory };
    const allLogsFromBatch: string[] = [];
    const errorsFromBatch: string[] = [];

    // 处理批量触发的结果，并更新角色和库存状态
    results = batchResultsArray.map(eventResult => {
      if (eventResult.triggered && eventResult.result) {
        currentCharacterState = eventResult.result.character;
        currentInventoryState = eventResult.result.inventory;
        allLogsFromBatch.push(...eventResult.result.logs);
      }
      if (eventResult.error) {
        errorsFromBatch.push(eventResult.error);
      }
      return eventResult; // 保留原始的 eventResult 结构
    });

    finalCharacter = currentCharacterState; // 赋值处理完所有事件后的最终状态
    finalInventory = currentInventoryState; // 赋值处理完所有事件后的最终状态
    errors.push(...errorsFromBatch); // 累积错误

    // 检查升级
    const newLevel = finalCharacter.level > character.level ? finalCharacter.level : undefined;

    const summary = {
      totalEvents: results.length,
      triggeredEvents: results.filter(r => r.triggered).length,
      logs: allLogsFromBatch, // 使用收集到的日志
      errors: errors.length > 0 ? errors : [],
      newLevel,
    };

    // 记录累积错误
    if (errors.length > 0) {
      const advancedLoopError = defaultErrorHandler.createError(
        ErrorType.EVENT_PROCESSING_ERROR,
        ErrorSeverity.MEDIUM,
        `高级事件循环出现 ${errors.length} 个错误`,
        errors.join('\n'),
        { character: finalCharacter, inventory: finalInventory }
      );
      defaultErrorHandler.handleError(advancedLoopError);
    }

    return {
      character: finalCharacter,
      inventory: finalInventory,
      results,
      summary
    };
  } catch (error: any) {
    // 捕获顶层错误并记录
    const topLevelError = defaultErrorHandler.createError(
      ErrorType.SYSTEM_ERROR,
      ErrorSeverity.CRITICAL,
      `runAdvancedEventLoop 顶层错误: ${error.message}`,
      error.stack,
      { character, inventory }
    );
    defaultErrorHandler.handleError(topLevelError);
    throw error; // 重新抛出错误以停止进程或由上层处理
  }
}