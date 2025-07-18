# 事件图片生成脚本使用指南

## 📖 概述

本工具集提供了自动为 Another Life 游戏事件生成图片的功能，支持单个事件和批量处理。

## 🛠️ 功能特性

- ✅ **自动图片生成**: 基于事件描述调用AI图像生成API
- ✅ **本地图片保存**: 自动下载并保存到项目Assets目录
- ✅ **代码自动更新**: 自动更新事件文件中的图片链接
- ✅ **批量处理**: 支持一次性处理多个事件
- ✅ **并发控制**: 避免API限流，支持重试机制
- ✅ **进度显示**: 实时显示处理进度和结果统计

## 📋 前置要求

### 1. 环境要求
- Node.js (版本 12 或更高)
- 网络连接到图像生成API服务器

### 2. API服务配置
- **API地址**: `http://192.168.1.203:50085/v1/images/generations`
- **API文档**: https://github.com/LLM-Red-Team/jimeng-free-api
- **支持的模型**: dall-e-3
- **图片规格**: 1024x1024, PNG格式

### 3. 目录结构
确保以下目录存在：
```
项目根目录/
├── scripts/
│   ├── generateEventImages.js     # 单个事件处理脚本
│   ├── batchGenerateImages.js     # 批量处理脚本
│   ├── imageConfig.json          # 配置文件示例
│   └── README.md                 # 本文档
├── public/
│   └── assets/
│       └── events/               # 图片保存目录（自动创建）
└── src/
    └── eventSystem/
        └── events/               # 事件文件目录
```

## 🚀 使用方法

### 方法一：单个事件处理

#### 基本语法
```bash
node scripts/generateEventImages.js --event "事件名称" --file "事件文件路径"
```

#### 示例
```bash
# 为"森林探索"事件生成图片
node scripts/generateEventImages.js --event "森林探索" --file "src/eventSystem/events/randomEvents.ts"

# 为"神秘宝箱"事件生成图片
node scripts/generateEventImages.js --event "神秘宝箱" --file "src/eventSystem/events/dailyLifeEvents.ts"
```

#### 参数说明
- `--event`: 事件名称（必需），必须与事件文件中的name字段完全匹配
- `--file`: 事件文件路径（必需），相对于项目根目录
- `--help`: 显示帮助信息

### 方法二：批量处理（配置文件）

#### 1. 准备配置文件
创建或编辑 `scripts/imageConfig.json`：
```json
{
  "events": [
    {
      "name": "随机训练",
      "file": "src/eventSystem/events/randomEvents.ts"
    },
    {
      "name": "神秘宝箱",
      "file": "src/eventSystem/events/randomEvents.ts"
    },
    {
      "name": "技能练习",
      "file": "src/eventSystem/events/randomEvents.ts"
    }
  ]
}
```

#### 2. 执行批量处理
```bash
node scripts/batchGenerateImages.js --config "scripts/imageConfig.json"
```

### 方法三：批量处理（文件中所有事件）

```bash
# 为指定文件中的所有事件生成图片
node scripts/batchGenerateImages.js --file "src/eventSystem/events/randomEvents.ts" --all
```

## ⚙️ 配置选项

### API配置
在 `scripts/generateEventImages.js` 中可以修改以下配置：

```javascript
const CONFIG = {
  // 图像生成API配置
  API_BASE_URL: 'http://192.168.1.203:50085',
  API_ENDPOINT: '/v1/images/generations',
  
  // 项目配置
  ASSETS_DIR: path.join(__dirname, '../public/assets/events'),
  
  // 图像生成参数
  IMAGE_CONFIG: {
    model: 'dall-e-3',
    prompt: '',
    n: 1,
    size: '1024x1024',      // 可选: '256x256', '512x512', '1024x1024'
    quality: 'standard',    // 可选: 'standard', 'hd'
    style: 'vivid'         // 可选: 'vivid', 'natural'
  }
};
```

### 批量处理配置
在 `scripts/batchGenerateImages.js` 中可以修改：

```javascript
const BATCH_CONFIG = {
  MAX_CONCURRENT: 2,        // 最大并发数（建议1-3）
  DELAY_BETWEEN_REQUESTS: 3000, // 请求间隔（毫秒）
  MAX_RETRIES: 3,          // 最大重试次数
  RETRY_DELAY: 5000,       // 重试延迟（毫秒）
};
```

## 📝 工作流程

### 单个事件处理流程
1. **读取事件文件** - 解析TypeScript/JavaScript事件文件
2. **查找目标事件** - 根据事件名称定位事件定义
3. **提取事件描述** - 获取description字段作为图像提示词
4. **生成图像提示词** - 结合事件信息创建AI提示词
5. **调用API生成图片** - 发送请求到图像生成服务
6. **下载图片** - 保存图片到本地Assets目录
7. **更新事件文件** - 自动添加或更新imageUrl和imageAlt字段

### 批量处理流程
1. **读取配置** - 解析配置文件或提取文件中所有事件
2. **并发控制** - 按配置的并发数分批处理
3. **进度跟踪** - 实时显示处理进度
4. **错误处理** - 自动重试失败的请求
5. **结果统计** - 显示成功/失败统计信息

## 🎨 图像提示词生成

脚本会自动将事件描述转换为适合AI图像生成的提示词：

### 原始事件描述
```typescript
description: '你在茂密的森林中发现了一条隐秘的小径，不知通向何方...'
```

### 生成的图像提示词
```
Create a fantasy game event illustration for "森林探索". 你在茂密的森林中发现了一条隐秘的小径，不知通向何方.... 
Style: Digital art, fantasy game illustration, detailed, atmospheric, suitable for a life simulation RPG game. 
High quality, professional game art style, 16:9 aspect ratio.
```

## 📁 文件结构变化

### 处理前的事件定义
```typescript
{
  id: 'forest_exploration',
  type: 'custom',
  name: '森林探索',
  description: '你在茂密的森林中发现了一条隐秘的小径，不知通向何方...',
  conditions: [...],
  outcomes: [...]
}
```

### 处理后的事件定义
```typescript
{
  id: 'forest_exploration',
  type: 'custom',
  name: '森林探索',
  description: '你在茂密的森林中发现了一条隐秘的小径，不知通向何方...',
  imageUrl: '/assets/events/森林探索.png',
  imageAlt: '森林探索',
  conditions: [...],
  outcomes: [...]
}
```

### 生成的文件
```
public/assets/events/
├── 森林探索.png
├── 神秘宝箱.png
├── 随机训练.png
└── ...
```

## 🔧 故障排除

### 常见错误及解决方案

#### 1. API连接失败
```
❌ 错误: API请求失败: connect ECONNREFUSED 192.168.1.203:50085
```
**解决方案**:
- 检查API服务器是否运行
- 确认IP地址和端口号正确
- 检查网络连接

#### 2. 事件未找到
```
❌ 错误: 未找到名称为 "事件名称" 的事件
```
**解决方案**:
- 确认事件名称与文件中的name字段完全匹配
- 检查事件文件路径是否正确
- 确认事件文件格式正确

#### 3. 文件权限错误
```
❌ 错误: EACCES: permission denied, mkdir '/path/to/assets'
```
**解决方案**:
- 检查目录写入权限
- 使用管理员权限运行脚本
- 手动创建assets/events目录

#### 4. API限流
```
❌ 错误: API请求失败，状态码: 429
```
**解决方案**:
- 增加请求间隔时间
- 减少并发数量
- 等待一段时间后重试

### 调试模式

在脚本中添加调试信息：
```javascript
// 在CONFIG中添加
DEBUG: true
```

## 📊 性能建议

### 1. 并发控制
- **推荐并发数**: 1-2个请求
- **请求间隔**: 3-5秒
- **避免**: 过高的并发可能导致API限流

### 2. 批量处理策略
- **小批量**: 每次处理5-10个事件
- **分时段**: 避免在高峰期大量请求
- **监控**: 观察API响应时间和成功率

### 3. 网络优化
- **稳定连接**: 确保网络连接稳定
- **重试机制**: 利用内置的重试功能
- **超时设置**: 适当的请求超时时间

## 🔒 安全注意事项

1. **API密钥**: 如果API需要密钥，不要在代码中硬编码
2. **网络安全**: 确保API服务器的安全性
3. **文件权限**: 合理设置生成文件的权限
4. **数据备份**: 处理前备份重要的事件文件

## 📞 技术支持

如果遇到问题，请检查：

1. **日志输出**: 脚本会输出详细的处理日志
2. **API文档**: 参考 https://github.com/LLM-Red-Team/jimeng-free-api
3. **网络状态**: 确认能够访问API服务器
4. **文件格式**: 确认事件文件格式正确

## 🎯 最佳实践

1. **测试先行**: 先用单个事件测试，确认配置正确
2. **备份文件**: 批量处理前备份事件文件
3. **分批处理**: 大量事件分批处理，避免长时间运行
4. **监控进度**: 关注处理进度和错误信息
5. **定期清理**: 定期清理不需要的图片文件

---

通过本工具，您可以快速为游戏事件生成高质量的插图，提升游戏的视觉体验！