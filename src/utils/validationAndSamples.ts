import type { Character } from '../types/character';
import type { Inventory, InventoryItem } from '../types/inventory';
import type { EventLog, EventLogEntry } from '../types/eventLog';

// 校验函数
export function isValidCharacter(obj: any): obj is Character {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string' && typeof obj.level === 'number';
}

export function isValidInventory(obj: any): obj is Inventory {
  return obj && typeof obj.ownerId === 'string' && Array.isArray(obj.items);
}

export function isValidEventLog(obj: any): obj is EventLog {
  return obj && Array.isArray(obj.entries);
}

// 示例数据
export const sampleCharacter: Character = {
  id: 'char001',
  name: '勇者',
  level: 1,
  profession: '战士',
  daysLived: 0, // 添加 daysLived 字段
  stats: {
    strength: 10,
    agility: 8,
    intelligence: 6,
    stamina: 12,
  },
  equipment: {
    weapon: {
      id: 'sword001',
      name: '铁剑',
      type: 'weapon',
      attributes: { attack: 5 }
    },
    armor: {
      id: 'armor001',
      name: '皮甲',
      type: 'armor',
      attributes: { defense: 3 }
    },
  },
  inventory: ['item001', 'item002'], // 保持为字符串数组用于向后兼容
  relations: {
    friends: ['char002'],
    enemies: [],
  },
};

export const sampleInventory: Inventory = {
  ownerId: 'char001',
  items: [
    {
      id: 'item001',
      name: '铁剑',
      type: 'weapon',
      quantity: 1,
      attributes: { attack: 5 },
      ownerId: 'char001',
    },
    {
      id: 'item002',
      name: '治疗药水',
      type: 'consumable',
      quantity: 3,
      ownerId: 'char001',
    },
  ],
};

export const sampleEventLog: EventLog = {
  entries: [
    {
      id: 'event001',
      timestamp: new Date().toISOString(),
      type: 'battle',
      characterId: 'char001',
      itemId: 'item001',
      details: '勇者使用铁剑击败了史莱姆',
    },
  ],
}; 