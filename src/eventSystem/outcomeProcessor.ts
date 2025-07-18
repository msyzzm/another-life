import type { EventOutcome } from './eventTypes';
import type { Character } from '../types/character';
import type { Inventory } from '../types/inventory';
import { RandomProcessor } from './randomProcessor';

// 结果处理接口
export interface OutcomeResult {
  success: boolean;
  logs: string[];
  changes: {
    character?: Partial<Character>;
    inventory?: {
      added: Array<{ id: string; name: string; quantity: number }>;
      removed: Array<{ id: string; name: string; quantity: number }>;
      modified: Array<{ id: string; name: string; oldQuantity: number; newQuantity: number }>;
    };
  };
  error?: string;
}

// 批量结果处理接口
export interface BatchOutcomeResult {
  character: Character;
  inventory: Inventory;
  logs: string[];
  summary: {
    totalOutcomes: number;
    successfulOutcomes: number;
    failedOutcomes: number;
    attributeChanges: number;
    itemChanges: number;
    levelChanges: number;
  };
  errors: string[];
}

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

// 属性变化处理器
export function processAttributeChange(
  character: Character,
  outcome: EventOutcome
): OutcomeResult {
  const logs: string[] = [];
  const changes: any = { character: {} };
  
  try {
    const key = outcome.key as keyof typeof character.stats;
    if (character.stats[key] === undefined) {
      return {
        success: false,
        logs: [],
        changes: {},
        error: `Unknown attribute: ${outcome.key}`
      };
    }
    
    if (typeof outcome.value !== 'number') {
      return {
        success: false,
        logs: [],
        changes: {},
        error: `Invalid value type for attribute change: ${typeof outcome.value}`
      };
    }
    
    const oldValue = (character.stats as any)[key];
    const newValue = Math.max(0, oldValue + outcome.value);
    (character.stats as any)[key] = newValue;
    
    changes.character.stats = { [key]: newValue };
    logs.push(`${key} ${outcome.value > 0 ? '+' : ''}${outcome.value} (${oldValue} → ${newValue})`);
    
    return {
      success: true,
      logs,
      changes
    };
  } catch (error) {
    return {
      success: false,
      logs: [],
      changes: {},
      error: `Error processing attribute change: ${error}`
    };
  }
}

// 等级变化处理器
export function processLevelChange(
  character: Character,
  outcome: EventOutcome
): OutcomeResult {
  const logs: string[] = [];
  const changes: any = { character: {} };
  
  try {
    if (typeof outcome.value !== 'number') {
      return {
        success: false,
        logs: [],
        changes: {},
        error: `Invalid value type for level change: ${typeof outcome.value}`
      };
    }
    
    const oldLevel = character.level;
    const newLevel = Math.max(1, oldLevel + outcome.value);
    character.level = newLevel;
    
    changes.character.level = newLevel;
    logs.push(`等级 ${outcome.value > 0 ? '+' : ''}${outcome.value} (${oldLevel} → ${newLevel})`);
    
    return {
      success: true,
      logs,
      changes
    };
  } catch (error) {
    return {
      success: false,
      logs: [],
      changes: {},
      error: `Error processing level change: ${error}`
    };
  }
}

// 物品获得处理器
export function processItemGain(
  character: Character,
  inventory: Inventory,
  outcome: EventOutcome
): OutcomeResult {
  const logs: string[] = [];
  const changes: any = { inventory: { added: [], modified: [] } };
  
  try {
    if (typeof outcome.value !== 'number' || outcome.value <= 0) {
      return {
        success: false,
        logs: [],
        changes: {},
        error: `Invalid quantity for item gain: ${outcome.value}`
      };
    }
    
    const itemId = outcome.key;
    const quantity = outcome.value;
    const existingItem = inventory.items.find(item => item.id === itemId);
    
    if (existingItem) {
      const oldQuantity = existingItem.quantity;
      existingItem.quantity += quantity;
      
      changes.inventory.modified.push({
        id: itemId,
        name: existingItem.name,
        oldQuantity,
        newQuantity: existingItem.quantity
      });
      logs.push(`获得 ${existingItem.name} x${quantity}`);
    } else {
      const newItem = {
        id: itemId,
        name: itemId,
        type: 'custom' as const,
        quantity,
        ownerId: character.id,
      };
      inventory.items.push(newItem);
      
      changes.inventory.added.push({
        id: itemId,
        name: newItem.name,
        quantity
      });
      logs.push(`获得新物品 ${newItem.name} x${quantity}`);
    }
    
    return {
      success: true,
      logs,
      changes
    };
  } catch (error) {
    return {
      success: false,
      logs: [],
      changes: {},
      error: `Error processing item gain: ${error}`
    };
  }
}

// 物品失去处理器
export function processItemLoss(
  inventory: Inventory,
  outcome: EventOutcome
): OutcomeResult {
  const logs: string[] = [];
  const changes: any = { inventory: { removed: [], modified: [] } };
  
  try {
    if (typeof outcome.value !== 'number' || outcome.value <= 0) {
      return {
        success: false,
        logs: [],
        changes: {},
        error: `Invalid quantity for item loss: ${outcome.value}`
      };
    }
    
    const itemId = outcome.key;
    const lossAmount = outcome.value;
    const itemIndex = inventory.items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      // 如果物品不存在，则静默失败并返回成功，因为没有物品可以失去
      return {
        success: true,
        logs: [`试图失去不存在的物品: ${itemId} (操作已忽略)`],
        changes: {}
      };
    }
    
    const item = inventory.items[itemIndex];
    const actualLoss = Math.min(item.quantity, lossAmount);
    const oldQuantity = item.quantity;
    item.quantity -= actualLoss;
    
    logs.push(`失去 ${item.name} x${actualLoss}`);
    
    if (item.quantity <= 0) {
      inventory.items.splice(itemIndex, 1);
      changes.inventory.removed.push({
        id: itemId,
        name: item.name,
        quantity: actualLoss
      });
      logs.push(`${item.name} 已全部失去`);
    } else {
      changes.inventory.modified.push({
        id: itemId,
        name: item.name,
        oldQuantity,
        newQuantity: item.quantity
      });
    }
    
    return {
      success: true,
      logs,
      changes
    };
  } catch (error) {
    return {
      success: false,
      logs: [],
      changes: {},
      error: `Error processing item loss: ${error}`
    };
  }
}

// 自定义结果处理器（可扩展）
export function processCustomOutcome(
  character: Character,
  inventory: Inventory,
  outcome: EventOutcome
): OutcomeResult {
  const logs: string[] = [];
  const changes = {};
  
  try {
    // 这里可以根据 outcome.key 执行不同的自定义逻辑
    switch (outcome.key) {
      case 'setProfession':
        // 设置角色职业
        const profession = String(outcome.value);
        character.profession = profession;
        logs.push(`设置职业为: ${profession}`);
        break;
        
      case 'setRace':
        // 设置角色种族
        const race = String(outcome.value);
        character.race = race;
        logs.push(`设置种族为: ${race}`);
        break;
        
      case 'setGender':
        // 设置角色性别
        const gender = String(outcome.value);
        character.gender = gender;
        logs.push(`设置性别为: ${gender}`);
        break;
        
      case 'fullHeal':
        // 完全恢复所有属性
        Object.keys(character.stats).forEach(stat => {
          (character.stats as any)[stat] = Math.max((character.stats as any)[stat], 10);
        });
        logs.push('完全恢复所有属性');
        break;
      
      case 'randomAttributeBoost':
        // 随机提升一个属性
        const attributes = Object.keys(character.stats);
        const randomAttr = attributes[Math.floor(Math.random() * attributes.length)] as keyof typeof character.stats;
        const oldValue = (character.stats as any)[randomAttr];
        (character.stats as any)[randomAttr] += 1;
        logs.push(`随机提升 ${randomAttr} +1 (${oldValue} → ${(character.stats as any)[randomAttr]})`);
        break;
      
      default:
        logs.push(`自定义结果: ${outcome.key}`);
    }
    
    return {
      success: true,
      logs,
      changes
    };
  } catch (error) {
    return {
      success: false,
      logs: [],
      changes: {},
      error: `Error processing custom outcome: ${error}`
    };
  }
}

// 主要的结果处理函数
export function processOutcome(
  character: Character,
  inventory: Inventory,
  outcome: EventOutcome
): OutcomeResult {
  // 首先解析随机结果，将随机配置转换为固定值
  const resolvedOutcome = RandomProcessor.resolveRandomOutcome(outcome);
  
  switch (resolvedOutcome.type) {
    case 'attributeChange':
      return processAttributeChange(character, resolvedOutcome);
    case 'levelChange':
      return processLevelChange(character, resolvedOutcome);
    case 'itemGain':
      return processItemGain(character, inventory, resolvedOutcome);
    case 'itemLoss':
      return processItemLoss(inventory, resolvedOutcome);
    case 'custom':
      return processCustomOutcome(character, inventory, resolvedOutcome);
    case 'chainContext':
      // 链上下文结果需要特殊处理，这里返回成功但不做实际操作
      // 实际的链上下文处理在 eventChainManager 中进行
      return {
        success: true,
        logs: [`链上下文操作: ${resolvedOutcome.key}`],
        changes: {}
      };
    default:
      return {
        success: false,
        logs: [],
        changes: {},
        error: `Unknown outcome type: ${(resolvedOutcome as any).type}`
      };
  }
}

// 批量处理多个结果
export function processBatchOutcomes(
  character: Character,
  inventory: Inventory,
  outcomes: EventOutcome[]
): BatchOutcomeResult {
  // 创建深拷贝以确保安全性
  const workingCharacter = deepClone(character);
  const workingInventory = deepClone(inventory);
  
  const allLogs: string[] = [];
  const errors: string[] = [];
  const summary = {
    totalOutcomes: outcomes.length,
    successfulOutcomes: 0,
    failedOutcomes: 0,
    attributeChanges: 0,
    itemChanges: 0,
    levelChanges: 0
  };
  
  for (const outcome of outcomes) {
    const result = processOutcome(workingCharacter, workingInventory, outcome);
    
    if (result.success) {
      summary.successfulOutcomes++;
      allLogs.push(...result.logs);
      
      // 统计变化类型
      switch (outcome.type) {
        case 'attributeChange':
          summary.attributeChanges++;
          break;
        case 'levelChange':
          summary.levelChanges++;
          break;
        case 'itemGain':
        case 'itemLoss':
          summary.itemChanges++;
          break;
      }
    } else {
      summary.failedOutcomes++;
      if (result.error) {
        errors.push(result.error);
      }
    }
  }
  
  return {
    character: workingCharacter,
    inventory: workingInventory,
    logs: allLogs,
    summary,
    errors
  };
}

// 验证结果处理的先决条件
export function validateOutcomePrerequisites(
  character: Character,
  inventory: Inventory,
  outcome: EventOutcome
): { valid: boolean; reason?: string } {
  switch (outcome.type) {
    case 'attributeChange':
    case 'levelChange':
    case 'itemGain':
      // 这些类型通常没有复杂的前提条件
      return { valid: true };
      
    case 'custom':
      // 自定义逻辑可能需要验证，但我们默认其有效
      return { valid: true };
      
    default:
      return { valid: true };
  }
} 