#!/bin/bash
# Render 现有服务更新脚本
# 用于更新已部署的 tml-villa 和 tml-villa-api 服务

echo "🚀 开始更新 Render 服务配置..."
echo ""

# 设置 PATH
export PATH=$PATH:/Users/tml001/.local/bin

# 检查 CLI
echo "✓ Render CLI 版本: $(render --version)"
echo ""

# 更新后端服务环境变量
echo "📦 更新后端服务 (tml-villa-api)..."
echo "=========================================="

cat << 'EOF'
请在 Render Dashboard 手动更新以下环境变量：

服务: tml-villa-api
URL: https://dashboard.render.com/web/srv-xxxxxxxxxxxxx

需要更新的环境变量：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. NODE_ENV=production
2. PORT=10000
3. JWT_SECRET=<保持现有值或生成新的>
4. JWT_EXPIRES_IN=24h
5. JWT_REFRESH_EXPIRES_IN=7d
6. DATABASE_URL="postgresql://postgres.tlorpxejqqmrdcfgvyhl:Kaokao686!!@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5"
7. DIRECT_DATABASE_URL="postgresql://postgres.tlorpxejqqmrdcfgvyhl:Kaokao686!!@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
8. SUPABASE_URL=https://tlorpxejqqmrdcfgvyhl.supabase.co
9. SUPABASE_SERVICE_ROLE_KEY=<从 Supabase Dashboard 获取>
10. ALLOWED_ORIGINS=https://tml-villa.onrender.com
11. FRONTEND_URL=https://tml-villa.onrender.com
EOF

echo ""
echo "📦 更新前端服务 (tml-villa)..."
echo "=========================================="

cat << 'EOF'
服务: tml-villa
URL: https://dashboard.render.com/static/srv-xxxxxxxxxxxxx

需要更新的环境变量：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. NODE_ENV=production
2. VITE_API_BASE_URL=https://tml-villa-api.onrender.com/api
3. VITE_SUPABASE_URL=https://tlorpxejqqmrdcfgvyhl.supabase.co
4. VITE_SUPABASE_ANON_KEY=<从 Supabase Dashboard 获取>
EOF

echo ""
echo "✅ 更新步骤："
echo "=========================================="
echo "1. 访问 https://dashboard.render.com"
echo "2. 点击 'tml-villa-api' 服务"
echo "3. 点击 'Environment' 标签"
echo "4. 添加/更新上述环境变量"
echo "5. 点击 'Save Changes'"
echo "6. 服务会自动重新部署"
echo "7. 重复步骤 2-6 为 'tml-villa' 前端服务"
echo ""
echo "🔗 快速链接："
echo "- Render Dashboard: https://dashboard.render.com"
echo "- Supabase Dashboard: https://supabase.com/dashboard/project/tlorpxejqqmrdcfgvyhl"
echo "- 前端网站: https://tml-villa.onrender.com"
echo "- 后端 API: https://tml-villa-api.onrender.com"
echo ""
