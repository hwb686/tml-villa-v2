#!/bin/bash
# ============================================================
# TML Villa 开发环境启动脚本（带健康检查）
# 泰国民宿管理平台 - 前后端同时启动
# ============================================================

set -e

echo "🚀 启动 TML Villa 开发环境..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
BACKEND_PORT=3000
FRONTEND_PORT=5173
HEALTH_CHECK_TIMEOUT=30
HEALTH_CHECK_INTERVAL=1
LOG_DIR="logs"
PID_DIR="pids"

# 创建日志和PID目录
mkdir -p "$LOG_DIR" "$PID_DIR"

# 日志文件
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"

# 清理函数
cleanup() {
    echo ""
    echo -e "${YELLOW}⚠️  正在清理...${NC}"
    if [ -f "$BACKEND_PID_FILE" ]; then
        local pid=$(cat "$BACKEND_PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
            echo "  已停止后端服务 (PID: $pid)"
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local pid=$(cat "$FRONTEND_PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
            echo "  已停止前端服务 (PID: $pid)"
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    echo -e "${GREEN}✓${NC} 清理完成"
}

# 设置清理钩子
trap cleanup EXIT INT TERM

# 健康检查函数
check_health() {
    local url=$1
    local max_wait=${2:-30}
    local service_name=$3
    local elapsed=0
    
    echo -e "${BLUE}⏳ 等待 $service_name 启动...${NC}"
    
    while [ $elapsed -lt $max_wait ]; do
        if curl -s --max-time 2 "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} $service_name 已就绪 (${elapsed}s)"
            return 0
        fi
        sleep $HEALTH_CHECK_INTERVAL
        elapsed=$((elapsed + HEALTH_CHECK_INTERVAL))
        echo -n "."
    done
    echo ""
    return 1
}

# 检查 Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} Node.js $(node -v) 已安装"
else
    echo -e "${RED}✗${NC} Node.js 未安装"
    exit 1
fi

# 检查 curl
if ! command -v curl &> /dev/null; then
    echo -e "${RED}✗${NC} curl 未安装，请先安装 curl"
    exit 1
fi

# 检查并安装后端依赖
if [ -d "backend" ]; then
    echo "📦 检查后端依赖..."
    cd backend
    if [ ! -d "node_modules" ]; then
        echo "  正在安装后端依赖..."
        npm install
    fi
    # 生成 Prisma 客户端
    if [ -f "prisma/schema.prisma" ]; then
        echo "  生成 Prisma 客户端..."
        npx prisma generate
    fi
    cd ..
fi

# 检查并安装前端依赖
if [ -d "app" ]; then
    echo "📦 检查前端依赖..."
    cd app
    if [ ! -d "node_modules" ]; then
        echo "  正在安装前端依赖..."
        npm install
    fi
    cd ..
fi

# 清理旧日志
echo "🧹 清理旧日志..."
> "$BACKEND_LOG"
> "$FRONTEND_LOG"

# 启动后端服务器
echo ""
echo "🖥️  启动后端服务器 (端口 $BACKEND_PORT)..."
cd backend

# 使用 nohup 启动，防止 SIGHUP 信号终止
if [ -f "api/db.js" ]; then
    nohup npm run dev > "../$BACKEND_LOG" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "../$BACKEND_PID_FILE"
    echo "  后端进程 PID: $BACKEND_PID"
else
    echo -e "${RED}✗${NC} 后端入口文件不存在"
    exit 1
fi
cd ..

# 等待后端健康检查
if ! check_health "http://localhost:$BACKEND_PORT/health" $HEALTH_CHECK_TIMEOUT "后端服务"; then
    echo -e "${RED}✗${NC} 后端服务启动失败或超时"
    echo ""
    echo "📋 后端日志 (最后 30 行):"
    tail -30 "$BACKEND_LOG"
    exit 1
fi

# 启动前端服务器
echo ""
echo "🖥️  启动前端服务器 (端口 $FRONTEND_PORT)..."
cd app

# 使用 nohup 启动，防止 SIGHUP 信号终止
nohup npm run dev > "../$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "../$FRONTEND_PID_FILE"
echo "  前端进程 PID: $FRONTEND_PID"
cd ..

# 等待前端健康检查
if ! check_health "http://localhost:$FRONTEND_PORT" $HEALTH_CHECK_TIMEOUT "前端服务"; then
    echo -e "${RED}✗${NC} 前端服务启动失败或超时"
    echo ""
    echo "📋 前端日志 (最后 30 行):"
    tail -30 "$FRONTEND_LOG"
    exit 1
fi

# 最终验证
echo ""
echo "🔍 最终验证..."

# 验证后端 API
BACKEND_CHECK=$(curl -s http://localhost:$BACKEND_PORT/health 2>/dev/null)
if [ -n "$BACKEND_CHECK" ]; then
    echo -e "${GREEN}✓${NC} 后端健康检查通过"
    echo "  响应: $BACKEND_CHECK"
else
    echo -e "${RED}✗${NC} 后端健康检查失败"
    exit 1
fi

# 验证前端
FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$FRONTEND_PORT 2>/dev/null)
if [ "$FRONTEND_CHECK" = "200" ] || [ "$FRONTEND_CHECK" = "304" ]; then
    echo -e "${GREEN}✓${NC} 前端服务响应正常 (HTTP $FRONTEND_CHECK)"
else
    echo -e "${YELLOW}⚠${NC} 前端服务返回 HTTP $FRONTEND_CHECK (可能仍在启动中)"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  TML Villa 开发环境就绪！${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "📍 前端地址: http://localhost:$FRONTEND_PORT"
echo "📍 后端地址: http://localhost:$BACKEND_PORT"
echo "📍 健康检查: http://localhost:$BACKEND_PORT/health"
echo ""
echo "📋 日志文件:"
echo "  后端: $BACKEND_LOG"
echo "  前端: $FRONTEND_LOG"
echo ""
echo "🛑 停止服务器:"
echo "  方法1: 按 Ctrl+C"
echo "  方法2: 运行 ./stop.sh (如果存在)"
echo ""
echo "💡 提示: 进程已在后台运行，可以安全关闭终端"
echo ""

# 等待2秒确保进程稳定，然后退出
sleep 2
exit 0
