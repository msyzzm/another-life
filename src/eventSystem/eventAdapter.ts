import type { Character, EnhancedCharacter } from '../types/character';
import type { Inventory } from '../types/inventory';
import type { EventLog, EventLogEntry } from '../types/eventLog';
import { calculateEnhancedStats, validateCharacter, validateInventory } from '../utils/dataModelManager';
import { runAdvancedEventLoop, EventTriggerResult, EventLoopResult as OriginalEventLoopResult } from './eventLoop';
import type { GameEvent } from './eventTypes';

// 事件循环配置接口
export interface EventLoopConfig {
  maxEvents?: number;
  useWeights?: boolean;
  guaranteeEvent?: boolean;
  eventFilter?: (event: GameEvent) => boolean;
}

// 事件循环结果接口（与原始的保持兼容）
export interface EventLoopResult extends OriginalEventLoopResult {
  summary: OriginalEventLoopResult['summary'] & {
    daysIncremented: boolean;
    newLevel?: number;
  };
}

// 数据模型适配器类
export class EventSystemAdapter {
  
  /**
   * 执行事件循环，并确保数据一致性
   */
  async executeEventLoop(
    character: Character, 
    inventory: Inventory, 
    config: EventLoopConfig = {}
  ): Promise<EventLoopResult> {
    
    // 数据验证与自动修复
    const characterValid = validateCharacter(character);
    const inventoryValid = validateInventory(inventory);
    
    // 如果数据被修复，记录日志但不抛出错误
    if (!characterValid) {
      console.info('角色数据已自动修复并可以继续使用');
    }
    
    if (!inventoryValid) {
      console.info('背包数据已自动修复并可以继续使用');
    }
    
    // 确保背包的ownerId与角色ID匹配
    if (inventory.ownerId !== character.id && inventory.ownerId.startsWith('temp-')) {
      console.info('修复背包所有者ID');
      inventory.ownerId = character.id;
      
      // 同时修复背包中所有物品的ownerId
      inventory.items.forEach(item => {
        if (item.ownerId !== character.id) {
          item.ownerId = character.id;
        }
      });
    }
    
    // 计算增强属性
    const enhancedCharacter = calculateEnhancedStats(character);
    
    // 执行事件循环
    const eventLoopResult = await runAdvancedEventLoop(enhancedCharacter, inventory, config);
    
    // 确保返回的角色数据包含原始字段
    const resultCharacter: Character = {
      ...eventLoopResult.character,
      // 确保保留原始的inventory字段（向后兼容）
      inventory: character.inventory
    };
    
    // 构建结果
    const result: EventLoopResult = {
      character: resultCharacter,
      inventory: eventLoopResult.inventory,
      results: eventLoopResult.results,
      summary: {
        totalEvents: eventLoopResult.summary.totalEvents,
        triggeredEvents: eventLoopResult.summary.triggeredEvents,
        logs: eventLoopResult.summary.logs,
        errors: eventLoopResult.summary.errors,
        daysIncremented: eventLoopResult.character.daysLived > character.daysLived,
        newLevel: eventLoopResult.character.level > character.level ? eventLoopResult.character.level : undefined
      }
    };
    
    return result;
  }
  
  /**
   * 创建事件日志条目
   */
  createEventLogEntries(
    eventResults: EventTriggerResult[], 
    characterId: string
  ): EventLogEntry[] {
    return eventResults
      .filter(result => result.triggered)
      .map(result => ({
        id: `${result.event.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type: result.event.type,
        characterId: characterId,
        details: `${result.event.name}：${result.event.description}${
          result.logs && result.logs.length > 0 
            ? '\n变化：' + result.logs.join('，') 
            : ''
        }`,
        extra: {
          eventId: result.event.id,
          eventType: result.event.type,
          changes: result.logs
        }
      }));
  }
  
  /**
   * 验证装备兼容性
   */
  validateEquipmentCompatibility(character: Character, inventory: Inventory): boolean {
    // 检查角色装备的物品是否在背包中存在对应的定义
    const equipmentIds = Object.values(character.equipment).map(eq => eq?.id).filter(Boolean);
    const inventoryItemIds = inventory.items.map(item => item.id);
    
    // 装备物品可能不在背包中（已装备），所以这里只是警告而不是错误
    const missingItems = equipmentIds.filter(id => id && !inventoryItemIds.includes(id));
    
    if (missingItems.length > 0) {
      console.warn('以下装备物品在背包中找不到对应定义:', missingItems);
    }
    
    return true; // 暂时总是返回true，因为装备可能合理地不在背包中
  }
  
  /**
   * 同步角色inventory字段与Inventory对象
   */
  syncCharacterInventory(character: Character, inventory: Inventory): Character {
    const updatedCharacter = { ...character };
    
    // 更新角色的inventory字段为当前背包中的物品ID列表
    updatedCharacter.inventory = inventory.items.map(item => item.id);
    
    return updatedCharacter;
  }
  
  /**
   * 处理装备变更事件
   */
  handleEquipmentChange(
    character: Character, 
    inventory: Inventory, 
    equipmentChanges: Array<{
      action: 'equip' | 'unequip';
      slot: 'weapon' | 'armor' | 'accessory';
      itemId?: string;
    }>
  ): { character: Character, inventory: Inventory } {
    
    let updatedCharacter = { ...character };
    let updatedInventory = { ...inventory, items: [...inventory.items] };
    
    for (const change of equipmentChanges) {
      if (change.action === 'equip' && change.itemId) {
        // 装备物品
        const item = updatedInventory.items.find(i => i.id === change.itemId);
        if (item && item.type === change.slot) {
          // 卸下当前装备（如果有）
          const currentEquipment = updatedCharacter.equipment[change.slot];
          if (currentEquipment) {
            // 将当前装备放回背包
            const existingItem = updatedInventory.items.find(i => i.id === currentEquipment.id);
            if (existingItem) {
              existingItem.quantity += 1;
            } else {
              updatedInventory.items.push({
                id: currentEquipment.id,
                name: currentEquipment.name,
                type: currentEquipment.type,
                quantity: 1,
                attributes: currentEquipment.attributes,
                ownerId: character.id
              });
            }
          }
          
          // 装备新物品
          updatedCharacter.equipment = {
            ...updatedCharacter.equipment,
            [change.slot]: {
              id: item.id,
              name: item.name,
              type: item.type,
              attributes: item.attributes || {}
            }
          };
          
          // 从背包中移除物品
          if (item.quantity > 1) {
            item.quantity -= 1;
          } else {
            const itemIndex = updatedInventory.items.findIndex(i => i.id === change.itemId);
            if (itemIndex !== -1) {
              updatedInventory.items.splice(itemIndex, 1);
            }
          }
        }
      } else if (change.action === 'unequip') {
        // 卸下装备
        const currentEquipment = updatedCharacter.equipment[change.slot];
        if (currentEquipment) {
          // 将装备放回背包
          const existingItem = updatedInventory.items.find(i => i.id === currentEquipment.id);
          if (existingItem) {
            existingItem.quantity += 1;
          } else {
            updatedInventory.items.push({
              id: currentEquipment.id,
              name: currentEquipment.name,
              type: currentEquipment.type,
              quantity: 1,
              attributes: currentEquipment.attributes,
              ownerId: character.id
            });
          }
          
          // 移除装备
          updatedCharacter.equipment = {
            ...updatedCharacter.equipment,
            [change.slot]: undefined
          };
        }
      }
    }
    
    // 同步inventory字段
    updatedCharacter = this.syncCharacterInventory(updatedCharacter, updatedInventory);
    
    return { character: updatedCharacter, inventory: updatedInventory };
  }
}

// 默认导出单例实例
export const eventAdapter = new EventSystemAdapter(); 