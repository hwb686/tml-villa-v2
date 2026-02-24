#!/bin/bash
# ============================================================
# TML Villa 停止服务脚本
# ============================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PID_DIR="pids"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"

echo "🛑 停止 TML Villa 服务..."

# 停止后端
if [ -f "$BACKEND_PID_FILE" ]; then
    PID=$(cat "$BACKEND_PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID" 2>/dev/null
        echo -e "${GREEN}✓${NC} 已停止后端服务 (PID: $PID)"
    else
        echo -e "${YELLOW}⚠${NC} 后端服务已不在运行"
    fi
    rm -f "$BACKEND_PID_FILE"
else
    echo -e "${YELLOW}⚠${NC} 未找到后端 PID 文件"
fi

# 停止前端
if [ -f "$FRONTEND_PID_FILE" ]; then
    PID=$(cat "$FRONTEND_PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID" 2>/dev/null
        echo -e "${GREEN}✓${NC} 已停止前端服务 (PID: $PID)"
    else
        echo -e "${YELLOW}⚠${NC} 前端服务已不在运行"
    fi
    rm -f "$FRONTEND_PID_FILE"
else
    echo -e "${YELLOW}⚠${NC} 未找到前端 PID 文件"
fi

# 清理可能残留的进程
echo "🧹 清理残留进程..."

# 查找并停止 node 进程（端口 3000 和 5173）
if command -v lsof >/dev/null 2>&1; then
    BACKEND_PIDS=$(lsof -t -i:3000 2>/dev/null)
    if [ -n "$BACKEND_PIDS" ]; then
        echo "  发现端口 3000 占用进程: $BACKEND_PIDS"
        kill $BACKEND_PIDS 2>/dev/null
        echo -e "${GREEN}✓${NC} 已停止端口 3000 进程"
    fi
    
    FRONTEND_PIDS=$(lsof -t -i:5173 2>/dev/null)
    if [ -n "$FRONTEND_PIDS" ]; then
        echo "  发现端口 5173 占用进程: $FRONTEND_PIDS"
        kill $FRONTEND_PIDS 2>/dev/null
        echo -e "${GREEN}✓${NC} 已停止端口 5173 进程"
    fi
fi

echo ""
echo -e "${GREEN}✓${NC} 所有服务已停止"
