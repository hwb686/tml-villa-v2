#!/usr/bin/env node

// 生产环境构建脚本
// 确保正确加载 .env.production 文件中的环境变量

import { spawn } from 'child_process';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

console.log('🚀 开始生产环境构建...');

// 检查 .env.production 文件是否存在
const envProdPath = resolve('./.env.production');
if (!existsSync(envProdPath)) {
  console.error('❌ 错误: .env.production 文件不存在');
  process.exit(1);
}

// 读取生产环境变量
const envContent = readFileSync(envProdPath, 'utf8');
console.log('📋 生产环境变量:');
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    console.log(`   ${line}`);
  }
});

// 设置环境变量
process.env.NODE_ENV = 'production';

// 执行构建命令
const build = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

build.on('close', (code) => {
  if (code === 0) {
    console.log('✅ 构建成功完成!');
    
    // 验证构建结果
    const distPath = resolve('./dist');
    if (existsSync(distPath)) {
      console.log('📁 构建产物位置:', distPath);
      
      // 检查关键文件
      const indexPath = resolve(distPath, 'index.html');
      if (existsSync(indexPath)) {
        console.log('📄 index.html 已生成');
        
        // 检查是否包含正确的API地址
        const indexContent = readFileSync(indexPath, 'utf8');
        if (indexContent.includes('tml-villa-api.onrender.com')) {
          console.log('✅ API地址已正确配置');
        } else {
          console.warn('⚠️  注意: 请检查API地址是否正确配置');
        }
      }
    }
  } else {
    console.error('❌ 构建失败，退出码:', code);
    process.exit(code);
  }
});