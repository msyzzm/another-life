export interface Character {
  id: string;
  name: string;
  level: number;
  daysLived: number; // 角色已经生活的天数
  stats: {
    strength: number;
    agility: number;
    intelligence: number;
    stamina: number;
  };
  equipment: {
    weapon?: {
      id: string;
      name: string;
      type: string;
      attributes?: { [key: string]: number | string };
    };
    armor?: {
      id: string;
      name: string;
      type: string;
      attributes?: { [key: string]: number | string };
    };
    accessory?: {
      id: string;
      name: string;
      type: string;
      attributes?: { [key: string]: number | string };
    };
  };
  inventory: string[]; // 保留这个字段用于向后兼容，但实际物品数据存储在Inventory中
  relations?: {
    [relationType: string]: string[]; // 例如：{ friends: ['id1', 'id2'], enemies: ['id3'] }
  };
}

// 用于事件系统的扩展角色接口，包含计算属性
export interface EnhancedCharacter extends Character {
  totalAttack?: number;
  totalDefense?: number;
  totalSpeed?: number;
} 