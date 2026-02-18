import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

// 检查构建产物
const distPath = join(process.cwd(), 'dist', 'assets');
if (!existsSync(distPath)) {
  console.log('❌ 未找到构建产物，请先运行 npm run build');
  process.exit(1);
}

const files = readdirSync(distPath);
const jsFiles = files.filter(f => f.endsWith('.js'));

if (jsFiles.length === 0) {
  console.log('❌ 未找到JavaScript构建文件');
  process.exit(1);
}

const jsFile = jsFiles[0];
const content = readFileSync(join(distPath, jsFile), 'utf8');

console.log('🔍 构建产物检查结果:');
console.log('====================');

// 检查生产环境API配置
const hasProductionUrl = content.includes('tml-villa-api.onrender.com');
const hasLocalhost = content.includes('localhost:3000');

console.log(`生产API地址: ${hasProductionUrl ? '✓ 已配置' : '✗ 未配置'}`);
console.log(`本地开发地址: ${hasLocalhost ? '⚠️  仍存在' : '✓ 已移除'}`);

// 检查错误提示文本
const hasNetworkError = content.includes('网络连接失败');
const hasBackendError = content.includes('后端服务是否启动');

console.log(`生产环境错误提示: ${hasNetworkError ? '✓ 已配置' : '✗ 未配置'}`);
console.log(`开发环境错误提示: ${hasBackendError ? '⚠️  仍存在' : '✓ 已移除'}`);

console.log('\n📊 建议:');
if (!hasProductionUrl) {
  console.log('- 重新构建项目以确保生产环境变量正确注入');
}
if (hasLocalhost) {
  console.log('- 构建产物中仍包含localhost引用，可能存在配置问题');
}
if (!hasNetworkError) {
  console.log('- 错误提示未按生产环境优化');
}

console.log('\n💡 解决方案:');
console.log('1. 设置环境变量: set VITE_API_BASE_URL=https://tml-villa-api.onrender.com/api');
console.log('2. 重新构建: npm run build');
console.log('3. 部署新的构建产物');