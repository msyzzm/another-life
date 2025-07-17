/**
 * 事件链定义文件
 * 
 * 这个文件包含了Another Life游戏中的所有事件链定义。
 * 事件链是多步骤的连续事件序列，支持以下高级特性：
 * 
 * 🔗 **核心特性**：
 * - 上下文传递：在事件之间保存和传递状态数据
 * - 条件分支：根据玩家选择或角色状态决定后续路径
 * - 延迟触发：支持在未来的特定天数触发后续事件
 * - 智能调度：自动管理事件的触发时机
 * 
 * 📋 **事件链字段说明**：
 * - chainId: 事件链的唯一标识符，同一链中的所有事件必须相同
 * - chainStep: 事件在链中的步骤编号，从0开始递增
 * - isChainStart: 标记链的起始事件，只有起始事件可以被主事件循环触发
 * - isChainEnd: 标记链的结束事件，触发后链将被标记为完成
 * - nextEvents: 定义后续事件的调度信息
 * - skipNormalEvents: 是否跳过当天的其他普通事件
 * 
 * 🎯 **设计原则**：
 * - 每个链都应该有明确的开始和结束
 * - 提供合理的分支选择，避免死胡同
 * - 上下文数据应该有意义且易于理解
 * - 事件描述应该生动有趣，增强沉浸感
 */

import type { GameEvent } from '../eventTypes';

/**
 * 神秘商人事件链
 * 
 * 这是一个经典的多步骤交易事件链，展示了事件链系统的核心功能：
 * 
 * 📖 **剧情概述**：
 * 玩家遇到一位神秘商人，商人提出了一个特殊的交易提议。
 * 玩家需要做出选择，不同的选择会导致不同的结果。
 * 
 * 🎭 **角色要求**：
 * - 等级 >= 3（确保玩家有一定游戏经验）
 * - 智力 >= 10（体现商人交易需要智慧）
 * 
 * 🔄 **流程步骤**：
 * 1. 商人出现 (mysteriousMerchant_start)
 * 2. 玩家选择 (mysteriousMerchant_choice) 
 * 3. 交易结果 (mysteriousMerchant_trade)
 * 
 * 💡 **设计亮点**：
 * - 使用上下文传递玩家的选择
 * - 延迟一天执行交易，增加期待感
 * - 提供有意义的奖励和代价
 */
export const mysteriousMerchantChain: GameEvent[] = [
  {
    id: 'mysteriousMerchant_start',
    type: 'custom',
    name: '神秘商人的出现',
    description: '一位穿着奇异长袍的商人出现在你面前，他的眼中闪烁着智慧的光芒。',
    
    // 触发条件：确保玩家有足够的等级和智力
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 3 },        // 等级要求
      { type: 'attribute', key: 'intelligence', operator: '>=', value: 10 } // 智力要求
    ],
    conditionLogic: 'AND', // 所有条件都必须满足
    
    // 事件结果：在链上下文中记录商人已出现
    outcomes: [
      { type: 'chainContext', key: 'merchantMet', value: 'true', contextOperation: 'set' }
    ],
    
    // === 事件链配置 ===
    chainId: 'mysteriousMerchant',    // 链的唯一标识符
    chainStep: 0,                     // 这是链的第一步
    isChainStart: true,               // 标记为链的起始事件
    
    // 后续事件调度：立即触发选择事件
    nextEvents: [
      {
        eventId: 'mysteriousMerchant_choice', // 下一个事件的ID
        delay: 0,                             // 立即触发（同一天）
        probability: 1.0                      // 100%触发概率
      }
    ],
    
    // 基础事件属性
    probability: 1,  // 10%的触发概率（稀有事件）
    weight: 5          // 较高的权重，优先级高
  },
  
  {
    id: 'mysteriousMerchant_choice',
    type: 'custom',
    name: '商人的提议',
    description: '商人向你展示了一些奇特的物品，并询问你是否愿意进行交易。你可以选择购买魔法药水、询问智慧问题，或者礼貌地离开。',
    conditions: [
      { type: 'chainContext', key: 'merchantMet', operator: '==', value: 'true' }
    ],
    outcomes: [
      
    ],
    
    // 事件链字段
    chainId: 'mysteriousMerchant',
    chainStep: 1,
    nextEvents: [
      {
        eventId: 'mysteriousMerchant_buy',
        delay: 0,
      },
      {
        eventId: 'mysteriousMerchant_wisdom',
        delay: 0,
      },
      {
        eventId: 'mysteriousMerchant_leave',
        delay: 0,
      }
    ]
  },
  
  {
    id: 'mysteriousMerchant_buy',
    type: 'custom',
    name: '购买魔法药水',
    description: '你决定购买商人的魔法药水。商人满意地点头，给了你一瓶闪闪发光的药水。',
    conditions: [
      { type: 'chainContext', key: 'choice', operator: '==', value: 'buy' }
    ],
    outcomes: [
      { type: 'itemGain', key: 'magicPotion', value: 1 },
      { type: 'attributeChange', key: 'stamina', value: 3 },
      { type: 'chainContext', key: 'outcome', value: 'potionBought', contextOperation: 'set' }
    ],
    
    // 事件链字段
    chainId: 'mysteriousMerchant',
    chainStep: 2,
    nextEvents: [
      {
        eventId: 'mysteriousMerchant_gratitude',
        delay: 1,
        probability: 0.8
      }
    ]
  },
  
  {
    id: 'mysteriousMerchant_wisdom',
    type: 'custom',
    name: '寻求智慧',
    description: '你向商人询问关于冒险的智慧。商人深深地看着你，然后分享了一些珍贵的见解。',
    conditions: [
      { type: 'chainContext', key: 'choice', operator: '==', value: 'ask' }
    ],
    outcomes: [
      { type: 'attributeChange', key: 'intelligence', value: 2 },
      { type: 'attributeChange', key: 'agility', value: 1 },
      { type: 'chainContext', key: 'merchantWisdom', value: 'true', contextOperation: 'set' }
    ],
    
    // 事件链字段
    chainId: 'mysteriousMerchant',
    chainStep: 2,
    nextEvents: [
      {
        eventId: 'mysteriousMerchant_bonus',
        delay: 3,
        probability: 1.0,
      }
    ]
  },
  
  {
    id: 'mysteriousMerchant_leave',
    type: 'custom',
    name: '礼貌离开',
    description: '你礼貌地谢绝了商人的提议。商人点头表示理解，并给了你一些旅行用的补给。',
    conditions: [
      { type: 'chainContext', key: 'choice', operator: '==', value: 'leave' }
    ],
    outcomes: [
      { type: 'itemGain', key: 'healingPotion', value: 2 },
      { type: 'attributeChange', key: 'stamina', value: 2 },
      { type: 'chainContext', key: 'outcome', value: 'leftPolitely', contextOperation: 'set' }
    ],
    
    // 事件链字段
    chainId: 'mysteriousMerchant',
    chainStep: 2,
    isChainEnd: true
  },
  
  {
    id: 'mysteriousMerchant_gratitude',
    type: 'custom',
    name: '商人的感激',
    description: '商人对你的购买表示感激，额外赠送了一把精制短剑作为谢礼。',
    conditions: [
      { type: 'chainContext', key: 'outcome', operator: '==', value: 'potionBought' }
    ],
    outcomes: [
      { type: 'itemGain', key: 'fineSword', value: 1 },
      { type: 'attributeChange', key: 'charisma', value: 1 }
    ],
    
    // 事件链字段
    chainId: 'mysteriousMerchant',
    chainStep: 3,
    isChainEnd: true
  },
  
  {
    id: 'mysteriousMerchant_bonus',
    type: 'custom',
    name: '智者的奖励',
    description: '商人对你的智慧印象深刻，传授给你一个强大的法术。',
    conditions: [
      { type: 'chainContext', key: 'merchantWisdom', operator: '==', value: 'true' }
    ],
    outcomes: [
      { type: 'itemGain', key: 'spellScroll', value: 1 },
      { type: 'attributeChange', key: 'intelligence', value: 2 },
      { type: 'attributeChange', key: 'mana', value: 10 }
    ],
    
    // 事件链字段
    chainId: 'mysteriousMerchant',
    chainStep: 3,
    isChainEnd: true
  }
];

// 龙穴探险事件链
export const dragonLairChain: GameEvent[] = [
  {
    id: 'dragonLair_discovery',
    type: 'custom',
    name: '发现龙穴',
    description: '你在山脉深处发现了一个古老的洞穴，从中传来微弱的龙息味道。',
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 8 },
      { type: 'attribute', key: 'strength', operator: '>=', value: 20 },
      { type: 'attribute', key: 'agility', operator: '>=', value: 15 }
    ],
    conditionLogic: 'AND',
    outcomes: [
      { type: 'chainContext', key: 'lairFound', value: 'true', contextOperation: 'set' }
    ],
    
    chainId: 'dragonLair',
    chainStep: 0,
    isChainStart: true,
    nextEvents: [
      {
        eventId: 'dragonLair_entrance',
        delay: 1,
        probability: 1.0
      }
    ],
    
    probability: 0.02,
    weight: 15
  },
  
  {
    id: 'dragonLair_entrance',
    type: 'custom',
    name: '洞穴入口的选择',
    description: '站在龙穴入口，你感受到强大的魔法力量。你可以选择勇敢进入、仔细观察，或者明智地离开。',
    conditions: [
      { type: 'chainContext', key: 'lairFound', operator: '==', value: 'true' }
    ],
    outcomes: [
      { type: 'chainContext', key: 'approach', value: 'enter', contextOperation: 'set' }
    ],
    
    chainId: 'dragonLair',
    chainStep: 1,
    nextEvents: [
      {
        eventId: 'dragonLair_treasure',
        delay: 0,
      }
    ]
  },
  
  {
    id: 'dragonLair_treasure',
    type: 'custom',
    name: '龙穴宝藏',
    description: '你勇敢地进入龙穴，发现了大量的宝藏，但也惊醒了沉睡的古龙！',
    conditions: [
      { type: 'chainContext', key: 'approach', operator: '==', value: 'enter' }
    ],
    outcomes: [
      { type: 'itemGain', key: '龙鳞', value: 3 },
      { type: 'itemGain', key: '古代金币', value: 100 },
      { type: 'attributeChange', key: 'strength', value: 5 },
      { type: 'attributeChange', key: 'stamina', value: -5 }
    ],
    
    chainId: 'dragonLair',
    chainStep: 2,
    isChainEnd: true,
    skipNormalEvents: true
  }
];