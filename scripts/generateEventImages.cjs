#!/usr/bin/env node

/**
 * 事件图片生成脚本
 * 
 * 功能：
 * 1. 读取指定的事件文件
 * 2. 根据事件名称查找事件
 * 3. 使用事件描述作为提示词调用图像生成API（使用环境变量中的API token）
 * 4. 下载生成的图片到项目Assets目录
 * 5. 更新事件文件中的图片链接
 * 
 * 需要设置的环境变量:
 * - IMAGE_API_TOKEN: 图像生成API的认证令牌
 * 
 * 使用方法：
 * node scripts/generateEventImages.js --event "事件名称" --file "事件文件路径"
 * 
 * 需要先设置环境变量:
 * - IMAGE_API_TOKEN: 图像生成API的认证令牌
 * 
 * 示例：
 * IMAGE_API_TOKEN=your_token_here node scripts/generateEventImages.js --event "森林探索" --file "src/eventSystem/events/randomEvents.ts"
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');
require('dotenv').config();

// 配置
const CONFIG = {
  // 图像生成API配置
  API_BASE_URL: 'http://192.168.1.203:50085',
  API_ENDPOINT: '/v1/images/generations',
  API_TOKEN: 'default-token-if-not-set', // New field for API token
  
  // 项目配置
  ASSETS_DIR: path.join(__dirname, '../public/assets/events'),
  
  // 图像生成参数
  IMAGE_CONFIG: {
    model: 'jimeng-3.0',
    prompt: '',
    apiToken: process.env.IMAGE_API_TOKEN
  }
};

/**
 * 解析命令行参数
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    options[key] = value;
  }
  
  return options;
}

/**
 * 显示使用帮助
 */
function showHelp() {
  console.log(`
事件图片生成脚本

使用方法：
  node scripts/generateEventImages.js --event "事件名称" --file "事件文件路径"

参数：
  --event    事件名称（必需）
  --file     事件文件路径（必需）
  --help     显示此帮助信息

示例：
  node scripts/generateEventImages.js --event "森林探索" --file "src/eventSystem/events/randomEvents.ts"
  node scripts/generateEventImages.js --event "神秘宝箱" --file "src/eventSystem/events/dailyLifeEvents.ts"
`);
}

/**
 * 读取事件文件内容
 */
function readEventFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`事件文件不存在: ${fullPath}`);
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    console.log(`✅ 成功读取事件文件: ${filePath}`);
    return content;
  } catch (error) {
    throw new Error(`读取事件文件失败: ${error.message}`);
  }
}

/**
 * 从文件内容中查找指定事件
 */
function findEventInContent(content, eventName) {
  // 使用正则表达式查找事件定义
  const eventPattern = new RegExp(
    `{[^}]*name:\\s*['"\`]${eventName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`][^}]*}`,
    'gs'
  );
  
  const matches = content.match(eventPattern);
  if (!matches || matches.length === 0) {
    throw new Error(`未找到名称为 "${eventName}" 的事件`);
  }
  
  if (matches.length > 1) {
    console.warn(`⚠️  找到多个名称为 "${eventName}" 的事件，使用第一个`);
  }
  
  const eventText = matches[0];
  
  // 提取事件描述
  const descriptionMatch = eventText.match(/description:\s*['"`]([^'"`]+)['"`]/);
  if (!descriptionMatch) {
    throw new Error(`事件 "${eventName}" 缺少描述字段`);
  }
  
  const description = descriptionMatch[1];
  console.log(`✅ 找到事件: ${eventName}`);
  console.log(`\n📝 事件描述: ${description}`);
  
  // 检查环境变量是否存在
  if (!process.env.IMAGE_API_TOKEN) {
    console.error('❌ 错误: IMAGE_API_TOKEN 环境变量未设置');
    showHelp();
    process.exit(1);
  }
  
  return {
    eventText,
    description,
    name: eventName
  };
}

/**
 * 生成图像提示词
 */
function generateImagePrompt(eventDescription, eventName) {
  // 基础提示词模板
  const basePrompt = `Create a fantasy game event illustration for "${eventDescription}".
Style: Digital art, fantasy game illustration, detailed, atmospheric, suitable for a life simulation RPG game. 
High quality, professional game art style. Don't include any copyright notice / any watermark / any other text.`;
  
  console.log(`🎨 生成的图像提示词: ${basePrompt}`);
  return basePrompt;
}

/**
 * 调用图像生成API
 */
async function generateImage(prompt) {
  return new Promise((resolve, reject) => {
    const requestData = {
      model: CONFIG.IMAGE_CONFIG.model,
      prompt: prompt,
      // 其他参数可以根据需要添加
    };
    
    const postData = JSON.stringify(requestData);
    
    const options = {
      hostname: new URL(CONFIG.API_BASE_URL).hostname,
      port: new URL(CONFIG.API_BASE_URL).port || (new URL(CONFIG.API_BASE_URL).protocol === 'https:' ? 443 : 80),
      path: CONFIG.API_ENDPOINT,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.IMAGE_CONFIG.apiToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    console.log(`🚀 正在调用图像生成API...`);
    console.log(`📡 API地址: ${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINT}`);
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            throw new Error(`API请求失败，状态码: ${res.statusCode}, 响应: ${data}`);
          }
          
          const response = JSON.parse(data);
          console.log(`✅ API调用成功`);
          
          if (!response.data || !response.data[0] || !response.data[0].url) {
            throw new Error(`API响应格式错误: ${JSON.stringify(response)}`);
          }
          
          const imageUrl = response.data[0].url;
          console.log(`🖼️  图片URL1: ${imageUrl}`);
          const imageUrl2 = response.data[1].url;
          console.log(`🖼️  图片URL2: ${imageUrl2}`);
          const imageUrl3 = response.data[2].url;
          console.log(`🖼️  图片URL3: ${imageUrl3}`);
          const imageUrl4 = response.data[3].url;
          console.log(`🖼️  图片URL4: ${imageUrl4}`);
          resolve([imageUrl, imageUrl2, imageUrl3, imageUrl4]);
          resolve(imageUrl);
        } catch (error) {
          reject(new Error(`解析API响应失败: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`API请求失败: ${error.message}`));
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * 下载图片到本地
 */
async function downloadImage(imageUrl, eventName) {
  return new Promise((resolve, reject) => {
    // 确保assets目录存在
    if (!fs.existsSync(CONFIG.ASSETS_DIR)) {
      fs.mkdirSync(CONFIG.ASSETS_DIR, { recursive: true });
      console.log(`📁 创建目录: ${CONFIG.ASSETS_DIR}`);
    }
    
    // 生成文件名
    const fileName = `${eventName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.png`;
    const filePath = path.join(CONFIG.ASSETS_DIR, fileName);
    
    console.log(`⬇️  正在下载图片: ${imageUrl}`);
    console.log(`💾 保存路径: ${filePath}`);
    
    const url = new URL(imageUrl);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const file = fs.createWriteStream(filePath);
    
    protocol.get(imageUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`下载失败，状态码: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ 图片下载完成: ${fileName}`);
        
        // 返回相对于public目录的路径
        const relativePath = `/assets/events/${fileName}`;
        resolve(relativePath);
      });
    }).on('error', (error) => {
      fs.unlink(filePath, () => {}); // 删除不完整的文件
      reject(new Error(`下载图片失败: ${error.message}`));
    });
  });
}

/**
 * 更新事件文件中的图片链接
 */
function updateEventFile(filePath, eventText, eventName, imagePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 检查事件是否已有图片URL
    const hasImageUrl = eventText.includes('imageUrl:');
    const hasImageAlt = eventText.includes('imageAlt:');
    
    let updatedEventText;
    
    if (hasImageUrl) {
      // 更新现有的imageUrl
      updatedEventText = eventText.replace(
        /imageUrl:\s*['"`][^'"`]*['"`]/,
        `imageUrl: '${imagePath}'`
      );
      console.log(`🔄 更新现有图片链接`);
    } else {
      // 添加新的imageUrl和imageAlt
      // 在description后面添加图片字段
      updatedEventText = eventText.replace(
        /(description:\s*['"`][^'"`]*['"`],?)/,
        `$1\n    imageUrl: '${imagePath}',\n    imageAlt: '${eventName}',`
      );
      console.log(`➕ 添加新的图片链接`);
    }
    
    if (!hasImageAlt && hasImageUrl) {
      // 如果有imageUrl但没有imageAlt，添加imageAlt
      updatedEventText = updatedEventText.replace(
        /(imageUrl:\s*['"`][^'"`]*['"`],?)/,
        `$1\n    imageAlt: '${eventName}',`
      );
    }
    
    // 替换文件内容
    const updatedContent = content.replace(eventText, updatedEventText);
    
    // 写入文件
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`✅ 事件文件更新完成: ${filePath}`);
    
    return true;
  } catch (error) {
    throw new Error(`更新事件文件失败: ${error.message}`);
  }
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
    
    // 验证必需参数
    if (!options.event || !options.file) {
      console.error('❌ 错误: 缺少必需参数');
      showHelp();
      process.exit(1);
    }
    
    // 设置配置中的API token
    CONFIG.IMAGE_CONFIG.apiToken = process.env.IMAGE_API_TOKEN;
    
    // 验证配置
    if (!CONFIG.IMAGE_CONFIG.apiToken) {
      console.error('❌ 错误: API token 未在配置中正确设置');
      showHelp();
      process.exit(1);
    }
    
    const eventName = options.event;
    const filePath = options.file;
    
    console.log(`🎯 开始为事件 \"${eventName}\" 生成图片`);
    console.log(`📂 事件文件: ${filePath}`);
    console.log('');
    
    // 1. 读取事件文件
    const fileContent = readEventFile(filePath);
    
    // 2. 查找指定事件
    const eventInfo = findEventInContent(fileContent, eventName);
    
    // 3. 生成图像提示词
    const prompt = generateImagePrompt(eventInfo.description, eventName);
    
    // 4. 调用图像生成API
    const imageUrls = await generateImage(prompt);
    
    // 5. 下载图片
    let localImagePath;
    for(let i = 0; i < imageUrls.length; i++){
      localImagePath = await downloadImage(imageUrls[i], eventName + (i>0?i:''));
    }

    // 6. 更新事件文件
    updateEventFile(filePath, eventInfo.eventText, eventName, localImagePath);
    
    console.log('');
    console.log(`🎉 任务完成！`);
    console.log(`📸 图片已保存: ${localImagePath}`);
    console.log(`📝 事件文件已更新: ${filePath}`);
    
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
  generateImageForEvent: main,
  CONFIG
};