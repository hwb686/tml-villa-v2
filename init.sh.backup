#!/bin/bash
# ============================================================
# TML Villa 开发环境启动脚本
# 泰国民宿管理平台 - 前后端同时启动
# ============================================================

set -e

echo "🚀 启动 TML Villa 开发环境..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查 Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} Node.js $(node -v) 已安装"
else
    echo -e "${RED}✗${NC} Node.js 未安装"
    exit 1
fi

# 检查并安装后端依赖
if [ -d "backend" ]; then
    echo "📦 检查后端依赖..."
    cd backend
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    # 生成 Prisma 客户端
    if [ -f "prisma/schema.prisma" ]; then
        npx prisma generate
    fi
    cd ..
fi

# 检查并安装前端依赖
if [ -d "app" ]; then
    echo "📦 检查前端依赖..."
    cd app
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    cd ..
fi

# 启动后端服务器
echo "🖥️  启动后端服务器 (端口 3000)..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端服务器
echo "🖥️  启动前端服务器 (端口 5173)..."
cd app
npm run dev &
FRONTEND_PID=$!
cd ..

# 等待服务器就绪
echo "⏳ 等待服务器启动..."
sleep 5

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  TML Villa 开发环境就绪！${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "📍 前端地址: http://localhost:5173"
echo "📍 后端地址: http://localhost:3000"
echo ""
echo "🛑 停止服务器: kill $BACKEND_PID $FRONTEND_PID"
echo ""

# 保持运行
wait
