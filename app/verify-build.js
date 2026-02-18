#!/usr/bin/env node

// 构建验证脚本
// 检查构建产物中的环境变量是否正确

import { resolve } from 'path';
import { existsSync, readFileSync, readdirSync } from 'fs';

console.log('🔍 验证构建产物...');

const distPath = resolve('./dist');
if (!existsSync(distPath)) {
  console.error('❌ 错误: dist 目录不存在，请先运行构建');
  process.exit(1);
}

// 检查 index.html
const indexPath = resolve(distPath, 'index.html');
if (existsSync(indexPath)) {
  const indexContent = readFileSync(indexPath, 'utf8');
  console.log('📄 检查 index.html...');
  
  // 检查是否包含生产API地址
  if (indexContent.includes('tml-villa-api.onrender.com')) {
    console.log('✅ 生产API地址已正确注入');
  } else {
    console.warn('⚠️  警告: 未找到生产API地址');
    console.log('   当前内容片段:', indexContent.substring(0, 200));
  }
}

// 检查 JavaScript 文件
const assetsPath = resolve(distPath, 'assets');
if (existsSync(assetsPath)) {
  const jsFiles = readdirSync(assetsPath).filter(file => file.endsWith('.js'));
  console.log(`\n📁 检查 ${jsFiles.length} 个 JavaScript 文件...`);
  
  let foundApiUrl = false;
  jsFiles.forEach(file => {
    const filePath = resolve(assetsPath, file);
    const content = readFileSync(filePath, 'utf8');
    
    // 检查是否包含API相关的代码
    if (content.includes('API_BASE_URL') || content.includes('onrender.com')) {
      console.log(`✅ ${file} 包含API配置`);
      foundApiUrl = true;
    }
  });
  
  if (!foundApiUrl) {
    console.warn('⚠️  警告: 未在JS文件中找到API配置');
  }
}

console.log('\n✅ 验证完成!');