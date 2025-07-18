#!/usr/bin/env node

/**
 * 批量事件图片生成脚本
 * 
 * 功能：
 * 1. 读取配置文件中的事件列表
 * 2. 批量为多个事件生成图片
 * 3. 支持并发控制，避免API限流
 * 4. 提供进度显示和错误处理
 * 
 * 使用方法：
 * node scripts/batchGenerateImages.js --config "scripts/imageConfig.json"
 * node scripts/batchGenerateImages.js --file "src/eventSystem/events/randomEvents.ts" --all
 */

const fs = require('fs');
const path = require('path');
const { generateImageForEvent } = require('./generateEventImages.cjs');

// 配置
const BATCH_CONFIG = {
  // 并发控制
  MAX_CONCURRENT: 2,        // 最大并发数
  DELAY_BETWEEN_REQUESTS: 3000, // 请求间隔（毫秒）
  
  // 重试配置
  MAX_RETRIES: 3,          // 最大重试次数
  RETRY_DELAY: 5000,       // 重试延迟（毫秒）
};

/**
 * 解析命令行参数
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '');
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('--')) {
        options[key] = nextArg;
        i++; // 跳过下一个参数
      } else {
        options[key] = true; // 布尔标志
      }
    }
  }
  
  return options;
}

/**
 * 显示使用帮助
 */
function showHelp() {
  console.log(`
批量事件图片生成脚本

使用方法：
  node scripts/batchGenerateImages.js --config "配置文件路径"
  node scripts/batchGenerateImages.js --file "事件文件路径" --all

参数：
  --config   配置文件路径（JSON格式）
  --file     事件文件路径
  --all      为文件中所有事件生成图片（与--file配合使用）
  --help     显示此帮助信息

配置文件格式（JSON）：
{
  "events": [
    {
      "name": "事件名称",
      "file": "事件文件路径"
    }
  ]
}

示例：
  node scripts/batchGenerateImages.js --config "scripts/imageConfig.json"
  node scripts/batchGenerateImages.js --file "src/eventSystem/events/randomEvents.ts" --all
`);
}

/**
 * 读取配置文件
 */
function readConfig(configPath) {
  try {
    const fullPath = path.resolve(configPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`配置文件不存在: ${fullPath}`);
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const config = JSON.parse(content);
    
    if (!config.events || !Array.isArray(config.events)) {
      throw new Error('配置文件格式错误：缺少events数组');
    }
    
    console.log(`✅ 成功读取配置文件: ${configPath}`);
    console.log(`📋 找到 ${config.events.length} 个事件配置`);
    
    return config;
  } catch (error) {
    throw new Error(`读取配置文件失败: ${error.message}`);
  }
}

/**
 * 从事件文件中提取所有事件名称
 */
function extractAllEventNames(filePath) {
  try {
    const content = fs.readFileSync(path.resolve(filePath), 'utf8');
    
    // 使用正则表达式匹配所有事件的name字段
    const nameMatches = content.match(/name:\s*['"`]([^'"`]+)['"`]/g);
    
    if (!nameMatches) {
      throw new Error(`在文件 ${filePath} 中未找到任何事件`);
    }
    
    const eventNames = nameMatches.map(match => {
      const nameMatch = match.match(/name:\s*['"`]([^'"`]+)['"`]/);
      return nameMatch ? nameMatch[1] : null;
    }).filter(Boolean);
    
    console.log(`📋 在文件 ${filePath} 中找到 ${eventNames.length} 个事件:`);
    eventNames.forEach((name, index) => {
      console.log(`  ${index + 1}. ${name}`);
    });
    
    return eventNames.map(name => ({
      name: name,
      file: filePath
    }));
  } catch (error) {
    throw new Error(`提取事件名称失败: ${error.message}`);
  }
}

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 生成单个事件图片（带重试）
 */
async function generateImageWithRetry(eventConfig, retryCount = 0) {
  try {
    console.log(`\n🎯 正在处理事件: ${eventConfig.name}`);
    console.log(`📂 文件: ${eventConfig.file}`);
    
    // 模拟命令行参数
    const originalArgv = process.argv;
    process.argv = [
      'node',
      'scripts/generateEventImages.js',
      '--event', eventConfig.name,
      '--file', eventConfig.file
    ];
    
    // 调用单个事件生成函数
    await generateImageForEvent();
    
    // 恢复原始参数
    process.argv = originalArgv;
    
    console.log(`✅ 事件 "${eventConfig.name}" 处理完成`);
    return { success: true, event: eventConfig.name };
    
  } catch (error) {
    console.error(`❌ 事件 "${eventConfig.name}" 处理失败: ${error.message}`);
    
    if (retryCount < BATCH_CONFIG.MAX_RETRIES) {
      console.log(`🔄 第 ${retryCount + 1} 次重试，等待 ${BATCH_CONFIG.RETRY_DELAY / 1000} 秒...`);
      await delay(BATCH_CONFIG.RETRY_DELAY);
      return generateImageWithRetry(eventConfig, retryCount + 1);
    } else {
      console.error(`💥 事件 "${eventConfig.name}" 重试次数已达上限，跳过`);
      return { success: false, event: eventConfig.name, error: error.message };
    }
  }
}

/**
 * 批量处理事件
 */
async function batchProcess(eventConfigs) {
  const results = {
    total: eventConfigs.length,
    success: 0,
    failed: 0,
    errors: []
  };
  
  console.log(`\n🚀 开始批量处理 ${eventConfigs.length} 个事件`);
  console.log(`⚙️  并发数: ${BATCH_CONFIG.MAX_CONCURRENT}`);
  console.log(`⏱️  请求间隔: ${BATCH_CONFIG.DELAY_BETWEEN_REQUESTS / 1000} 秒`);
  console.log('');
  
  // 分批处理，控制并发
  for (let i = 0; i < eventConfigs.length; i += BATCH_CONFIG.MAX_CONCURRENT) {
    const batch = eventConfigs.slice(i, i + BATCH_CONFIG.MAX_CONCURRENT);
    
    console.log(`📦 处理批次 ${Math.floor(i / BATCH_CONFIG.MAX_CONCURRENT) + 1}/${Math.ceil(eventConfigs.length / BATCH_CONFIG.MAX_CONCURRENT)}`);
    
    // 并发处理当前批次
    const batchPromises = batch.map(eventConfig => generateImageWithRetry(eventConfig));
    const batchResults = await Promise.all(batchPromises);
    
    // 统计结果
    batchResults.forEach(result => {
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push({
          event: result.event,
          error: result.error
        });
      }
    });
    
    // 显示进度
    const progress = Math.round(((i + batch.length) / eventConfigs.length) * 100);
    console.log(`📊 进度: ${results.success + results.failed}/${results.total} (${progress}%)`);
    
    // 如果不是最后一批，等待一段时间
    if (i + BATCH_CONFIG.MAX_CONCURRENT < eventConfigs.length) {
      console.log(`⏳ 等待 ${BATCH_CONFIG.DELAY_BETWEEN_REQUESTS / 1000} 秒后处理下一批...`);
      await delay(BATCH_CONFIG.DELAY_BETWEEN_REQUESTS);
    }
  }
  
  return results;
}

/**
 * 显示处理结果
 */
function showResults(results) {
  console.log('\n' + '='.repeat(50));
  console.log('📊 批量处理结果统计');
  console.log('='.repeat(50));
  console.log(`总计: ${results.total} 个事件`);
  console.log(`✅ 成功: ${results.success} 个`);
  console.log(`❌ 失败: ${results.failed} 个`);
  console.log(`📈 成功率: ${Math.round((results.success / results.total) * 100)}%`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ 失败的事件:');
    results.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.event}: ${error.error}`);
    });
  }
  
  console.log('\n🎉 批量处理完成！');
}

/**
 * 主函数
 */
async function main() {
  try {
    const options = parseArguments();
    
    // 检查帮助参数
    if (options.help) {
      showHelp();
      return;
    }
    
    let eventConfigs = [];
    
    if (options.config) {
      // 从配置文件读取
      const config = readConfig(options.config);
      eventConfigs = config.events;
    } else if (options.file && options.all) {
      // 从事件文件提取所有事件
      eventConfigs = extractAllEventNames(options.file);
    } else {
      console.error('❌ 错误: 请指定配置文件或事件文件');
      showHelp();
      process.exit(1);
    }
    
    if (eventConfigs.length === 0) {
      console.error('❌ 错误: 没有找到要处理的事件');
      process.exit(1);
    }
    
    // 验证事件配置
    for (const config of eventConfigs) {
      if (!config.name || !config.file) {
        throw new Error(`事件配置格式错误: ${JSON.stringify(config)}`);
      }
    }
    
    // 开始批量处理
    const results = await batchProcess(eventConfigs);
    
    // 显示结果
    showResults(results);
    
    // 根据结果设置退出码
    process.exit(results.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error(`❌ 错误: ${error.message}`);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  batchProcess,
  BATCH_CONFIG
};