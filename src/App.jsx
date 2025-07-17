import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import './App.css';

// 导入数据模型和事件系统
import { runAdvancedEventLoop } from './eventSystem/eventLoop';
import { HistoryManager } from './eventSystem/historyManager'; // 导入 HistoryManager
import { eventLibrary } from './eventSystem/events/index'; // 导入事件库

// 导入数据管理器
import { DataModelManager } from './utils/dataModelManager';

// 导入错误处理集成
import { 
  useErrorHandler, 
} from './utils/errorIntegration';

// 导入错误处理类型 - 暂时注释未使用
// import { ErrorSeverity } from './eventSystem/errorHandler';

// 创建默认角色实例的函数
const defaultCharacterInstance = () => ({
  id: `char-${Date.now()}`,
  name: '旅行者',
  level: 1,
  profession: '无业',
  daysLived: 0,
  stats: { strength: 5, agility: 5, intelligence: 5, stamina: 5 },
  equipment: {},
  inventory: [],
  relations: {},
});

// 创建默认背包的函数
const defaultInventory = () => ({
  ownerId: '', // 将在角色创建后设置
  capacity: 20,
  items: [],
});


function App() {
  const dataModelManager = useMemo(() => new DataModelManager(), []);
  
  // 现有状态
  const [character, setCharacter] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [gameLog, setGameLog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [notification, setNotification] = useState(null); // { message, id, severity }

  // 创建一个ref来持有最新的状态，避免闭包问题
  const latestState = useRef({ character, inventory, gameLog });
  useEffect(() => {
    latestState.current = { character, inventory, gameLog };
  }, [character, inventory, gameLog]);
  
  // 错误处理相关状态
  const [currentError, setCurrentError] = useState(null);
  const [errorHistory, setErrorHistory] = useState([]);
  const [systemHealth] = useState(null);
  const [showErrorPanel, setShowErrorPanel] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('success'); // success, saving, error
  
  // 自动运行相关状态
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [autoRunInterval, setAutoRunInterval] = useState(null);
  const [autoRunSpeed, setAutoRunSpeed] = useState(2000); // 2秒间隔
  const [isExecutingEvent, setIsExecutingEvent] = useState(false); // 防止竞态条件
  const [autoRunCount, setAutoRunCount] = useState(0); // 计数器
  const [eventQueue, setEventQueue] = useState([]); // 事件队列
  const [isProcessingQueue, setIsProcessingQueue] = useState(false); // 队列处理状态
  const [autoRunStartTime, setAutoRunStartTime] = useState(null); // 开始时间
  const [autoRunState, setAutoRunState] = useState('stopped'); // 状态：stopped, starting, running, stopping
  
  // 调试相关状态
  const [debugEventName, setDebugEventName] = useState(''); // 调试事件名称
  const [isDebugMode, setIsDebugMode] = useState(false); // 是否启用调试模式
  
  const { handleError } = useErrorHandler();


  // 优化的日志添加函数（带防抖）
  const addLogEntry = useCallback((message, type = 'event') => {
    const logEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    
    // 直接添加到游戏日志，简化逻辑
    setGameLog(prevLog => [logEntry, ...prevLog.slice(0, 49)]);
  }, []);

  // Ref to track if initialization has run
  const hasInitialized = useRef(false);

  // 初始化数据和错误处理
  useEffect(() => {
    // Only run once, even in React Strict Mode development environment
    if (hasInitialized.current) {
      return;
    }

    // Mark as initialized IMMEDIATELY to prevent re-execution by Strict Mode
    hasInitialized.current = true; // 将这行移到这里

    const initializeApp = async () => {
      try {
      setIsLoading(true);
      
      try {
        // 加载已保存的数据
        const savedData = dataModelManager.loadAll();
        
        if (savedData && savedData.character && savedData.inventory) {
          setCharacter(savedData.character);
          setInventory(savedData.inventory);
          // 加载保存的事件日志
          if (savedData.eventLog && Array.isArray(savedData.eventLog.entries)) {
            setGameLog(savedData.eventLog.entries);
          } else {
            setGameLog([]); // 如果没有保存的日志，则初始化为空
          }
          addLogEntry('数据加载成功。', 'system');
        } else {
          // 创建新游戏
          const newCharacter = defaultCharacterInstance();
          const newInventory = defaultInventory();
          newInventory.ownerId = newCharacter.id;
          setCharacter(newCharacter);
          setInventory(newInventory);
          addLogEntry('欢迎来到另一种人生！开始你的冒险吧。', 'system');
        }
      } catch (error) {
        handleError(error, '初始化应用');
        // 失败时使用默认数据
        const newCharacter = defaultCharacterInstance();
        const newInventory = defaultInventory();
        newInventory.ownerId = newCharacter.id;
        setCharacter(newCharacter);
        setInventory(newInventory);
        addLogEntry('数据加载失败，使用默认设置。', 'error');
      } finally {
        setIsLoading(false);
      }
      } catch (error) {
        handleError(error, '应用初始化失败');
      }
    };

    initializeApp();

    return () => {
      // Cleanup function
    };
  }, [dataModelManager, handleError, addLogEntry]);

  // 自动保存（优化防抖）
  useEffect(() => {
    // 仅在数据加载完毕后启动自动保存
    if (character && inventory) {
      const autoSave = async () => {
        try {
          setAutoSaveStatus('saving');
          
          // 从ref中获取最新的状态来保存
          const { character: latestCharacter, inventory: latestInventory, gameLog: latestGameLog } = latestState.current;
          dataModelManager.saveAll(latestCharacter, latestInventory, { entries: latestGameLog });
          
          setLastSaved(new Date().toLocaleTimeString());
          setAutoSaveStatus('success');
        } catch {
          setAutoSaveStatus('error');
          setTimeout(() => setAutoSaveStatus('success'), 3000);
        }
      };

      // 增加防抖延迟，减少频繁保存
      const saveTimeout = setTimeout(autoSave, 2000);
      return () => clearTimeout(saveTimeout);
    }
  }, [character, inventory, gameLog, dataModelManager, handleError]);

  // 实例化 HistoryManager
  const historyManager = useMemo(() => {
    if (character?.id) {
      return new HistoryManager(character.id);
    }
    return null;
  }, [character?.id]);

  /**
   * 核心触发下一天逻辑
   * 这是整个游戏的核心函数，负责处理每一天的事件循环
   * 
   * 流程说明：
   * 1. 验证角色和背包数据的有效性
   * 2. 调用高级事件循环系统处理当天事件
   * 3. 收集并格式化事件日志
   * 4. 更新角色状态和UI显示
   * 5. 处理升级和错误信息
   * 
   * @param {Object} currentChar - 当前角色数据
   * @param {Object} currentInventory - 当前背包数据  
   * @param {HistoryManager} currentHistoryManager - 历史记录管理器
   * @param {Function} currentHandleError - 错误处理函数
   * @param {Function} currentAddLogEntry - 日志添加函数
   * @param {Function} currentSetCharacter - 角色状态更新函数
   * @param {Function} currentSetInventory - 背包状态更新函数
   * @param {Function} currentSetGameLog - 游戏日志更新函数
   */
  const triggerNextDayLogic = useCallback(async (
    currentChar,
    currentInventory,
    currentHistoryManager,
    currentHandleError,
    currentAddLogEntry,
    currentSetCharacter,
    currentSetInventory,
    currentSetGameLog,
    forceEventName = null // 新增参数：强制触发的事件名称
  ) => {
    // 数据有效性检查 - 确保必要的游戏数据存在
    if (!currentChar || !currentInventory) return;

    // 设置加载状态，防止用户重复操作
    setIsLoading(true);

    try {
      // 初始化当天的日志条目数组
      const newLogEntries = [];
      // 记录新一天的开始
      newLogEntries.push(`第 ${currentChar.daysLived + 1} 天开始...`);

      // 调试模式：强制触发指定事件
      let loopResult;
      if (forceEventName && forceEventName.trim()) {
        // 在事件库中查找指定名称的事件
        const targetEvent = eventLibrary.find(event => 
          event.name === forceEventName.trim() || event.id === forceEventName.trim()
        );
        
        if (targetEvent) {
          newLogEntries.push(`🔧 调试模式：强制触发事件 "${targetEvent.name}"`);
          
          // 创建只包含目标事件的事件循环
          loopResult = await runAdvancedEventLoop(currentChar, currentInventory, {
            maxEvents: 1,
            useWeights: false,
            guaranteeEvent: true,
            historyManager: currentHistoryManager,
            forceEvents: [targetEvent] // 强制触发指定事件
          });
        } else {
          newLogEntries.push(`❌ 调试模式：未找到名称为 "${forceEventName}" 的事件`);
          // 如果找不到指定事件，执行正常的事件循环
          loopResult = await runAdvancedEventLoop(currentChar, currentInventory, {
            maxEvents: 3,
            useWeights: true,
            guaranteeEvent: true,
            historyManager: currentHistoryManager
          });
        }
      } else {
        // 正常模式：调用高级事件循环系统
        // 配置参数说明：
        // - maxEvents: 3 (每天最多触发3个事件)
        // - useWeights: true (使用权重排序事件优先级)
        // - guaranteeEvent: true (保证至少触发一个事件)
        // - historyManager: 历史记录管理器，用于历史感知事件
        loopResult = await runAdvancedEventLoop(currentChar, currentInventory, {
          maxEvents: 3,
          useWeights: true,
          guaranteeEvent: true,
          historyManager: currentHistoryManager
        });
      }

      // 处理事件循环的结果，生成用户可读的日志
      loopResult.results.forEach(result => {
        if (result.triggered) {
          // 记录成功触发的事件
          newLogEntries.push(`${result.event.description}`);

          // 添加事件产生的详细日志（如属性变化、物品获得等）
          if (result.logs && result.logs.length > 0) {
            result.logs.forEach(log => {
              // 为详细日志添加缩进，使其更易区分
              newLogEntries.push(`┌ ${log}`);
            });
          }
        } else if (result.error) {
          // 记录失败的事件
          // newLogEntries.push(`❌ 事件失败: ${result.event.name} - ${result.error}`);
        }
      });

      // 检查并处理角色升级
      if (loopResult.summary.newLevel) {
        newLogEntries.push(`🎉 恭喜! 你升级到了等级 ${loopResult.summary.newLevel}!`);
      }

      // 处理事件循环中的错误（非致命错误，游戏继续）
      if (loopResult.summary.errors && loopResult.summary.errors.length > 0) {
        newLogEntries.push(`本轮处理中出现了 ${loopResult.summary.errors.length} 个问题，但游戏继续进行`);
      }

      // 记录当天结束和事件统计
      newLogEntries.push(`第 ${loopResult.character.daysLived} 天结束。触发了 ${loopResult.summary.triggeredEvents} 个事件。`);

      // 更新游戏状态 - 应用事件循环的结果
      currentSetCharacter(loopResult.character);
      currentSetInventory(loopResult.inventory);

      // 准备UI显示的日志数据
      const timestamp = new Date().toLocaleTimeString();
      // 反转日志顺序，让最新的事件显示在顶部
      const reversedLogEntries = [...newLogEntries].reverse();

      // 格式化日志条目，添加类型标识用于UI样式
      const logEntries = reversedLogEntries.map((message, index) => ({
        id: `${Date.now()}-${index}`,  // 唯一标识符
        message,
        // 根据消息内容自动分类日志类型
        type: message.includes('🎉') ? 'system' :           // 升级等系统消息
              //message.includes('问题') ? 'error' :            // 错误消息
              message.includes('天开始') || message.includes('天结束') ? 'system' : 'event',  // 普通事件
        timestamp
      }));

      // 更新游戏日志显示，保持最多50条记录
      currentSetGameLog(prevLog => [...logEntries, ...prevLog.slice(0, 50 - logEntries.length)]);

    } catch (error) {
      // 处理致命错误 - 记录错误但不中断游戏
      currentHandleError(error, '事件循环执行');
      currentAddLogEntry('今天发生了一些技术问题，但明天会更好！', 'error');
    } finally {
      // 无论成功失败都要清除加载状态
      setIsLoading(false);
    }
  }, [setIsLoading]);

  /**
   * 触发下一天事件的主入口函数
   * 这是用户点击"下一天"按钮后的直接处理函数
   * 
   * 职责：
   * 1. 验证系统组件的初始化状态
   * 2. 执行必要的前置检查
   * 3. 调用核心事件处理逻辑
   * 4. 处理顶层错误
   * 
   * 错误处理策略：
   * - 组件未初始化：记录错误并终止执行
   * - 数据缺失：记录错误并终止执行  
   * - 执行错误：记录错误但尝试恢复
   */
  const triggerNextDay = useCallback(async () => {
    // 前置条件检查1：确保历史管理器已正确初始化
    // 历史管理器用于处理历史感知事件和记录游戏历史
    if (!historyManager) {
      handleError(new Error('HistoryManager 未初始化'), '触发下一天事件');
      return;
    }
    
    // 前置条件检查2：确保角色和背包数据存在
    // 这些是游戏运行的基础数据，缺失则无法继续
    if (!character || !inventory) {
      handleError(new Error('角色或背包数据未初始化'), '触发下一天事件');
      return;
    }

    try {
      // 调用核心事件处理逻辑
      // 传递所有必要的状态和函数，保持函数的纯净性
      const forceEventName = isDebugMode && debugEventName ? debugEventName : null;
      await triggerNextDayLogic(
        character,           // 当前角色状态
        inventory,           // 当前背包状态
        historyManager,      // 历史记录管理器
        handleError,         // 错误处理函数
        addLogEntry,         // 日志记录函数
        setCharacter,        // 角色状态更新函数
        setInventory,        // 背包状态更新函数
        setGameLog,          // 游戏日志更新函数
        forceEventName       // 强制触发的事件名称
      );
    } catch (error) {
      // 捕获并处理顶层执行错误
      // 这里的错误通常是系统级别的严重问题
      handleError(error, '事件循环失败');
    }
  }, [
    // 依赖项列表 - 当这些值变化时，函数会重新创建
    character,              // 角色数据变化时重新绑定
    inventory,              // 背包数据变化时重新绑定
    historyManager,         // 历史管理器变化时重新绑定
    handleError,            // 错误处理函数
    addLogEntry,            // 日志函数
    setCharacter,           // 状态更新函数
    setInventory,           // 状态更新函数
    setGameLog,             // 日志更新函数
    triggerNextDayLogic,    // 核心逻辑函数
    isDebugMode,            // 调试模式状态
    debugEventName          // 调试事件名称
  ]);

  // 手动保存（增强错误处理）
  const handleManualSave = async () => {
    try {
    if (!character || !inventory) return;

    dataModelManager.saveAll(character, inventory);
    setLastSaved(new Date().toLocaleTimeString());
    addLogEntry('游戏已手动保存', 'system');
    } catch (error) {
      handleError(error, '手动保存失败');
    }
  };

  // 重置游戏（增强错误处理）
  const handleReset = async () => {
    try {
    if (window.confirm('确定要重置游戏吗？这将清除所有进度！')) {
      dataModelManager.clearAll();
      const newCharacter = defaultCharacterInstance();
      const newInventory = defaultInventory();
      newInventory.ownerId = newCharacter.id;
      setCharacter(newCharacter);
      setInventory(newInventory);
      setGameLog([]);
      addLogEntry('游戏已重置，开始新的冒险！', 'system');
    }
    } catch (error) {
      handleError(error, '游戏重置失败');
    }
  };

  // 错误面板相关函数
  const dismissError = () => {
    setCurrentError(null);
    setShowErrorPanel(false);
  };


  const clearErrorHistory = () => {
    setErrorHistory([]);
    addLogEntry('错误历史已清除', 'system');
  };

  // 状态管理和验证函数
  const [lastValidationState, setLastValidationState] = useState(null);
  
  const validateAutoRunState = useCallback(() => {
    const currentStateKey = `${isAutoRunning}-${autoRunState}`;
    
    // 验证状态一致性
    if (isAutoRunning && autoRunState === 'stopped') {
      if (lastValidationState !== currentStateKey) {
        addLogEntry('状态不一致：自动运行标志为true但状态为stopped，正在修复...', 'warning');
        setLastValidationState(currentStateKey);
      }
      setAutoRunState('running');
    }
    
    if (!isAutoRunning && autoRunState === 'running') {
      if (lastValidationState !== currentStateKey) {
        addLogEntry('状态不一致：自动运行标志为false但状态为running，正在修复...', 'warning');
        setLastValidationState(currentStateKey);
      }
      setAutoRunState('stopped');
    }
    
    // 更新验证状态记录
    if (lastValidationState !== currentStateKey) {
      setLastValidationState(currentStateKey);
    }
  }, [isAutoRunning, autoRunState, lastValidationState, addLogEntry]);

  const setAutoRunStateWithValidation = (newState) => {
    setAutoRunState(newState);
    
    // 同步相关状态
    switch (newState) {
      case 'starting':
        if (!isAutoRunning) setIsAutoRunning(true);
        break;
      case 'running':
        if (!isAutoRunning) setIsAutoRunning(true);
        break;
      case 'stopping':
        // 保持isAutoRunning为true，直到完全停止
        break;
      case 'stopped':
        if (isAutoRunning) setIsAutoRunning(false);
        setAutoRunStartTime(null);
        setAutoRunCount(0);
        break;
    }
  };

  // 改进的自动运行控制函数
  const toggleAutoRun = () => {
    if (autoRunState === 'running') {
      // 停止自动运行
      stopAutoRun();
    } else if (autoRunState === 'stopped') {
      // 开始自动运行
      startAutoRun();
    }
    // 如果状态是starting或stopping，则忽略点击
  };

  const startAutoRun = () => {
    if (autoRunState !== 'stopped') return; // 防止重复启动或在错误状态启动
    
    setAutoRunStateWithValidation('starting');
    setAutoRunCount(0);
    setIsExecutingEvent(false);
    setAutoRunStartTime(Date.now());
    
    addLogEntry(`自动运行已开始，间隔：${autoRunSpeed / 1000}秒`, 'system');
    
    const intervalId = setInterval(async () => {
      // 防止竞态条件：如果正在执行事件或处理队列，跳过这次
      if (isExecutingEvent || isLoading || isProcessingQueue || autoRunState === 'stopping') {
        return;
      }
      
      try {
        setIsExecutingEvent(true);
        await executeAutoRunEvent();
        setAutoRunCount(prev => prev + 1);
      } catch (error) {
        handleError(error, '自动运行事件执行失败');
        // 连续错误3次后停止自动运行
        if (autoRunCount > 0 && autoRunCount % 3 === 0) {
          addLogEntry('连续错误过多，自动运行已停止', 'error');
          stopAutoRun();
        }
      } finally {
        setIsExecutingEvent(false);
      }
    }, autoRunSpeed);
    
    setAutoRunInterval(intervalId);
    setAutoRunStateWithValidation('running');
  };

  const stopAutoRun = () => {
    if (autoRunState === 'stopped') return; // 已经停止，避免重复操作
    
    setAutoRunStateWithValidation('stopping');
    
    // 清理间隔
    if (autoRunInterval) {
      clearInterval(autoRunInterval);
      setAutoRunInterval(null);
    }
    
    setIsExecutingEvent(false);
    
    // 清理事件队列
    const remainingEvents = eventQueue.length;
    if (remainingEvents > 0) {
      setEventQueue([]);
    }
    
    // 计算运行时间
    const runTime = autoRunStartTime ? 
      Math.floor((Date.now() - autoRunStartTime) / 1000) : 0;
    
    const message = remainingEvents > 0 ? 
      `自动运行已停止，运行了 ${runTime} 秒，共执行了 ${autoRunCount} 次，清理了 ${remainingEvents} 个待处理事件` :
      `自动运行已停止，运行了 ${runTime} 秒，共执行了 ${autoRunCount} 次`;
    
    addLogEntry(message, 'system');
    
    // 最后设置为停止状态
    setAutoRunStateWithValidation('stopped');
  };

  /**
   * 执行队列中的单个事件
   * 
   * 这是事件分发器，根据事件类型调用相应的处理函数。
   * 支持多种事件类型，并提供扩展机制。
   * 
   * 支持的事件类型：
   * - NEXT_DAY: 下一天事件，触发日常事件循环
   * - CUSTOM_EVENT: 自定义事件，支持自定义处理函数
   * 
   * 错误处理：
   * - 数据验证：确保必要的游戏数据存在
   * - 类型检查：处理未知的事件类型
   * - 异常传播：将执行错误传递给上层处理
   * 
   * @param {Object} event - 要执行的事件对象
   * @param {string} event.type - 事件类型
   * @param {Function} event.handler - 自定义事件的处理函数（可选）
   */
  const executeQueuedEvent = useCallback(async (event) => {
    // 数据完整性检查 - 确保游戏基础数据存在
    if (!character || !inventory) {
      throw new Error('角色或背包数据不存在');
    }
    
    // 根据事件类型分发到相应的处理函数
    switch (event.type) {
      case 'NEXT_DAY':
        // 处理"下一天"事件 - 这是最常见的事件类型
        // 会触发完整的日常事件循环
        await triggerNextDay();
        break;
        
      case 'CUSTOM_EVENT':
        // 处理自定义事件 - 提供扩展机制
        // 允许外部代码注入自定义的事件处理逻辑
        if (event.handler) {
          await event.handler();
        }
        break;
        
      default:
        // 处理未知事件类型 - 记录错误但不中断处理
        addLogEntry(`未知事件类型: ${event.type}`, 'error');
    }
  }, [character, inventory, triggerNextDay, addLogEntry]);

  /**
   * 事件队列处理器
   * 
   * 这是事件队列系统的核心处理函数，负责按顺序执行队列中的所有事件。
   * 队列机制确保事件按正确顺序执行，避免并发问题。
   * 
   * 处理流程：
   * 1. 检查处理状态，避免重复执行
   * 2. 创建队列副本，避免处理过程中的状态竞争
   * 3. 清空原队列，为新事件腾出空间
   * 4. 依次执行队列中的每个事件
   * 5. 处理执行过程中的错误
   * 6. 确保处理状态正确重置
   * 
   * 安全特性：
   * - 防止重复执行（通过isProcessingQueue标志）
   * - 状态竞争保护（队列副本机制）
   * - 错误隔离（单个事件失败不影响其他事件）
   * - 状态恢复（finally块确保状态重置）
   */
  const processEventQueue = useCallback(async () => {
    // 防护检查：如果正在处理或队列为空，则直接返回
    if (isProcessingQueue || eventQueue.length === 0) {
      return;
    }
    
    // 设置处理状态，防止并发执行
    setIsProcessingQueue(true);
    
    try {
      // 创建队列副本，避免处理过程中队列被修改导致的状态竞争
      let currentQueue = [...eventQueue];
      
      // 立即清空原队列，为新的事件请求腾出空间
      // 这样用户可以在处理过程中继续添加新事件
      setEventQueue([]);
      
      // 依次处理队列中的每个事件
      // 使用for循环确保事件按顺序执行，而不是并发执行
      for (const event of currentQueue) {
        await executeQueuedEvent(event);
      }
      
    } catch (error) {
      // 捕获并处理队列处理过程中的错误
      // 这里的错误通常是系统级别的问题
      handleError(error, '事件队列处理失败');
    } finally {
      // 无论成功失败都要重置处理状态
      // 这确保系统可以继续处理后续的事件队列
      setIsProcessingQueue(false);
    }
  }, [isProcessingQueue, eventQueue, executeQueuedEvent, handleError]);

  /**
   * 添加事件到处理队列
   * 
   * 队列机制的作用：
   * 1. 防止并发执行导致的状态竞争
   * 2. 提供事件执行的缓冲和排队机制
   * 3. 支持批量处理和错误恢复
   * 4. 确保事件按顺序执行
   * 
   * @param {string} eventType - 事件类型（如 'NEXT_DAY', 'CUSTOM_EVENT'）
   * @param {Object} eventData - 附加的事件数据
   */
  const addEventToQueue = useCallback((eventType, eventData = {}) => {
    // 创建标准化的事件对象
    const event = {
      id: Date.now() + Math.random(),        // 生成唯一ID，避免重复
      type: eventType,                       // 事件类型，用于分发处理
      timestamp: new Date().toISOString(),   // 创建时间戳，用于调试和日志
      ...eventData                           // 合并额外的事件数据
    };
    
    // 将事件添加到队列末尾
    // 使用函数式更新确保状态的不可变性
    setEventQueue(prev => [...prev, event]);
  }, []);

  // 自动运行事件执行函数（使用队列）
  const executeAutoRunEvent = useCallback(async () => {
    if (!character || !inventory) {
      throw new Error('角色或背包数据不存在');
    }
    
    // 将事件添加到队列中而不是直接执行
    addEventToQueue('NEXT_DAY', {
      source: 'auto-run',
      count: autoRunCount + 1
    });
  }, [character, inventory, addEventToQueue, autoRunCount]);

  // 清理自动运行间隔（组件卸载时）
  useEffect(() => {
    return () => {
      if (autoRunInterval) {
        clearInterval(autoRunInterval);
      }
    };
  }, [autoRunInterval]);

  /**
   * 事件队列变化监听器
   * 
   * 这个useEffect监听事件队列的变化，当有新事件加入队列且当前没有在处理时，
   * 自动启动队列处理器。这实现了事件的自动处理机制。
   * 
   * 触发条件：
   * - 队列中有待处理的事件（eventQueue.length > 0）
   * - 当前没有正在处理队列（!isProcessingQueue）
   * 
   * 工作原理：
   * 1. 监听队列长度变化
   * 2. 检查处理状态
   * 3. 满足条件时自动启动处理器
   * 
   * 这种设计确保了：
   * - 事件的及时处理
   * - 避免重复处理
   * - 响应式的事件处理机制
   */
  useEffect(() => {
    if (eventQueue.length > 0 && !isProcessingQueue) {
      // 启动队列处理器 - 自动处理新加入的事件
      processEventQueue();
    }
  }, [eventQueue.length, isProcessingQueue, processEventQueue]);

  // 状态验证定期检查
  useEffect(() => {
    const validationInterval = setInterval(() => {
      validateAutoRunState();
    }, 5000); // 每5秒验证一次状态

    return () => clearInterval(validationInterval);
  }, [isAutoRunning, autoRunState, validateAutoRunState]);

  // 预先计算所有的memoized值（必须在早期返回之前）
  const characterPanel = useMemo(() => {
    if (!character) return null;
    return (
      <section className="character-panel">
        <h2>角色状态</h2>
        <div className="character-info">
          <p><strong>已生存天数:</strong> {character.daysLived}</p>
          <p><strong>等级:</strong> {character.level}</p>
          
          <div className="stats">
            <h3>属性</h3>
            <div className="stat-item">
              <span>力量:</span> 
              <span className="stat-value">{character.stats.strength}</span>
            </div>
            <div className="stat-item">
              <span>敏捷:</span> 
              <span className="stat-value">{character.stats.agility}</span>
            </div>
            <div className="stat-item">
              <span>智力:</span> 
              <span className="stat-value">{character.stats.intelligence}</span>
            </div>
            <div className="stat-item">
              <span>体力:</span> 
              <span className="stat-value">{character.stats.stamina}</span>
            </div>
          </div>

          {/* 装备显示 */}
          {character.equipment && Object.keys(character.equipment).length > 0 && (
            <div className="equipment">
              <h3>装备</h3>
              {Object.entries(character.equipment).map(([slot, item]) => (
                <div key={slot} className="equipment-item">
                  <span className="slot-name">{slot}:</span>
                  <span className="item-name">{item.name}</span>
                  {item.effects && (
                    <span className="item-effects">
                      {Object.entries(item.effects).map(([stat, value]) => 
                        ` +${value} ${stat}`
                      ).join(', ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }, [character]);

  const inventoryPanel = useMemo(() => {
    if (!inventory) return null;
    return (
      <section className="inventory-panel">
        <h2>背包 ({inventory.items.length}/{inventory.capacity})</h2>
        <div className="inventory-items">
          {inventory.items.length === 0 ? (
            <p>背包是空的</p>
          ) : (
            inventory.items.map(item => (
              <div key={`${item.id}-${item.quantity}`} className="inventory-item">
                <span className="item-name">{item.name}</span>
                <span className="item-type">({item.type})</span>
                <span className="item-quantity">x{item.quantity}</span>
                {item.description && (
                  <div className="item-description">{item.description}</div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    );
  }, [inventory]);

  const gameLogPanel = useMemo(() => (
    <section className="game-log-panel">
      <h2>游戏日志</h2>
      <div className="game-log">
        {gameLog.length === 0 ? (
          <p>暂无日志记录</p>
        ) : (
          gameLog.map((entry, index) => (
            <div key={`${entry.id}-${index}`} className={`log-entry ${entry.type}`}>
              <span className="log-time">[{entry.timestamp}]</span>
              <span className="log-message">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </section>
  ), [gameLog]);

  // 渲染加载状态
  if (isLoading && !character) {
    return (
      <div className="App">
        <div className="loading">
          <h2>正在加载游戏...</h2>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // 渲染主应用
  return (
    <div className="App">
      {notification && (
        <div className={`notification notification-${notification.severity.toLowerCase()}`}>
          <p>{notification.message}</p>
          <button onClick={() => setNotification(null)} className="close-notification">
            &times;
          </button>
        </div>
      )}
      <header className="App-header">
        <h1>另一种人生</h1>
        
        {/* 系统状态指示器 */}
        <div className="system-status">
          <div className={`auto-save-indicator ${autoSaveStatus}`}>
            {autoSaveStatus === 'saving' && '⌛ 保存中...'}
            {autoSaveStatus === 'success' && '✅ 已保存'}
            {autoSaveStatus === 'error' && '❌ 保存失败'}
          </div>
          
          {systemHealth && (
            <div className={`health-indicator ${systemHealth.status}`}>
              {systemHealth.status === 'healthy' && '💚 系统正常'}
              {systemHealth.status === 'warning' && '⚠️ 系统警告'}
              {systemHealth.status === 'critical' && '🔴 系统错误'}
            </div>
          )}
          
          <button 
            className="error-panel-toggle"
            onClick={() => setShowErrorPanel(!showErrorPanel)}
            title="查看错误状态"
          >
            🛠️ {errorHistory.length > 0 && `(${errorHistory.length})`}
          </button>
        </div>
      </header>

      {/* 错误通知 */}
      {currentError && (
        <div className={`error-notification ${currentError.severity.toLowerCase()}`}>
          <div className="error-content">
            <strong>{currentError.title}</strong>
            <p>{currentError.message}</p>
          </div>
          <div className="error-actions">
            <button onClick={dismissError} className="dismiss-btn">
              忽略
            </button>
          </div>
        </div>
      )}

      {/* 错误面板 */}
      {showErrorPanel && (
        <div className="error-panel">
          <div className="error-panel-header">
            <h3>系统状态</h3>
            <button onClick={() => setShowErrorPanel(false)}>✕</button>
          </div>
          
          <div className="error-panel-content">
            {systemHealth && (
              <div className="health-section">
                <h4>系统健康</h4>
                <p>状态: <span className={systemHealth.status}>{systemHealth.status}</span></p>
                <p>最近错误: {systemHealth.recentErrors}</p>
                <p>严重错误: {systemHealth.criticalErrors}</p>
                {systemHealth.recommendations.length > 0 && (
      <div>
                    <strong>建议:</strong>
                    <ul>
                      {systemHealth.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div className="error-history-section">
              <div className="error-history-header">
                <h4>错误历史</h4>
                {errorHistory.length > 0 && (
                  <button onClick={clearErrorHistory} className="clear-btn">
                    清除历史
                  </button>
                )}
              </div>
              
              {errorHistory.length === 0 ? (
                <p>没有错误记录</p>
              ) : (
                <div className="error-list">
                  {errorHistory.slice(0, 5).map(error => (
                    <div key={error.id} className={`error-item ${error.severity.toLowerCase()}`}>
                      <div className="error-time">{new Date(error.timestamp).toLocaleTimeString()}</div>
                      <div className="error-message">{error.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="game-content">
        {/* 角色信息面板 */}
        {characterPanel}

        {/* 背包面板 */}
        {inventoryPanel}

        {/* 游戏控制面板 */}
        <section className="game-controls">
          <h2>游戏控制</h2>
          <div className="control-buttons">
            <button 
              className="next-day-btn" 
              onClick={() => addEventToQueue('NEXT_DAY', { source: 'manual' })}
              disabled={isLoading || autoRunState === 'running' || isProcessingQueue}
            >
              {isLoading ? '处理中...' : (isProcessingQueue ? '队列处理中...' : '下一天')}
            </button>
            
            <button 
              className={`auto-run-btn ${autoRunState === 'running' ? 'active' : ''}`}
              onClick={toggleAutoRun}
              disabled={isLoading || autoRunState === 'starting' || autoRunState === 'stopping'}
            >
              {autoRunState === 'starting' && '正在启动...'}
              {autoRunState === 'running' && '停止自动运行'}
              {autoRunState === 'stopping' && '正在停止...'}
              {autoRunState === 'stopped' && '开始自动运行'}
            </button>
            
            <button 
              className="save-btn" 
              onClick={handleManualSave}
              disabled={isLoading}
            >
              手动保存
            </button>
            
            <button 
              className="reset-btn" 
              onClick={handleReset}
              disabled={isLoading}
            >
              重置游戏
        </button>
          </div>
          
          {autoRunState !== 'stopped' && (
            <div className="auto-run-status">
              {autoRunState === 'starting' && '🔄 正在启动自动运行...'}
              {autoRunState === 'running' && `🔄 自动运行中... (每 ${autoRunSpeed / 1000} 秒) | 执行次数: ${autoRunCount}`}
              {autoRunState === 'stopping' && '🔄 正在停止自动运行...'}
              {autoRunState === 'running' && isExecutingEvent && ' | 🔄 执行中...'}
              {autoRunState === 'running' && isProcessingQueue && ' | 📋 队列处理中...'}
              {autoRunState === 'running' && eventQueue.length > 0 && ` | 队列: ${eventQueue.length}`}
            </div>
          )}
          
          {/* 自动运行速度选择器 */}
          <div className="auto-run-controls">
            <label htmlFor="speed-selector">自动运行速度:</label>
            <select 
              id="speed-selector"
              value={autoRunSpeed} 
              onChange={(e) => setAutoRunSpeed(parseInt(e.target.value))}
              disabled={isAutoRunning}
            >
              <option value="1000">极快 (1秒)</option>
              <option value="2000">快速 (2秒)</option>
              <option value="3000">正常 (3秒)</option>
              <option value="5000">慢速 (5秒)</option>
              <option value="10000">极慢 (10秒)</option>
            </select>
          </div>
          
          {lastSaved && (
            <p className="last-saved">上次保存: {lastSaved}</p>
          )}
        </section>
          
        {/* 游戏日志面板 */}
        {gameLogPanel}

        {/* 调试面板 */}
        <section className="debug-panel">
          <h2>调试面板</h2>
          
          <div className="debug-controls">
            <div className="debug-mode-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={isDebugMode}
                  onChange={(e) => setIsDebugMode(e.target.checked)}
                />
                启用调试模式
              </label>
            </div>
            
            {isDebugMode && (
              <div className="debug-event-input">
                <label htmlFor="debug-event-name">强制触发事件:</label>
                <input
                  id="debug-event-name"
                  type="text"
                  value={debugEventName}
                  onChange={(e) => setDebugEventName(e.target.value)}
                  placeholder="输入事件名称或ID"
                  disabled={isLoading || autoRunState === 'running'}
                />
                <small>
                  提示：输入事件的名称或ID，点击"下一天"时将强制触发该事件
                </small>
              </div>
            )}
          </div>
          
          {systemHealth && (
            <div className="debug-system-info">
              <h3>系统信息</h3>
              <p>系统状态: {systemHealth.status}</p>
            </div>
          )}
        </section>
      </main>
      </div>
  );
}

export default App;
