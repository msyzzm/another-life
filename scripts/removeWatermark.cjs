#!/usr/bin/env node

/**
 * 图片水印去除脚本
 * 
 * 功能：
 * 1. 扫描指定目录中的图片文件
 * 2. 去掉图片顶部的50像素（水印区域）
 * 3. 保存处理后的图片，可选择覆盖原文件或保存为新文件
 * 
 * 使用方法：
 * node scripts/removeWatermark.cjs [选项]
 * 
 * 选项：
 * --dir <目录>        指定图片目录（默认：public/assets/events）
 * --file <文件>       处理单个文件
 * --crop <像素>       要裁剪的顶部像素数（默认：50）
 * --suffix <后缀>     输出文件后缀（默认：覆盖原文件）
 * --rename-original   配合--suffix使用，将原文件改名，新文件使用原名
 * --help             显示帮助信息
 * 
 * 示例：
 * node scripts/removeWatermark.cjs                                    # 处理默认目录所有图片
 * node scripts/removeWatermark.cjs --file public/assets/events/test.png  # 处理单个文件
 * node scripts/removeWatermark.cjs --crop 60                         # 裁剪顶部60像素
 * node scripts/removeWatermark.cjs --suffix "_no_watermark"          # 保存为新文件
 * node scripts/removeWatermark.cjs --suffix "_original" --rename-original  # 原文件改名为test_original.png，新文件为test.png
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  DEFAULT_DIR: path.join(__dirname, '../public/assets/events'),
  DEFAULT_CROP_HEIGHT: 60,
  SUPPORTED_EXTENSIONS: ['.png', '.jpg', '.jpeg', '.webp'],
};

/**
 * 解析命令行参数
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    dir: CONFIG.DEFAULT_DIR,
    cropHeight: CONFIG.DEFAULT_CROP_HEIGHT,
    suffix: null,
    file: null,
    renameOriginal: false,
    deleteOriginal: false,
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--dir':
        if (nextArg) {
          options.dir = path.resolve(nextArg);
          i++;
        }
        break;
      case '--file':
        if (nextArg) {
          options.file = path.resolve(nextArg);
          i++;
        }
        break;
      case '--crop':
        if (nextArg) {
          options.cropHeight = parseInt(nextArg, 10);
          i++;
        }
        break;
      case '--suffix':
        if (nextArg) {
          options.suffix = nextArg;
          i++;
        }
        break;
      case '--rename-original':
        options.renameOriginal = true;
        break;
      case '--delete-original':
        options.deleteOriginal = true;
        break;
      case '--help':
        options.help = true;
        break;
    }
  }
  
  return options;
}

/**
 * 显示使用帮助
 */
function showHelp() {
  console.log(`
图片水印去除脚本

使用方法：
  node scripts/removeWatermark.cjs [选项]

选项：
  --dir <目录>        指定图片目录（默认：public/assets/events）
  --file <文件>       处理单个文件
  --crop <像素>       要裁剪的顶部像素数（默认：50）
  --suffix <后缀>     输出文件后缀（默认：覆盖原文件）
  --rename-original   配合--suffix使用，将原文件改名，新文件使用原名
  --delete-original   删除原文件
  --help             显示帮助信息

示例：
  node scripts/removeWatermark.cjs                                    # 处理默认目录所有图片
  node scripts/removeWatermark.cjs --file public/assets/events/test.png  # 处理单个文件
  node scripts/removeWatermark.cjs --crop 60                         # 裁剪顶部60像素
  node scripts/removeWatermark.cjs --suffix "_no_watermark"          # 保存为新文件
  node scripts/removeWatermark.cjs --suffix "_original" --rename-original  # 原文件改名为test_original.png，新文件为test.png
`);
}

/**
 * 检查文件是否为支持的图片格式
 */
function isSupportedImageFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return CONFIG.SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * 获取目录中的所有图片文件
 */
function getImageFiles(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      throw new Error(`目录不存在: ${dirPath}`);
    }
    
    const files = fs.readdirSync(dirPath);
    const imageFiles = files
      .filter(file => isSupportedImageFile(file))
      .map(file => path.join(dirPath, file));
    
    return imageFiles;
  } catch (error) {
    throw new Error(`读取目录失败: ${error.message}`);
  }
}

/**
 * 生成输出文件路径
 */
function getOutputPath(inputPath, suffix, renameOriginal = false) {
  if (!suffix) {
    return inputPath; // 覆盖原文件
  }
  
  const dir = path.dirname(inputPath);
  const ext = path.extname(inputPath);
  const name = path.basename(inputPath, ext);
  
  if (renameOriginal) {
    // 如果要重命名原文件，新文件使用原名，返回原路径
    return inputPath;
  } else {
    // 正常模式：新文件添加后缀
    return path.join(dir, `${name}${suffix}${ext}`);
  }
}

/**
 * 裁剪图片顶部像素
 */
async function cropImageTop(inputPath, outputPath, cropHeight) {
  try {
    // 检查sharp依赖
    let sharp;
    try {
      sharp = require('sharp');
    } catch (error) {
      throw new Error('缺少 sharp 依赖，请运行: npm install sharp');
    }
    
    console.log(`🖼️  处理图片: ${path.basename(inputPath)}`);
    
    // 获取图片信息
    const metadata = await sharp(inputPath).metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;
    
    // 检查裁剪高度是否合理
    if (cropHeight >= originalHeight) {
      throw new Error(`裁剪高度 (${cropHeight}px) 不能大于等于图片高度 (${originalHeight}px)`);
    }
    
    // 计算新的尺寸
    const newWidth = originalWidth;
    const newHeight = originalHeight - cropHeight;
    
    console.log(`   📏 原始尺寸: ${originalWidth}x${originalHeight}`);
    console.log(`   ✂️  裁剪顶部: ${cropHeight}px`);
    console.log(`   📐 新尺寸: ${newWidth}x${newHeight}`);
    
    // 使用sharp裁剪图片
    await sharp(inputPath)
      .extract({
        left: 0,
        top: cropHeight,
        width: newWidth,
        height: newHeight
      })
      .png()
      .toFile(outputPath);
    
    console.log(`   ✅ 保存到: ${path.basename(outputPath)}`);
    
    return {
      success: true,
      originalSize: { width: originalWidth, height: originalHeight },
      newSize: { width: newWidth, height: newHeight },
      croppedPixels: cropHeight
    };
    
  } catch (error) {
    console.error(`   ❌ 处理失败: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 处理单个文件
 */
async function processFile(filePath, options) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`);
  }
  
  if (!isSupportedImageFile(filePath)) {
    throw new Error(`不支持的文件格式: ${path.extname(filePath)}`);
  }
  
  // 检查参数组合的有效性
  if (options.renameOriginal && !options.suffix) {
    throw new Error('使用 --rename-original 参数时必须同时指定 --suffix 参数');
  }

  if (options.removeOriginal && !options.renameOriginal) {
    throw new Error('使用 --delete-original 参数时必须同时指定 --rename-original 参数');
  }
  
  let inputPath = filePath;
  const outputPath = getOutputPath(filePath, options.suffix, options.renameOriginal);
  
  // 如果需要重命名原文件
  if (options.renameOriginal && options.suffix) {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const name = path.basename(filePath, ext);
    const renamedPath = path.join(dir, `${name}${options.suffix}${ext}`);
    
    // 重命名原文件
    fs.renameSync(filePath, renamedPath);
    console.log(`📝 原文件已重命名: ${path.basename(filePath)} → ${path.basename(renamedPath)}`);
    
    // 使用重命名后的文件作为输入
    inputPath = renamedPath;
  }
  
  
  const res = await cropImageTop(inputPath, outputPath, options.cropHeight);
  if (options.deleteOriginal){
    fs.unlinkSync(inputPath);
    console.log(`🗑️  已删除原文件: ${path.basename(inputPath)}`);
  }
  return res;
}

/**
 * 处理目录中的所有图片
 */
async function processDirectory(dirPath, options) {
  const imageFiles = getImageFiles(dirPath);
  
  if (imageFiles.length === 0) {
    console.log(`📁 目录中没有找到支持的图片文件: ${dirPath}`);
    return [];
  }
  
  // 检查参数组合的有效性
  if (options.renameOriginal && !options.suffix) {
    throw new Error('使用 --rename-original 参数时必须同时指定 --suffix 参数');
  }
  
  console.log(`📁 找到 ${imageFiles.length} 个图片文件`);
  console.log('');
  
  const results = [];
  
  for (const filePath of imageFiles) {
    let inputPath = filePath;
    const outputPath = getOutputPath(filePath, options.suffix, options.renameOriginal);
    
    // 如果需要重命名原文件
    if (options.renameOriginal && options.suffix) {
      const dir = path.dirname(filePath);
      const ext = path.extname(filePath);
      const name = path.basename(filePath, ext);
      const renamedPath = path.join(dir, `${name}${options.suffix}${ext}`);
      
      // 重命名原文件
      fs.renameSync(filePath, renamedPath);
      console.log(`📝 原文件已重命名: ${path.basename(filePath)} → ${path.basename(renamedPath)}`);
      
      // 使用重命名后的文件作为输入
      inputPath = renamedPath;
    }
    
    const result = await cropImageTop(inputPath, outputPath, options.cropHeight);
    results.push({
      file: path.basename(filePath),
      ...result
    });
  }
  
  return results;
}

/**
 * 显示处理结果统计
 */
function showResults(results) {
  if (results.length === 0) {
    return;
  }
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log('');
  console.log('📊 处理结果统计:');
  console.log(`   ✅ 成功: ${successful.length} 个文件`);
  console.log(`   ❌ 失败: ${failed.length} 个文件`);
  
  if (failed.length > 0) {
    console.log('');
    console.log('❌ 失败的文件:');
    failed.forEach(result => {
      console.log(`   - ${result.file}: ${result.error}`);
    });
  }
  
  if (successful.length > 0) {
    const totalCropped = successful.reduce((sum, r) => sum + r.croppedPixels, 0);
    console.log('');
    console.log(`🎉 总共裁剪了 ${totalCropped} 像素的水印区域`);
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
    
    
    console.log('🎨 图片水印去除工具');
    console.log(`✂️  裁剪顶部: ${options.cropHeight} 像素`);
    
    let results = [];
    
    if (options.file) {
      // 处理单个文件
      console.log(`📄 处理单个文件: ${options.file}`);
      console.log('');
      
      const result = await processFile(options.file, options);
      results = [{
        file: path.basename(options.file),
        ...result
      }];
    } else {
      // 处理目录
      console.log(`📁 处理目录: ${options.dir}`);
      console.log('');
      
      results = await processDirectory(options.dir, options);
    }
    
    // 显示结果
    showResults(results);
    
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
  cropImageTop,
  processFile,
  processDirectory,
  CONFIG
};