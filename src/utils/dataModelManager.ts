import type { Character, EnhancedCharacter } from '../types/character';
import type { Inventory, InventoryItem } from '../types/inventory';
import type { EventLog, EventLogEntry } from '../types/eventLog';
import { 
  saveCharacter, 
  loadCharacter, 
  saveInventory, 
  loadInventory, 
  saveEventLog, 
  loadEventLog 
} from './persistence';

// 数据验证函数
export function validateCharacter(obj: any): obj is Character {
  if (!obj || typeof obj !== 'object') return false;
  
  // 必需字段检查，但提供默认值修复
  if (typeof obj.id !== 'string') {
    console.warn('角色缺少id字段，自动生成');
    obj.id = `char-${Date.now()}`;
  }
  
  if (typeof obj.name !== 'string') {
    console.warn('角色缺少name字段，使用默认名称');
    obj.name = '旅行者';
  }
  
  if (typeof obj.level !== 'number' || obj.level < 1) {
    console.warn('角色level字段无效，重置为1');
    obj.level = 1;
  }
  
  if (typeof obj.profession !== 'string') {
    console.warn('角色缺少profession字段，使用默认职业');
    obj.profession = '无业';
  }
  
  if (typeof obj.daysLived !== 'number' || obj.daysLived < 0) {
    console.warn('角色daysLived字段无效，重置为0');
    obj.daysLived = 0;
  }

  // stats 对象检查，提供默认值修复
  if (!obj.stats || typeof obj.stats !== 'object') {
    console.warn('角色缺少stats对象，使用默认属性');
    obj.stats = { strength: 5, agility: 5, intelligence: 5, stamina: 5 };
  } else {
    // 检查各个属性
    if (typeof obj.stats.strength !== 'number' || obj.stats.strength < 1) {
      console.warn('角色strength属性无效，重置为5');
      obj.stats.strength = 5;
    }
    if (typeof obj.stats.agility !== 'number' || obj.stats.agility < 1) {
      console.warn('角色agility属性无效，重置为5');
      obj.stats.agility = 5;
    }
    if (typeof obj.stats.intelligence !== 'number' || obj.stats.intelligence < 1) {
      console.warn('角色intelligence属性无效，重置为5');
      obj.stats.intelligence = 5;
    }
    if (typeof obj.stats.stamina !== 'number' || obj.stats.stamina < 1) {
      console.warn('角色stamina属性无效，重置为5');
      obj.stats.stamina = 5;
    }
  }

  // equipment 对象检查 (可选，提供默认值)
  if (!obj.equipment || typeof obj.equipment !== 'object') {
    console.warn('角色缺少equipment对象，使用默认装备');
    obj.equipment = {};
  }

  // inventory 数组检查 (提供默认值)
  if (!Array.isArray(obj.inventory)) {
    console.warn('角色缺少inventory数组，使用默认背包');
    obj.inventory = [];
  }

  // relations 对象检查 (可选，提供默认值)
  if (!obj.relations || typeof obj.relations !== 'object') {
    console.warn('角色缺少relations对象，使用默认关系');
    obj.relations = {};
  }

  return true; // 修复后总是返回true
}

export function validateInventory(obj: any): obj is Inventory {
  if (!obj || typeof obj !== 'object') {
    console.warn('提供的背包数据不是一个有效的对象，无法进行验证或修复:', obj);
    return false;
  }

  // ownerId检查，提供修复
  if (typeof obj.ownerId !== 'string') {
    console.warn('背包缺少ownerId，使用临时ID');
    obj.ownerId = `temp-${Date.now()}`;
  }

  // items数组检查，提供默认值
  if (!Array.isArray(obj.items)) {
    console.warn('背包items不是数组，使用空数组');
    obj.items = [];
  }

  // capacity检查，提供默认值
  if (typeof obj.capacity !== 'number' || obj.capacity < 1) {
    console.warn('背包容量无效，使用默认容量20');
    obj.capacity = 20;
  }

  // 验证每个物品，移除无效物品而不是失败
  const validItems = [];
  for (let i = 0; i < obj.items.length; i++) {
    const item = obj.items[i];
    if (validateInventoryItem(item, obj.ownerId)) {
      validItems.push(item);
    } else {
      console.warn(`移除无效物品 #${i}:`, item);
    }
  }
  
  if (validItems.length !== obj.items.length) {
    console.warn(`清理了 ${obj.items.length - validItems.length} 个无效物品`);
    obj.items = validItems;
  }

  return true; // 修复后总是返回true
}

export function validateInventoryItem(obj: any, expectedOwnerId?: string): obj is InventoryItem {
  if (!obj || typeof obj !== 'object') {
    console.warn('库存物品不是一个有效的对象:', obj);
    return false;
  }

  // 基础字段检查
  if (typeof obj.id !== 'string' || !obj.id) {
    console.warn('库存物品缺少或无效的 "id" 字段:', obj);
    return false;
  }
  if (typeof obj.name !== 'string' || !obj.name) {
    console.warn('库存物品缺少或无效的 "name" 字段:', obj);
    return false;
  }
  if (typeof obj.type !== 'string' || !obj.type) {
    console.warn('库存物品缺少或无效的 "type" 字段:', obj);
    return false;
  }
  if (typeof obj.quantity !== 'number' || obj.quantity < 1) {
    console.warn(`库存物品 "${obj.name}" 的 "quantity" 字段无效 (必须 >= 1):`, obj);
    return false;
  }

  // ownerId检查，如果提供了expectedOwnerId，尝试修复
  if (typeof obj.ownerId !== 'string') {
    if (expectedOwnerId) {
      console.warn(`物品 ${obj.name} 缺少ownerId，自动修复为 ${expectedOwnerId}`);
      obj.ownerId = expectedOwnerId;
    } else {
      console.warn(`库存物品 "${obj.name}" 缺少 "ownerId" 且无法自动修复:`, obj);
      return false;
    }
  }

  // attributes是可选的
  if (obj.attributes && typeof obj.attributes !== 'object') {
    console.warn(`物品 ${obj.name} 的attributes字段无效，重置为空对象`);
    obj.attributes = {};
  }

  return true;
}

export function validateEventLog(obj: any): obj is EventLog {
  if (!obj || typeof obj !== 'object') {
    console.warn('事件日志不是一个有效的对象:', obj);
    return false;
  }

  if (!Array.isArray(obj.entries)) {
    console.warn('事件日志缺少或无效的 "entries" 数组:', obj);
    return false;
  }

  for (let i = 0; i < obj.entries.length; i++) {
    const entry = obj.entries[i];
    if (!validateEventLogEntry(entry)) {
      console.warn(`事件日志中的第 ${i} 个条目无效。`);
      return false;
    }
  }

  return true;
}

export function validateEventLogEntry(obj: any): obj is EventLogEntry {
  if (!obj || typeof obj !== 'object') {
    console.warn('事件日志条目不是一个有效的对象:', obj);
    return false;
  }
  if (typeof obj.id !== 'string') {
    console.warn('事件日志条目缺少或无效的 "id" 字段:', obj);
    return false;
  }
  if (typeof obj.timestamp !== 'string') {
    console.warn('事件日志条目缺少或无效的 "timestamp" 字段:', obj);
    return false;
  }
  if (typeof obj.type !== 'string') {
    console.warn('事件日志条目缺少或无效的 "type" 字段:', obj);
    return false;
  }
  return true;
}

// 数据转换函数
export function migrateCharacterData(oldData: any): Character {
  // 处理旧版本数据的迁移
  const migrated: Character = {
    id: oldData.id || 'char-' + Date.now(),
    name: oldData.name || '未命名角色',
    level: oldData.level || 1,
    daysLived: oldData.daysLived || 0,
    stats: {
      strength: oldData.stats?.strength || 5,
      agility: oldData.stats?.agility || 5,
      intelligence: oldData.stats?.intelligence || 5,
      stamina: oldData.stats?.stamina || 5,
      gold: oldData.stats?.gold || 0
    },
    equipment: oldData.equipment || {},
    inventory: oldData.inventory || [],
    relations: oldData.relations || {},
    profession: '',
    race: '',
    gender: ''
  };
  
  return migrated;
}

// 装备管理函数
export function equipItem(character: Character, inventory: Inventory, itemId: string, slot: 'weapon' | 'armor' | 'accessory'): { character: Character, inventory: Inventory } {
  const item = inventory.items.find(i => i.id === itemId);
  if (!item) {
    throw new Error(`物品 ${itemId} 在背包中不存在`);
  }
  
  if (item.type !== slot) {
    throw new Error(`物品 ${item.name} 不能装备到 ${slot} 插槽`);
  }
  
  const newCharacter = { ...character };
  const newInventory = { ...inventory };
  
  // 如果当前装备槽已有装备，先卸下
  if (newCharacter.equipment[slot]) {
    const currentEquipment = newCharacter.equipment[slot];
    if (currentEquipment) {
      // 将当前装备放回背包
      const existingItem = newInventory.items.find(i => i.id === currentEquipment.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        newInventory.items.push({
          id: currentEquipment.id,
          name: currentEquipment.name,
          type: currentEquipment.type,
          quantity: 1,
          attributes: currentEquipment.attributes,
          ownerId: character.id
        });
      }
    }
  }
  
  // 装备新物品
  newCharacter.equipment = {
    ...newCharacter.equipment,
    [slot]: {
      id: item.id,
      name: item.name,
      type: item.type,
      attributes: item.attributes || {}
    }
  };
  
  // 从背包中移除物品
  const itemIndex = newInventory.items.findIndex(i => i.id === itemId);
  if (itemIndex !== -1) {
    if (newInventory.items[itemIndex].quantity > 1) {
      newInventory.items[itemIndex].quantity -= 1;
    } else {
      newInventory.items.splice(itemIndex, 1);
    }
  }
  
  return { character: newCharacter, inventory: newInventory };
}

// 计算增强属性
export function calculateEnhancedStats(character: Character): EnhancedCharacter {
  let totalAttack = character.stats.strength;
  let totalDefense = character.stats.strength / 2;
  let totalSpeed = character.stats.agility;
  
  // 计算装备加成
  Object.values(character.equipment).forEach(equipment => {
    if (equipment && equipment.attributes) {
      if (equipment.attributes.attack) {
        totalAttack += Number(equipment.attributes.attack);
      }
      if (equipment.attributes.defense) {
        totalDefense += Number(equipment.attributes.defense);
      }
      if (equipment.attributes.speed) {
        totalSpeed += Number(equipment.attributes.speed);
      }
    }
  });
  
  return {
    ...character,
    totalAttack: Math.round(totalAttack),
    totalDefense: Math.round(totalDefense),
    totalSpeed: Math.round(totalSpeed)
  };
}

// 统一的数据管理类
export class DataModelManager {
  private character: Character | null = null;
  private inventory: Inventory | null = null;
  private eventLog: EventLog | null = null;
  
  // 加载所有数据
  loadAll(): { character: Character | null, inventory: Inventory | null, eventLog: EventLog | null } {
    try {
      const loadedCharacter = loadCharacter();
      const loadedInventory = loadInventory();
      const loadedEventLog = loadEventLog();
      
      // 验证加载的数据
      if (loadedCharacter && validateCharacter(loadedCharacter)) {
        this.character = loadedCharacter;
      } else if (loadedCharacter) {
        // 尝试迁移旧数据
        this.character = migrateCharacterData(loadedCharacter);
      }
      
      if (loadedInventory && validateInventory(loadedInventory)) {
        this.inventory = loadedInventory;
      }
      
      if (loadedEventLog && validateEventLog(loadedEventLog)) {
        this.eventLog = loadedEventLog;
      }
      
      return {
        character: this.character,
        inventory: this.inventory,
        eventLog: this.eventLog
      };
    } catch (error) {
      console.error('数据加载失败:', error);
      return { character: null, inventory: null, eventLog: null };
    }
  }
  
  // 保存所有数据
  saveAll(character?: Character, inventory?: Inventory, eventLog?: EventLog): boolean {
    try {
      // console.log('[[DEBUG]] saveAll: character:', character, 'inventory:', inventory, 'eventLog:', eventLog);
      if (character) {
        if (!validateCharacter(character)) {
          throw new Error('角色数据验证失败');
        }
        saveCharacter(character);
        this.character = character;
      }
      
      if (inventory) {
        if (!validateInventory(inventory)) {
          throw new Error('背包数据验证失败');
        }
        saveInventory(inventory);
        this.inventory = inventory;
      }
      
      if (eventLog) {
        if (!validateEventLog(eventLog)) {
          throw new Error('事件日志数据验证失败');
        }
        saveEventLog(eventLog);
        this.eventLog = eventLog;
      }
      
      return true;
    } catch (error) {
      console.error('数据保存失败:', error);
      return false;
    }
  }
  
  // 获取当前数据
  getCurrentData() {
    return {
      character: this.character,
      inventory: this.inventory,
      eventLog: this.eventLog
    };
  }
  
  // 清空所有数据
  clearAll() {
    this.character = null;
    this.inventory = null;
    this.eventLog = null;
    
    // 清空localStorage
    localStorage.removeItem('character');
    localStorage.removeItem('inventory');
    localStorage.removeItem('eventLog');
  }
}

// 默认导出单例实例
export const dataManager = new DataModelManager(); 