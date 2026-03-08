#!/bin/bash
# TML Villa 部署验证脚本

echo "=========================================="
echo "🚀 TML Villa 部署验证"
echo "=========================================="
echo ""

# 定义服务 URL
FRONTEND_URL="https://tml-villa.onrender.com"
BACKEND_URL="https://tml-villa-api.onrender.com"

echo "📍 检查服务状态..."
echo ""

# 检查前端
echo "1️⃣ 检查前端服务..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "   ✅ 前端正常 ($FRONTEND_STATUS)"
else
    echo "   ⚠️  前端返回状态 $FRONTEND_STATUS (可能需要等待部署完成)"
fi
echo "   🌐 $FRONTEND_URL"
echo ""

# 检查后端健康
echo "2️⃣ 检查后端 API..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/api/health 2>/dev/null || echo "000")
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "   ✅ 后端正常 ($HEALTH_STATUS)"
    HEALTH_RESPONSE=$(curl -s $BACKEND_URL/api/health 2>/dev/null)
    echo "   📊 $HEALTH_RESPONSE"
else
    echo "   ⚠️  后端返回状态 $HEALTH_STATUS"
fi
echo "   🔧 $BACKEND_URL/api/health"
echo ""

# 检查后端根路径
echo "3️⃣ 检查后端根路径..."
ROOT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/ 2>/dev/null || echo "000")
echo "   状态: $ROOT_STATUS"
echo "   🔧 $BACKEND_URL/"
echo ""

# 检查 API 端点
echo "4️⃣ 检查 API 端点..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/api/homestays 2>/dev/null || echo "000")
echo "   民宿列表 API: $API_STATUS"
echo "   🔧 $BACKEND_URL/api/homestays"
echo ""

echo "=========================================="
echo "📋 部署检查清单"
echo "=========================================="
echo ""
echo "环境变量配置:"
echo "  ☐ 后端: DATABASE_URL 已设置"
echo "  ☐ 后端: SUPABASE_SERVICE_ROLE_KEY 已设置"
echo "  ☐ 前端: VITE_API_BASE_URL 已设置"
echo "  ☐ 前端: VITE_SUPABASE_ANON_KEY 已设置"
echo ""
echo "服务状态:"
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "  ✅ 前端可访问"
else
    echo "  ☐ 前端待验证"
fi
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "  ✅ 后端可访问"
else
    echo "  ☐ 后端待验证"
fi
echo ""
echo "=========================================="
echo "🔗 快速链接"
echo "=========================================="
echo ""
echo "🌐 前端: $FRONTEND_URL"
echo "🔧 后端: $BACKEND_URL"
echo "🏥 健康: $BACKEND_URL/api/health"
echo "📊 API文档: $BACKEND_URL/api-docs (如果有)"
echo ""
echo "🗄️ Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/tlorpxejqqmrdcfgvyhl"
echo ""
echo "🚀 Render Dashboard:"
echo "   https://dashboard.render.com"
echo ""
