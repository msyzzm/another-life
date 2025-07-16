/**
 * 事件构建器单元测试
 * 测试EventBuilder和EventTemplates的功能
 */

import { EventBuilder, EventTemplates } from '../eventBuilder';
import type { GameEvent } from '../eventTypes';

describe('事件构建器测试', () => {
  describe('EventBuilder 基础功能', () => {
    test('应该能够创建一个基础事件', () => {
      const event = EventBuilder.create()
        .setId('test001')
        .setType('custom')
        .setName('测试事件')
        .setDescription('这是一个测试事件')
        .addOutcome({ type: 'attributeChange', key: 'strength', value: 1 })
        .build();

      expect(event.id).toBe('test001');
      expect(event.type).toBe('custom');
      expect(event.name).toBe('测试事件');
      expect(event.description).toBe('这是一个测试事件');
      expect(event.outcomes).toHaveLength(1);
      expect(event.outcomes[0]).toEqual({
        type: 'attributeChange',
        key: 'strength',
        value: 1
      });
    });

    test('应该能够添加多个条件', () => {
      const event = EventBuilder.create()
        .setId('test002')
        .setType('battle')
        .setName('复杂战斗')
        .setDescription('需要满足多个条件的战斗')
        .addCondition({ type: 'attribute', key: 'strength', operator: '>=', value: 10 })
        .addCondition({ type: 'level', key: 'level', operator: '>=', value: 5 })
        .addOutcome({ type: 'attributeChange', key: 'strength', value: 2 })
        .build();

      expect(event.conditions).toHaveLength(2);
      expect(event.conditions?.[0]).toEqual({
        type: 'attribute',
        key: 'strength',
        operator: '>=',
        value: 10
      });
      expect(event.conditions?.[1]).toEqual({
        type: 'level',
        key: 'level',
        operator: '>=',
        value: 5
      });
    });

    test('应该能够添加多个结果', () => {
      const event = EventBuilder.create()
        .setId('test003')
        .setType('findItem')
        .setName('宝藏发现')
        .setDescription('发现了多样的宝藏')
        .addOutcome({ type: 'itemGain', key: '金币', value: 50 })
        .addOutcome({ type: 'itemGain', key: '宝石', value: 1 })
        .addOutcome({ type: 'attributeChange', key: 'intelligence', value: 1 })
        .build();

      expect(event.outcomes).toHaveLength(3);
      expect(event.outcomes[0].type).toBe('itemGain');
      expect(event.outcomes[1].type).toBe('itemGain');
      expect(event.outcomes[2].type).toBe('attributeChange');
    });

    test('应该能够设置概率和权重', () => {
      const event = EventBuilder.create()
        .setId('test004')
        .setType('custom')
        .setName('概率事件')
        .setDescription('有特定概率和权重的事件')
        .addOutcome({ type: 'attributeChange', key: 'stamina', value: 1 })
        .setProbability(0.5)
        .setWeight(3)
        .build();

      expect(event.probability).toBe(0.5);
      expect(event.weight).toBe(3);
    });

    test('应该能够设置条件逻辑', () => {
      const event = EventBuilder.create()
        .setId('test005')
        .setType('custom')
        .setName('OR逻辑事件')
        .setDescription('使用OR逻辑的事件')
        .addCondition({ type: 'attribute', key: 'strength', operator: '>', value: 20 })
        .addCondition({ type: 'attribute', key: 'intelligence', operator: '>', value: 20 })
        .setConditionLogic('OR')
        .addOutcome({ type: 'attributeChange', key: 'stamina', value: 2 })
        .build();

      expect(event.conditionLogic).toBe('OR');
      expect(event.conditions).toHaveLength(2);
    });
  });

  describe('EventBuilder 验证功能', () => {
    test('应该拒绝没有ID的事件', () => {
      expect(() => {
        EventBuilder.create()
          .setType('custom')
          .setName('无ID事件')
          .setDescription('这个事件没有ID')
          .addOutcome({ type: 'attributeChange', key: 'strength', value: 1 })
          .build();
      }).toThrow('Event ID is required');
    });

    test('应该拒绝没有名称的事件', () => {
      expect(() => {
        EventBuilder.create()
          .setId('test006')
          .setType('custom')
          .setDescription('这个事件没有名称')
          .addOutcome({ type: 'attributeChange', key: 'strength', value: 1 })
          .build();
      }).toThrow('Event name is required');
    });

    test('应该拒绝没有结果的事件', () => {
      expect(() => {
        EventBuilder.create()
          .setId('test007')
          .setType('custom')
          .setName('无结果事件')
          .setDescription('这个事件没有结果')
          .build();
      }).toThrow('Event must have at least one outcome');
    });

    test('应该验证概率值范围', () => {
      const event = EventBuilder.create()
        .setId('test-probability')
        .setType('custom')
        .setName('测试概率')
        .setDescription('测试概率验证')
        .addOutcome({ type: 'attributeChange', key: 'strength', value: 1 })
        .setProbability(1.5) // 超出0-1范围，会被限制为1
        .build();

      // EventBuilder会自动限制概率值在0-1范围内
      expect(event.probability).toBe(1);
    });

    test('应该验证权重值为正数', () => {
      const event = EventBuilder.create()
        .setId('test-weight')
        .setType('custom')
        .setName('测试权重')
        .setDescription('测试权重验证')
        .addOutcome({ type: 'attributeChange', key: 'strength', value: 1 })
        .setWeight(-1) // 负值权重，会被限制为0
        .build();

      // EventBuilder会自动限制权重值为非负数
      expect(event.weight).toBe(0);
    });
  });

  describe('EventTemplates 模板功能', () => {
    test('应该能够创建战斗事件模板', () => {
      const battleEvent = EventTemplates.battle({
        id: 'dragon_fight',
        name: '龙之战',
        description: '与强大的龙进行战斗',
        minStrength: 15,
        strengthGain: 3,
        loot: { itemId: '龙鳞', quantity: 1 }
      }).build();

      expect(battleEvent.id).toBe('dragon_fight');
      expect(battleEvent.type).toBe('battle');
      expect(battleEvent.name).toBe('龙之战');
      expect(battleEvent.conditions).toHaveLength(1);
      expect(battleEvent.conditions?.[0]).toEqual({
        type: 'attribute',
        key: 'strength',
        operator: '>=',
        value: 15
      });
      expect(battleEvent.outcomes).toHaveLength(2);
    });

    test('应该能够创建发现物品事件模板', () => {
      const findEvent = EventTemplates.findItem({
        id: 'treasure_chest',
        name: '宝藏箱',
        description: '发现了一个神秘的宝藏箱',
        item: { itemId: '古老的宝藏箱', quantity: 3 }
      }).build();

      expect(findEvent.id).toBe('treasure_chest');
      expect(findEvent.type).toBe('findItem');
      expect(findEvent.name).toBe('宝藏箱');
      expect(findEvent.outcomes).toHaveLength(1);
      expect(findEvent.outcomes[0]).toEqual({
        type: 'itemGain',
        key: '古老的宝藏箱',
        value: 3
      });
    });

    test('应该能够创建升级事件模板', () => {
      const levelUpEvent = EventTemplates.levelUp({
        id: 'level_up_5',
        name: '达到第5级',
        description: '你的经验积累让你达到了第5级',
        attributeBonus: { strength: 2, intelligence: 1 }
      }).build();

      expect(levelUpEvent.id).toBe('level_up_5');
      expect(levelUpEvent.type).toBe('levelUp');
      expect(levelUpEvent.name).toBe('达到第5级');
      expect(levelUpEvent.outcomes).toHaveLength(3); // 1个等级提升 + 2个属性提升
      expect(levelUpEvent.outcomes.some(o => o.type === 'levelChange')).toBe(true);
      expect(levelUpEvent.outcomes.some(o => o.type === 'attributeChange' && o.key === 'strength')).toBe(true);
    });

    test('应该能够创建职业专属事件模板', () => {
      const professionEvent = EventTemplates.professionEvent({
        id: 'warrior_training',
        name: '战士训练',
        description: '专门为战士设计的训练课程',
        profession: '战士',
        rewards: [
          { type: 'attributeChange', key: 'strength', value: 2 },
          { type: 'attributeChange', key: 'stamina', value: 1 }
        ]
      }).build();

      expect(professionEvent.id).toBe('warrior_training');
      expect(professionEvent.type).toBe('custom');
      expect(professionEvent.name).toBe('战士训练');
      expect(professionEvent.conditions).toHaveLength(1);
      expect(professionEvent.conditions?.[0]).toEqual({
        type: 'profession',
        key: 'profession',
        operator: '==',
        value: '战士'
      });
      expect(professionEvent.outcomes).toHaveLength(2);
    });
  });

  describe('复杂场景测试', () => {
    test('应该能够创建包含完整逻辑的复杂事件', () => {
      const complexEvent = EventBuilder.create()
        .setId('complex001')
        .setType('battle')
        .setName('终极挑战')
        .setDescription('只有真正的勇者才能面对的终极挑战')
        .addCondition({ type: 'attribute', key: 'strength', operator: '>=', value: 20 })
        .addCondition({ type: 'attribute', key: 'intelligence', operator: '>=', value: 15 })
        .addCondition({ type: 'level', key: 'level', operator: '>=', value: 10 })
        .setConditionLogic('AND')
        .addOutcome({ type: 'attributeChange', key: 'strength', value: 5 })
        .addOutcome({ type: 'attributeChange', key: 'intelligence', value: 3 })
        .addOutcome({ type: 'itemGain', key: '传说之剑', value: 1 })
        .addOutcome({ type: 'levelChange', key: 'level', value: 1 })
        .setProbability(0.3)
        .setWeight(10)
        .build();

      expect(complexEvent.id).toBe('complex001');
      expect(complexEvent.type).toBe('battle');
      expect(complexEvent.conditions).toHaveLength(3);
      expect(complexEvent.conditionLogic).toBe('AND');
      expect(complexEvent.outcomes).toHaveLength(4);
      expect(complexEvent.probability).toBe(0.3);
      expect(complexEvent.weight).toBe(10);
    });

    test('应该能够通过模板创建事件然后修改', () => {
      // 先用模板创建基础事件
      const baseEvent = EventTemplates.battle({
        id: 'orc_fight',
        name: '兽人战斗',
        description: '与凶猛的兽人战斗',
        minStrength: 8,
        strengthGain: 1,
        loot: { itemId: '兽人之牙', quantity: 1 }
      }).build();

      // 然后修改事件（虽然EventBuilder不直接支持修改现有事件，我们可以创建一个新的）
      const enhancedEvent = EventBuilder.create()
        .setId(baseEvent.id)
        .setType(baseEvent.type)
        .setName(baseEvent.name)
        .setDescription(baseEvent.description)
        .addCondition(baseEvent.conditions![0])
        .addCondition({ type: 'attribute', key: 'agility', operator: '>=', value: 5 }) // 添加新条件
        .addOutcome(baseEvent.outcomes[0])
        .addOutcome({ type: 'itemGain', key: '兽人之牙', value: 1 }) // 添加新结果
        .setProbability(0.8)
        .setWeight(2)
        .build();

      expect(enhancedEvent.conditions).toHaveLength(2);
      expect(enhancedEvent.outcomes).toHaveLength(2);
      expect(enhancedEvent.probability).toBe(0.8);
      expect(enhancedEvent.weight).toBe(2);
    });
  });

  describe('边界条件和错误处理', () => {
    test('应该处理空字符串ID', () => {
      expect(() => {
        EventBuilder.create()
          .setId('')
          .setType('custom')
          .setName('空ID事件')
          .setDescription('ID为空字符串')
          .addOutcome({ type: 'attributeChange', key: 'strength', value: 1 })
          .build();
      }).toThrow('Event ID is required');
    });

    test('应该处理空字符串名称', () => {
      expect(() => {
        EventBuilder.create()
          .setId('test010')
          .setType('custom')
          .setName('')
          .setDescription('名称为空字符串')
          .addOutcome({ type: 'attributeChange', key: 'strength', value: 1 })
          .build();
      }).toThrow('Event name is required');
    });

    test('应该处理边界概率值', () => {
      // 测试有效的边界值
      const event1 = EventBuilder.create()
        .setId('boundary1')
        .setType('custom')
        .setName('边界概率测试1')
        .setDescription('概率为0')
        .addOutcome({ type: 'attributeChange', key: 'strength', value: 1 })
        .setProbability(0)
        .build();

      const event2 = EventBuilder.create()
        .setId('boundary2')
        .setType('custom')
        .setName('边界概率测试2')
        .setDescription('概率为1')
        .addOutcome({ type: 'attributeChange', key: 'strength', value: 1 })
        .setProbability(1)
        .build();

      expect(event1.probability).toBe(0);
      expect(event2.probability).toBe(1);
    });

    test('应该处理边界权重值', () => {
      // 测试最小正权重
      const event = EventBuilder.create()
        .setId('boundary3')
        .setType('custom')
        .setName('边界权重测试')
        .setDescription('最小权重')
        .addOutcome({ type: 'attributeChange', key: 'strength', value: 1 })
        .setWeight(0.1)
        .build();

      expect(event.weight).toBe(0.1);
    });
  });
}); 