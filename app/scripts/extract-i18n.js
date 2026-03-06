#!/usr/bin/env node
/**
 * i18n 字符串提取工具
 * 提取 TSX 文件中的硬编码中文字符串
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 需要提取字符串的文件列表（优先级排序）
const targetFiles = [
  'app/src/pages/UserCenter.tsx',
  'app/src/pages/HomestayDetail.tsx', 
  'app/src/pages/Staffs.tsx',
  'app/src/pages/Costs.tsx',
  'app/src/pages/Coupons.tsx',
  'app/src/pages/Dashboard.tsx'
];

// 匹配中文字符的正则
const chineseRegex = /['"]([\u4e00-\u9fa5][^'"]*)['"]/g;

// 需要跳过的模式（import、注释等）
const skipPatterns = [
  /^import\s/,
  /^\s*\/\//,
  /from\s+['"]/,
  /className=/,
];

function shouldSkip(line) {
  return skipPatterns.some(pattern => pattern.test(line));
}

function extractStrings(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const results = [];

  lines.forEach((line, index) => {
    if (shouldSkip(line)) return;
    
    let match;
    while ((match = chineseRegex.exec(line)) !== null) {
      const str = match[1];
      // 跳过短字符串（可能是变量名的一部分）
      if (str.length < 2) continue;
      
      results.push({
        line: index + 1,
        text: str,
        context: line.trim().substring(0, 80)
      });
    }
  });

  return results;
}

function generateI18nKey(text) {
  // 将中文转换为小写带下划线的键
  return text
    .replace(/[^一-龥a-zA-Z0-9]/g, '_')
    .toLowerCase()
    .substring(0, 30);
}

// 主流程
console.log('=== i18n 字符串提取工具 ===\n');

const allStrings = [];
const projectRoot = path.resolve(__dirname, '../..');

targetFiles.forEach(file => {
  const fullPath = path.join(projectRoot, file);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ 跳过: ${file} (不存在于 ${fullPath})`);
    return;
  }
  
  console.log(`\n📄 ${file}:`);
  const strings = extractStrings(fullPath);
  
  if (strings.length === 0) {
    console.log('  ✅ 没有发现硬编码字符串');
  } else {
    strings.forEach(({ line, text, context }) => {
      console.log(`  第 ${line.toString().padStart(3)} 行: "${text.substring(0, 40)}"`);
      allStrings.push({ file, line, text, key: generateI18nKey(text) });
    });
  }
});

console.log(`\n\n=== 总结 ===`);
console.log(`发现 ${allStrings.length} 处字符串需要提取`);
console.log(`涉及 ${new Set(allStrings.map(s => s.file)).size} 个文件`);

// 生成 i18n 键值对
if (allStrings.length > 0) {
  console.log(`\n=== 建议的 i18n 键 ===\n`);
  const uniqueKeys = [...new Set(allStrings.map(s => s.text))];
  uniqueKeys.slice(0, 20).forEach((text, i) => {
    const key = generateI18nKey(text);
    console.log(`  ${key}: '${text}',`);
  });
  if (uniqueKeys.length > 20) {
    console.log(`  ... 还有 ${uniqueKeys.length - 20} 个`);
  }
}
