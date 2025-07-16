export interface InventoryItem {
  id: string;
  name: string;
  type: string; // 例如：weapon, armor, consumable
  quantity: number;
  attributes?: {
    [key: string]: number | string;
  };
  ownerId: string; // 角色ID
}

export interface Inventory {
  ownerId: string; // 角色ID
  items: InventoryItem[];
} 