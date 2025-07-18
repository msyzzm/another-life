#!/usr/bin/env node

/**
 * 快速启动脚本
 * 
 * 提供交互式界面，帮助用户快速开始生成事件图片
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * 提问函数
 */
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

/**
 * 显示欢迎信息
 */
function showWelcome() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    事件图片生成工具                          ║
║                     快速启动向导                            ║
╚══════════════════════════════════════════════════════════════╝

🎨 本工具可以为您的游戏事件自动生成精美的插图
📸 支持单个事件和批量处理
🚀 让我们开始吧！

`);
}

/**
 * 检查环境
 */
function checkEnvironment() {
  console.log('🔍 正在检查环境...');
  
  // 检查Node.js版本
  const nodeVersion = process.version;
  console.log(`✅ Node.js版本: ${nodeVersion}`);
  
  // 检查必要的目录
  const scriptsDir = path.join(__dirname);
  const assetsDir = path.join(__dirname, '../public/assets/events');
  
  if (!fs.existsSync(scriptsDir)) {
    console.log('❌ scripts目录不存在');
    return false;
  }
  
  // 创建assets目录（如果不存在）
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log(`✅ 创建assets目录: ${assetsDir}`);
  } else {
    console.log(`✅ assets目录已存在: ${assetsDir}`);
  }
  
  // 检查脚本文件
  const requiredFiles = [
    'generateEventImages.cjs',
    'batchGenerateImages.cjs',
    'imageConfig.json'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(scriptsDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} 存在`);
    } else {
      console.log(`❌ ${file} 不存在`);
      return false;
    }
  }
  
  console.log('✅ 环境检查通过\n');
  return true;
}

/**
 * 扫描事件文件
 */
function scanEventFiles() {
  const eventDirs = [
    'src/eventSystem/events',
    'src/events'
  ];
  
  const eventFiles = [];
  
  for (const dir of eventDirs) {
    const fullDir = path.join(__dirname, '..', dir);
    if (fs.existsSync(fullDir)) {
      const files = fs.readdirSync(fullDir);
      for (const file of files) {
        if (file.endsWith('.ts') || file.endsWith('.js')) {
          eventFiles.push(path.join(dir, file));
        }
      }
    }
  }
  
  return eventFiles;
}

/**
 * 从文件中提取事件名称
 */
function extractEventNames(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    const nameMatches = content.match(/name:\s*['"`]([^'"`]+)['"`]/g);
    if (!nameMatches) return [];
    
    return nameMatches.map(match => {
      const nameMatch = match.match(/name:\s*['"`]([^'"`]+)['"`]/);
      return nameMatch ? nameMatch[1] : null;
    }).filter(Boolean);
  } catch (error) {
    return [];
  }
}

/**
 * 显示菜单
 */
async function showMenu() {
  console.log('📋 请选择操作模式:');
  console.log('1. 单个事件处理');
  console.log('2. 批量处理（配置文件）');
  console.log('3. 批量处理（文件中所有事件）');
  console.log('4. 查看事件列表');
  console.log('5. 测试API连接');
  console.log('6. 退出');
  console.log('');
  
  const choice = await question('请输入选项 (1-6): ');
  return choice.trim();
}

/**
 * 单个事件处理
 */
async function handleSingleEvent() {
  console.log('\n📝 单个事件处理模式');
  console.log('');
  
  // 扫描事件文件
  const eventFiles = scanEventFiles();
  if (eventFiles.length === 0) {
    console.log('❌ 未找到事件文件');
    return;
  }
  
  // 显示事件文件列表
  console.log('📂 可用的事件文件:');
  eventFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
  });
  console.log('');
  
  const fileChoice = await question('请选择事件文件 (输入序号): ');
  const fileIndex = parseInt(fileChoice) - 1;
  
  if (fileIndex < 0 || fileIndex >= eventFiles.length) {
    console.log('❌ 无效的文件选择');
    return;
  }
  
  const selectedFile = eventFiles[fileIndex];
  console.log(`✅ 选择的文件: ${selectedFile}`);
  
  // 提取事件名称
  const eventNames = extractEventNames(selectedFile);
  if (eventNames.length === 0) {
    console.log('❌ 文件中未找到事件');
    return;
  }
  
  // 显示事件列表
  console.log('\n🎯 文件中的事件:');
  eventNames.forEach((name, index) => {
    console.log(`${index + 1}. ${name}`);
  });
  console.log('');
  
  const eventChoice = await question('请选择事件 (输入序号): ');
  const eventIndex = parseInt(eventChoice) - 1;
  
  if (eventIndex < 0 || eventIndex >= eventNames.length) {
    console.log('❌ 无效的事件选择');
    return;
  }
  
  const selectedEvent = eventNames[eventIndex];
  console.log(`✅ 选择的事件: ${selectedEvent}`);
  
  // 确认执行
  const confirm = await question('\n确认生成图片? (y/N): ');
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log('❌ 操作已取消');
    return;
  }
  
  // 执行命令
  console.log('\n🚀 开始生成图片...');
  const { spawn } = require('child_process');
  
  const child = spawn('node', [
    'scripts/generateEventImages.cjs',
    '--event', selectedEvent,
    '--file', selectedFile
  ], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  child.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ 图片生成完成！');
    } else {
      console.log('\n❌ 图片生成失败');
    }
  });
}

/**
 * 批量处理（配置文件）
 */
async function handleBatchConfig() {
  console.log('\n📦 批量处理模式（配置文件）');
  
  const configPath = path.join(__dirname, 'imageConfig.json');
  if (!fs.existsSync(configPath)) {
    console.log('❌ 配置文件不存在: imageConfig.json');
    return;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log(`📋 配置文件中有 ${config.events.length} 个事件:`);
    
    config.events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.name} (${event.file})`);
    });
    
    const confirm = await question('\n确认批量生成图片? (y/N): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ 操作已取消');
      return;
    }
    
    // 执行批量处理
    console.log('\n🚀 开始批量生成图片...');
    const { spawn } = require('child_process');
    
    const child = spawn('node', [
      'scripts/batchGenerateImages.cjs',
      '--config', 'scripts/imageConfig.json'
    ], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ 批量生成完成！');
      } else {
        console.log('\n❌ 批量生成失败');
      }
    });
    
  } catch (error) {
    console.log(`❌ 读取配置文件失败: ${error.message}`);
  }
}

/**
 * 批量处理（文件中所有事件）
 */
async function handleBatchAll() {
  console.log('\n📦 批量处理模式（文件中所有事件）');
  
  const eventFiles = scanEventFiles();
  if (eventFiles.length === 0) {
    console.log('❌ 未找到事件文件');
    return;
  }
  
  console.log('📂 可用的事件文件:');
  eventFiles.forEach((file, index) => {
    const eventNames = extractEventNames(file);
    console.log(`${index + 1}. ${file} (${eventNames.length} 个事件)`);
  });
  console.log('');
  
  const fileChoice = await question('请选择事件文件 (输入序号): ');
  const fileIndex = parseInt(fileChoice) - 1;
  
  if (fileIndex < 0 || fileIndex >= eventFiles.length) {
    console.log('❌ 无效的文件选择');
    return;
  }
  
  const selectedFile = eventFiles[fileIndex];
  const eventNames = extractEventNames(selectedFile);
  
  console.log(`✅ 选择的文件: ${selectedFile}`);
  console.log(`📋 将处理 ${eventNames.length} 个事件:`);
  eventNames.forEach((name, index) => {
    console.log(`  ${index + 1}. ${name}`);
  });
  
  const confirm = await question('\n确认批量生成图片? (y/N): ');
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log('❌ 操作已取消');
    return;
  }
  
  // 执行批量处理
  console.log('\n🚀 开始批量生成图片...');
  const { spawn } = require('child_process');
  
  const child = spawn('node', [
    'scripts/batchGenerateImages.cjs',
    '--file', selectedFile,
    '--all'
  ], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  child.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ 批量生成完成！');
    } else {
      console.log('\n❌ 批量生成失败');
    }
  });
}

/**
 * 查看事件列表
 */
function showEventList() {
  console.log('\n📋 事件列表');
  console.log('='.repeat(50));
  
  const eventFiles = scanEventFiles();
  if (eventFiles.length === 0) {
    console.log('❌ 未找到事件文件');
    return;
  }
  
  eventFiles.forEach((file, fileIndex) => {
    console.log(`\n📂 文件 ${fileIndex + 1}: ${file}`);
    const eventNames = extractEventNames(file);
    
    if (eventNames.length === 0) {
      console.log('  (无事件)');
    } else {
      eventNames.forEach((name, eventIndex) => {
        console.log(`  ${eventIndex + 1}. ${name}`);
      });
    }
  });
  
  console.log('\n' + '='.repeat(50));
}

/**
 * 测试API连接
 */
async function testApiConnection() {
  console.log('\n🔗 测试API连接');
  
  const http = require('http');
  const apiUrl = 'http://192.168.1.203:50085';
  
  console.log(`📡 正在连接: ${apiUrl}`);
  
  try {
    const testData = JSON.stringify({
      model: 'jimeng-3.0',
      prompt: 'test connection'
    });
    
    const options = {
      hostname: '192.168.1.203',
      port: 50085,
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData)
      },
      timeout: 10000,
    };
    
    const req = http.request(options, (res) => {
      console.log(`✅ 连接成功，状态码: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        console.log('🎉 API服务正常运行');
      } else {
        console.log('⚠️  API返回非200状态码，可能存在问题');
      }
    });
    
    req.on('error', (error) => {
      console.log(`❌ 连接失败: ${error.message}`);
      console.log('💡 请检查:');
      console.log('   - API服务器是否运行');
      console.log('   - IP地址和端口是否正确');
      console.log('   - 网络连接是否正常');
    });
    
    req.on('timeout', () => {
      console.log('❌ 连接超时');
      req.destroy();
    });
    
    // 不实际发送请求，只测试连接
    req.end();
    
  } catch (error) {
    console.log(`❌ 测试失败: ${error.message}`);
  }
}

/**
 * 主函数
 */
async function main() {
  showWelcome();
  
  if (!checkEnvironment()) {
    console.log('❌ 环境检查失败，请检查安装');
    rl.close();
    return;
  }
  
  while (true) {
    try {
      const choice = await showMenu();
      
      switch (choice) {
        case '1':
          await handleSingleEvent();
          break;
        case '2':
          await handleBatchConfig();
          break;
        case '3':
          await handleBatchAll();
          break;
        case '4':
          showEventList();
          break;
        case '5':
          await testApiConnection();
          break;
        case '6':
          console.log('\n👋 再见！');
          rl.close();
          return;
        default:
          console.log('❌ 无效的选择，请重新输入');
      }
      
      if (choice !== '4' && choice !== '5') {
        const continueChoice = await question('\n按回车键继续...');
      }
      
    } catch (error) {
      console.log(`❌ 错误: ${error.message}`);
    }
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };