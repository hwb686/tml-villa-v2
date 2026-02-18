import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

// 读取构建后的JS文件
const jsFiles = readdirSync(join(process.cwd(), 'dist', 'assets'))
  .filter(file => file.endsWith('.js'));

console.log('检查构建后的JS文件中的API配置...\n');

jsFiles.forEach(file => {
  const filePath = join(process.cwd(), 'dist', 'assets', file);
  const content = readFileSync(filePath, 'utf8');
  
  console.log(`文件: ${file}`);
  console.log(`大小: ${(content.length / 1024).toFixed(2)} KB`);
  
  // 检查各种可能的API配置方式
  const checks = [
    { name: 'onrender.com', pattern: /onrender\.com/ },
    { name: 'localhost:3000', pattern: /localhost:3000/ },
    { name: 'API_BASE_URL', pattern: /API_BASE_URL/ },
    { name: 'import.meta.env', pattern: /import\.meta\.env/ },
    { name: 'VITE_API_BASE_URL', pattern: /VITE_API_BASE_URL/ }
  ];
  
  checks.forEach(check => {
    const matches = content.match(check.pattern);
    if (matches) {
      console.log(`  ✓ 包含 ${check.name}: ${matches.length} 处`);
    } else {
      console.log(`  ✗ 不包含 ${check.name}`);
    }
  });
  
  console.log('');
});

// 检查环境变量是否在构建时被替换
console.log('检查环境变量替换情况...');
const envProdPath = join(process.cwd(), '.env.production');
if (existsSync(envProdPath)) {
  const envContent = readFileSync(envProdPath, 'utf8');
  console.log('.env.production 内容:');
  console.log(envContent);
} else {
  console.log('未找到 .env.production 文件');
}