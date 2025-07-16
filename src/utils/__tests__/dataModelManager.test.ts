import { 
  validateCharacter, 
  validateInventory, 
  validateEventLog,
  migrateCharacterData,
  equipItem,
  calculateEnhancedStats,
  DataModelManager
} from '../dataModelManager';
import type { Character } from '../../types/character';
import type { Inventory } from '../../types/inventory';
import type { EventLog } from '../../types/eventLog';

describe('数据模型管理器测试', () => {
  
  describe('数据验证函数', () => {
    describe('validateCharacter', () => {
      test('应该验证有效的角色数据', () => {
        const validCharacter: Character = {
          id: 'char001',
          name: '测试角色',
          level: 1,
          profession: '战士',
          daysLived: 0,
          stats: {
            strength: 10,
            agility: 8,
            intelligence: 6,
            stamina: 12,
          },
          equipment: {},
          inventory: [],
        };
        
        expect(validateCharacter(validCharacter)).toBe(true);
      });

      test('应该拒绝缺少必需字段的角色数据', () => {
        const invalidCharacter = {
          id: 'char001',
          name: '测试角色',
          // 缺少 level 字段
          profession: '战士',
          daysLived: 0,
          stats: {
            strength: 10,
            agility: 8,
            intelligence: 6,
            stamina: 12,
          },
          equipment: {},
          inventory: [],
        };
        
        expect(validateCharacter(invalidCharacter)).toBe(false);
      });

      test('应该拒绝stats字段不完整的角色数据', () => {
        const invalidCharacter = {
          id: 'char001',
          name: '测试角色',
          level: 1,
          profession: '战士',
          daysLived: 0,
          stats: {
            strength: 10,
            agility: 8,
            // 缺少 intelligence 和 stamina
          },
          equipment: {},
          inventory: [],
        };
        
        expect(validateCharacter(invalidCharacter)).toBe(false);
      });
    });

    describe('validateInventory', () => {
      test('应该验证有效的背包数据', () => {
        const validInventory: Inventory = {
          ownerId: 'char001',
          items: [
            {
              id: 'item001',
              name: '铁剑',
              type: 'weapon',
              quantity: 1,
              ownerId: 'char001',
            },
          ],
        };
        
        expect(validateInventory(validInventory)).toBe(true);
      });

      test('应该拒绝包含无效物品的背包数据', () => {
        const invalidInventory = {
          ownerId: 'char001',
          items: [
            {
              id: 'item001',
              name: '铁剑',
              // 缺少 type 字段
              quantity: 1,
              ownerId: 'char001',
            },
          ],
        };
        
        expect(validateInventory(invalidInventory)).toBe(false);
      });
    });

    describe('validateEventLog', () => {
      test('应该验证有效的事件日志数据', () => {
        const validEventLog: EventLog = {
          entries: [
            {
              id: 'event001',
              timestamp: '2024-01-01T10:00:00.000Z',
              type: 'battle',
              characterId: 'char001',
              details: '战斗事件',
            },
          ],
        };
        
        expect(validateEventLog(validEventLog)).toBe(true);
      });

      test('应该验证空的事件日志', () => {
        const emptyEventLog: EventLog = {
          entries: [],
        };
        
        expect(validateEventLog(emptyEventLog)).toBe(true);
      });
    });
  });

  describe('数据迁移函数', () => {
    test('应该正确迁移旧版本角色数据', () => {
      const oldData = {
        id: 'char001',
        name: '旧角色',
        level: 5,
        stats: {
          strength: 8,
          agility: 6,
        },
        // 缺少一些新字段
      };
      
      const migrated = migrateCharacterData(oldData);
      
      expect(migrated.id).toBe('char001');
      expect(migrated.name).toBe('旧角色');
      expect(migrated.level).toBe(5);
      expect(migrated.daysLived).toBe(0); // 默认值
      expect(migrated.profession).toBe('战士'); // 默认值
      expect(migrated.stats.strength).toBe(8);
      expect(migrated.stats.intelligence).toBe(5); // 默认值
      expect(migrated.stats.stamina).toBe(5); // 默认值
      expect(migrated.equipment).toEqual({});
      expect(migrated.inventory).toEqual([]);
    });

    test('应该处理完全空的数据', () => {
      const migrated = migrateCharacterData({});
      
      expect(migrated.name).toBe('未命名角色');
      expect(migrated.level).toBe(1);
      expect(migrated.daysLived).toBe(0);
      expect(migrated.profession).toBe('战士');
      expect(typeof migrated.id).toBe('string');
    });
  });

  describe('装备管理函数', () => {
    test('应该正确装备武器', () => {
      const character: Character = {
        id: 'char001',
        name: '测试角色',
        level: 1,
        profession: '战士',
        daysLived: 0,
        stats: {
          strength: 10,
          agility: 8,
          intelligence: 6,
          stamina: 12,
        },
        equipment: {},
        inventory: ['sword001'],
      };

      const inventory: Inventory = {
        ownerId: 'char001',
        items: [
          {
            id: 'sword001',
            name: '铁剑',
            type: 'weapon',
            quantity: 1,
            attributes: { attack: 5 },
            ownerId: 'char001',
          },
        ],
      };

      const result = equipItem(character, inventory, 'sword001', 'weapon');
      
      expect(result.character.equipment.weapon).toEqual({
        id: 'sword001',
        name: '铁剑',
        type: 'weapon',
        attributes: { attack: 5 },
      });
      expect(result.inventory.items).toHaveLength(0);
    });

    test('应该正确处理装备替换', () => {
      const character: Character = {
        id: 'char001',
        name: '测试角色',
        level: 1,
        profession: '战士',
        daysLived: 0,
        stats: {
          strength: 10,
          agility: 8,
          intelligence: 6,
          stamina: 12,
        },
        equipment: {
          weapon: {
            id: 'old_sword',
            name: '旧剑',
            type: 'weapon',
            attributes: { attack: 3 },
          },
        },
        inventory: ['new_sword'],
      };

      const inventory: Inventory = {
        ownerId: 'char001',
        items: [
          {
            id: 'new_sword',
            name: '新剑',
            type: 'weapon',
            quantity: 1,
            attributes: { attack: 7 },
            ownerId: 'char001',
          },
        ],
      };

      const result = equipItem(character, inventory, 'new_sword', 'weapon');
      
      expect(result.character.equipment.weapon?.name).toBe('新剑');
      expect(result.inventory.items).toHaveLength(1);
      expect(result.inventory.items[0].name).toBe('旧剑');
    });

    test('应该拒绝装备错误类型的物品', () => {
      const character: Character = {
        id: 'char001',
        name: '测试角色',
        level: 1,
        profession: '战士',
        daysLived: 0,
        stats: {
          strength: 10,
          agility: 8,
          intelligence: 6,
          stamina: 12,
        },
        equipment: {},
        inventory: ['potion'],
      };

      const inventory: Inventory = {
        ownerId: 'char001',
        items: [
          {
            id: 'potion',
            name: '药水',
            type: 'consumable',
            quantity: 1,
            ownerId: 'char001',
          },
        ],
      };

      expect(() => {
        equipItem(character, inventory, 'potion', 'weapon');
      }).toThrow('物品 药水 不能装备到 weapon 插槽');
    });
  });

  describe('增强属性计算', () => {
    test('应该正确计算基础属性', () => {
      const character: Character = {
        id: 'char001',
        name: '测试角色',
        level: 1,
        profession: '战士',
        daysLived: 0,
        stats: {
          strength: 10,
          agility: 8,
          intelligence: 6,
          stamina: 12,
        },
        equipment: {},
        inventory: [],
      };

      const enhanced = calculateEnhancedStats(character);
      
      expect(enhanced.totalAttack).toBe(10); // 基础力量
      expect(enhanced.totalDefense).toBe(5); // 力量的一半
      expect(enhanced.totalSpeed).toBe(8); // 基础敏捷
    });

    test('应该正确计算装备加成', () => {
      const character: Character = {
        id: 'char001',
        name: '测试角色',
        level: 1,
        profession: '战士',
        daysLived: 0,
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
            attributes: { attack: 5, speed: 2 },
          },
          armor: {
            id: 'armor001',
            name: '皮甲',
            type: 'armor',
            attributes: { defense: 3 },
          },
        },
        inventory: [],
      };

      const enhanced = calculateEnhancedStats(character);
      
      expect(enhanced.totalAttack).toBe(15); // 10 + 5
      expect(enhanced.totalDefense).toBe(8); // 5 + 3
      expect(enhanced.totalSpeed).toBe(10); // 8 + 2
    });
  });

  describe('DataModelManager类', () => {
    let manager: DataModelManager;

    beforeEach(() => {
      manager = new DataModelManager();
      // 清空localStorage
      localStorage.clear();
    });

    test('应该正确保存和加载数据', () => {
      const character: Character = {
        id: 'char001',
        name: '测试角色',
        level: 1,
        profession: '战士',
        daysLived: 0,
        stats: {
          strength: 10,
          agility: 8,
          intelligence: 6,
          stamina: 12,
        },
        equipment: {},
        inventory: [],
      };

      const inventory: Inventory = {
        ownerId: 'char001',
        items: [],
      };

      const eventLog: EventLog = {
        entries: [],
      };

      // 保存数据
      const saveSuccess = manager.saveAll(character, inventory, eventLog);
      expect(saveSuccess).toBe(true);

      // 创建新实例来测试加载
      const newManager = new DataModelManager();
      const loadedData = newManager.loadAll();

      expect(loadedData.character).toEqual(character);
      expect(loadedData.inventory).toEqual(inventory);
      expect(loadedData.eventLog).toEqual(eventLog);
    });

    test('应该拒绝保存无效数据', () => {
      const invalidCharacter = {
        // 缺少必需字段
        name: '无效角色',
      };

      const saveSuccess = manager.saveAll(invalidCharacter as any);
      expect(saveSuccess).toBe(false);
    });

    test('应该正确清空所有数据', () => {
      // 先保存一些数据
      localStorage.setItem('character', JSON.stringify({ id: 'test' }));
      localStorage.setItem('inventory', JSON.stringify({ ownerId: 'test' }));
      localStorage.setItem('eventLog', JSON.stringify({ entries: [] }));

      manager.clearAll();

      expect(localStorage.getItem('character')).toBeNull();
      expect(localStorage.getItem('inventory')).toBeNull();
      expect(localStorage.getItem('eventLog')).toBeNull();
    });
  });
}); 