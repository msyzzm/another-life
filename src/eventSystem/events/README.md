# 事件库模块化结构

## 概述

原有的大型 `eventLibrary.ts` 文件已被重构为模块化结构，提高了代码的可维护性和可扩展性。

## 文件结构

```
src/eventSystem/events/
├── index.ts              # 主入口文件，整合所有事件
├── battleEvents.ts       # 战斗类事件
├── explorationEvents.ts  # 探索类事件
├── levelUpEvents.ts      # 升级类事件
├── professionEvents.ts   # 职业专属事件
├── socialEvents.ts       # 社交类事件
├── recoveryEvents.ts     # 恢复类事件
├── historyEvents.ts      # 历史感知事件
├── advancedEvents.ts     # 高级稀有事件
├── specialEvents.ts      # 特殊事件
├── eventChains.ts        # 事件链
└── README.md            # 本文档
```

## 使用方式

### 导入所有事件
```typescript
import { eventLibrary } from './events/index';
```

### 按类型导入事件
```typescript
import { eventsByType } from './events/index';
const battleEvents = eventsByType.battle;
```

### 导入特定类型事件
```typescript
import { battleEvents } from './events/battleEvents';
import { historyEvents } from './events/historyEvents';
```

### 使用工具函数
```typescript
import { 
  getEventsByType,
  getEventsByProbability,
  getChainStartEvents 
} from './events/index';

// 获取战斗事件
const battles = getEventsByType('battle');

// 获取稀有事件 (概率 < 0.1)
const rareEvents = getEventsByProbability(0, 0.1);

// 获取事件链起始事件
const chainStarters = getChainStartEvents();
```

## 事件分类

### 基础事件类型
- **battleEvents**: 战斗遭遇事件 (史莱姆、哥布林、野狼等)
- **explorationEvents**: 探索发现事件 (宝箱、遗迹、洞穴等)
- **levelUpEvents**: 角色升级事件

### 角色相关事件
- **professionEvents**: 职业专属事件 (战士试炼、法师研究等)
- **socialEvents**: 社交互动事件 (商人、村民、酒馆等)
- **recoveryEvents**: 恢复类事件 (休息、治疗、冥想等)

### 高级事件类型
- **historyEvents**: 历史感知事件 (基于角色历史行为触发)
- **advancedEvents**: 高级稀有事件 (剑圣传承、大法师秘密等)
- **specialEvents**: 特殊事件 (时间漩涡、生命之泉等)

### 事件链
- **eventChains**: 多步骤连续事件 (神秘商人、龙穴探险等)

## 添加新事件

### 1. 选择合适的文件
根据事件类型选择对应的文件，或创建新的分类文件。

### 2. 添加事件定义
```typescript
export const newEvents: GameEvent[] = [
  {
    id: 'new001',
    type: 'custom',
    name: '新事件',
    description: '这是一个新事件的描述',
    conditions: [
      { type: 'level', key: 'level', operator: '>=', value: 1 }
    ],
    outcomes: [
      { type: 'attributeChange', key: 'strength', value: 1 }
    ],
    probability: 0.5,
    weight: 2
  }
];
```

### 3. 更新主入口文件
在 `index.ts` 中导入并添加到 `eventLibrary` 数组中。

## 事件统计

使用 `eventStats` 对象可以查看各类事件的数量统计：

```typescript
import { eventStats } from './events/index';
console.log(eventStats);
// 输出：
// {
//   total: 50,
//   byType: {
//     battle: 4,
//     exploration: 4,
//     levelUp: 3,
//     // ...
//   }
// }
```

## 向后兼容

原有的 `eventLibrary.ts` 文件仍然存在，但已重构为重新导出新模块的形式，确保现有代码不会中断。建议逐步迁移到新的导入方式。

## 最佳实践

1. **按功能分类**: 将相似功能的事件放在同一个文件中
2. **保持文件大小适中**: 每个文件建议不超过 200 行
3. **使用描述性命名**: 事件ID和名称应该清晰表达事件内容
4. **添加注释**: 为复杂的事件添加详细注释
5. **测试新事件**: 添加新事件后进行充分测试

## 性能优化

模块化结构带来的好处：
- **按需加载**: 可以只加载需要的事件类型
- **更好的缓存**: 浏览器可以更有效地缓存单独的模块
- **并行开发**: 多人可以同时编辑不同的事件文件
- **易于维护**: 问题定位和修复更加容易