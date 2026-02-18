import { readFileSync } from 'fs';
import { join } from 'path';

// 动态查找最新的JS文件
const assetsDir = join(process.cwd(), 'dist', 'assets');
const fs = await import('fs');
const files = fs.readdirSync(assetsDir);
const jsFile = files.find(file => file.endsWith('.js'));

if (!jsFile) {
  console.log('❌ 未找到JS文件');
  process.exit(1);
}

const jsFilePath = join(assetsDir, jsFile);
const content = readFileSync(jsFilePath, 'utf8');

console.log('🔍 精确查找 localhost:3000 的使用情况...\n');

// 查找所有包含 localhost:3000 的行
const lines = content.split('\n');
const localhostLines = [];

lines.forEach((line, index) => {
  if (line.includes('localhost:3000')) {
    localhostLines.push({
      lineNumber: index + 1,
      content: line.trim()
    });
  }
});

console.log(`找到 ${localhostLines.length} 处 localhost:3000 的引用:\n`);

localhostLines.forEach((item, i) => {
  console.log(`${i + 1}. 行号 ${item.lineNumber}:`);
  console.log(`   ${item.content}`);
  console.log('');
});

// 特别检查 Login 组件中的错误消息
if (content.includes('网络错误，请检查后端服务是否启动')) {
  console.log('⚠️  仍然存在问题：Login 组件中可能还有硬编码的 localhost:3000 错误提示');
} else if (content.includes('网络连接失败')) {
  console.log('✅ 好消息：找到了改进后的错误提示');
} else {
  console.log('✅ 未找到明显的 localhost:3000 错误提示');
}

// 检查是否有正确的生产环境配置
if (content.includes('tml-villa-api.onrender.com')) {
  console.log('✅ 找到正确的生产API地址配置');
} else {
  console.log('❌ 未找到生产API地址配置');
}

console.log('\n📊 总结:');
console.log('- 构建产物中应该主要包含生产环境配置');
console.log('- 错误提示应该适合生产环境使用');
console.log('- 用户不应该看到开发环境的相关信息');