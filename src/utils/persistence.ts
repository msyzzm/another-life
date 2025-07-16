import type { Character } from '../types/character';
import type { Inventory } from '../types/inventory';
import type { EventLog } from '../types/eventLog';

export const CHARACTER_KEY = 'character';
export const INVENTORY_KEY = 'inventory';
export const EVENTLOG_KEY = 'eventLog';

/**
 * 通用数据保存方法
 * @param key - 存储键
 * @param data - 要保存的数据
 */
export function saveData<T>(key: string, data: T) {
  // console.log('[[DEBUG]] saveData: key:', key, 'data:', data);
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error(`保存键为 "${key}" 的数据时出错:`, error);
  }
}

export function loadData<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`加载键为 "${key}" 的数据时出错:`, error);
    return null;
  }
}

/**
 * 保存角色数据
 * @param character - 角色对象
 */
export function saveCharacter(character: Character) {
  saveData(CHARACTER_KEY, character);
}

export function loadCharacter(): Character | null {
  return loadData<Character>(CHARACTER_KEY);
}

/**
 * 保存背包数据
 * @param inventory - 背包对象
 */
export function saveInventory(inventory: Inventory) {
  saveData(INVENTORY_KEY, inventory);
}

export function loadInventory(): Inventory | null {
  return loadData<Inventory>(INVENTORY_KEY);
}

/**
 * 保存事件日志
 * @param eventLog - 事件日志对象
 */
export function saveEventLog(eventLog: EventLog) {
  saveData(EVENTLOG_KEY, eventLog);
}

export function loadEventLog(): EventLog | null {
  return loadData<EventLog>(EVENTLOG_KEY);
} 