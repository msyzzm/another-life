import type { Character } from '../types/character';

// 事件类型定义
export type EventType = 'battle' | 'findItem' | 'levelUp' | 'custom' | 'initial';

// 扩展条件类型，增加历史条件支持
export interface EventCondition {
  type: 'attribute' | 'item' | 'level' | 'itemCount' | 'custom' 
      | 'history' | 'streak' | 'cumulative' | 'daysSince' | 'eventCount' | 'chainContext';
  key: string;
  operator: '>' | '>=' | '<' | '<=' | '==' | '!=';
  value: number | string;
  // 历史条件专用参数
  historyType?: 'eventTriggered' | 'attributeChange' | 'itemGained' | 'itemLost' | 'dayPassed';
  timeWindow?: number; // 检查的时间窗口（天数）
  consecutive?: boolean; // 是否需要连续
  // 事件链上下文条件专用参数
  contextPath?: string; // 上下文中的路径，如 'choice.selectedOption'
}

// 事件链上下文接口
export interface EventChainContext {
  chainId: string;
  step: number;
  data: { [key: string]: any }; // 可存储任意链上下文数据
  character?: Partial<Character>; // 角色状态快照
  timestamp: Date;
  previousEventId?: string;
}

// 事件链下一步配置
export interface ChainNextEvent {
  eventId: string;
  delay?: number; // 延迟天数，0表示立即触发
}

// 玩家历史记录接口
export interface PlayerHistory {
  characterId: string;
  dailyRecords: DailyRecord[];
  eventHistory: EventRecord[];
  createdAt: Date;
  lastUpdated: Date;
}

// 每日记录
export interface DailyRecord {
  day: number;
  events: string[]; // 触发的事件ID列表
  attributeChanges: AttributeChange[];
  itemsGained: ItemChange[];
  itemsLost: ItemChange[];
  finalStats: { [key: string]: number };
  timestamp: Date;
}

// 事件历史记录
export interface EventRecord {
  eventId: string;
  eventName: string;
  eventType: EventType;
  day: number;
  outcomes: string[]; // 结果描述
  timestamp: Date;
  chainId?: string; // 所属的事件链ID
}

// 属性变化记录
export interface AttributeChange {
  attribute: string;
  from: number;
  to: number;
  change: number;
}

// 物品变化记录
export interface ItemChange {
  itemId: string;
  itemName: string;
  quantity: number;
}

// 随机值配置接口
export interface RandomValueConfig {
  type: 'range' | 'choice' | 'weighted';
  // 范围随机 (type: 'range')
  min?: number;
  max?: number;
  // 选择随机 (type: 'choice')
  choices?: Array<number | string>;
  // 权重随机 (type: 'weighted')
  weightedChoices?: Array<{
    value: number | string;
    weight: number;
  }>;
  // 通用配置
  allowFloat?: boolean; // 是否允许浮点数，默认false
}

// 扩展事件结果类型，支持链上下文操作和随机结果
export interface EventOutcome {
  type: 'attributeChange' | 'levelChange' | 'itemGain' | 'itemLoss' | 'custom' | 'chainContext' | 'randomOutcome';
  key: string;
  value?: number | string; // 固定值（与random互斥）
  
  // 随机结果支持
  random?: RandomValueConfig; // 随机值配置（与value互斥）
  
  // 链上下文操作专用参数
  contextOperation?: 'set' | 'add' | 'remove' | 'append'; // 上下文操作类型
  contextPath?: string; // 上下文路径，如 'choices.lastDecision'
  
  // 随机结果专用参数 (type: 'randomOutcome')
  possibleOutcomes?: Array<{
    outcome: Omit<EventOutcome, 'possibleOutcomes'>; // 递归排除避免无限嵌套
    probability?: number; // 触发概率，默认1.0
    weight?: number; // 权重，用于加权随机选择
  }>;
}

// 扩展游戏事件接口，添加事件链支持
export interface GameEvent {
  id: string;
  type: EventType;
  name: string;
  description: string;
  conditions?: EventCondition[];
  conditionLogic?: 'AND' | 'OR'; // 条件逻辑，默认为 AND
  outcomes: EventOutcome[];
  probability?: number; // 0-1
  weight?: number; // 事件权重，用于优先级判断
  
  // 图片相关字段
  imageUrl?: string; // 事件图片地址，支持本地路径和网络URL
  imageAlt?: string; // 图片替代文本，用于无障碍访问
  
  // 事件链相关字段
  chainId?: string; // 事件链标识符
  isChainStart?: boolean; // 是否为链的起始事件
  isChainEnd?: boolean; // 是否为链的结束事件
  nextEvents?: ChainNextEvent[]; // 下一步可能的事件列表
  
  // 链事件特殊配置
  skipNormalEvents?: boolean; // 当这个链事件触发时，是否跳过其他正常事件
} 

// 活跃事件链状态
export interface ActiveEventChain {
  chainId: string;
  currentStep: number;
  context: EventChainContext;
  nextScheduledEvents: Array<{
    eventId: string;
    scheduledDay: number;
  }>;
  startDay: number;
  isComplete: boolean;
} 