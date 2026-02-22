import React from 'react';

interface HighlightedTextProps {
  text: string;
  className?: string;
}

/**
 * 高亮文本组件 - 用于搜索结果中高亮显示关键词
 * 后端返回的高亮格式: <<HIGHLIGHT>>关键词<<END>>
 */
export function HighlightedText({ text, className = '' }: HighlightedTextProps) {
  if (!text) return null;
  
  // 解析高亮标记
  const parts: React.ReactNode[] = [];
  const regex = /<<HIGHLIGHT>>(.*?)<<END>>/g;
  let lastIndex = 0;
  let key = 0;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // 添加高亮前的普通文本
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++}>{text.slice(lastIndex, match.index)}</span>
      );
    }
    
    // 添加高亮文本
    parts.push(
      <mark 
        key={key++} 
        className="bg-champagne/30 text-ink px-0.5 rounded"
      >
        {match[1]}
      </mark>
    );
    
    lastIndex = regex.lastIndex;
  }
  
  // 添加最后剩余的普通文本
  if (lastIndex < text.length) {
    parts.push(
      <span key={key++}>{text.slice(lastIndex)}</span>
    );
  }
  
  // 如果没有高亮内容，直接返回原文本
  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }
  
  return <span className={className}>{parts}</span>;
}

export default HighlightedText;
