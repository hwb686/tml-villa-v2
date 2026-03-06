import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, DollarSign, Users, Home, Search, Globe, Menu, Heart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// 方案 1：泰式现代禅意 (Thai Zen Luxury) 样式预览
export default function DesignPreview() {
  const [isScrolled] = useState(true);

  const mockData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 2000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF0] pb-20 font-sans">
      {/* 1. 浮动磨砂玻璃导航栏 */}
      <nav className={`fixed top-4 left-4 right-4 z-50 transition-all duration-500 rounded-2xl border border-white/40 
        ${isScrolled ? 'bg-white/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(201,169,98,0.15)] py-2' : 'bg-white/40 py-4'}`}>
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-champagne rounded-lg rotate-45 flex items-center justify-center">
              <Home className="text-white -rotate-45" size={16} />
            </div>
            <span className="font-serif text-2xl tracking-tight text-[#C9A962]">TML Villa</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#1A1A1A]/70">
            <span className="text-[#C9A962] border-b-2 border-[#C9A962]">首页</span>
            <span>民宿</span>
            <span>租车</span>
            <span>餐饮</span>
          </div>

          <div className="flex items-center gap-4">
             <Globe size={18} className="text-gray-600" />
             <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
                <Menu size={18} className="text-gray-600" />
             </div>
          </div>
        </div>
      </nav>

      {/* 2. 预览内容区 */}
      <div className="pt-32 container mx-auto px-6">
        <h1 className="font-serif text-4xl text-[#1A1A1A] mb-8">设计方案预览：泰式禅意</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {/* 流体玻璃统计卡片 */}
          {[
            { title: '总收入', value: '฿128,400', icon: DollarSign },
            { title: '预订数', value: '42', icon: ShoppingCart },
            { title: '访客数', value: '1,205', icon: Users },
            { title: '收藏数', value: '89', icon: Heart },
          ].map((item, i) => (
            <Card key={i} className="relative overflow-hidden bg-white/40 backdrop-blur-lg border border-white/50 shadow-xl rounded-3xl group hover:-translate-y-1 transition-all">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#C9A962]/5 rounded-full blur-xl group-hover:bg-[#C9A962]/10 transition-colors" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-[#1A1A1A]/50 uppercase tracking-widest">{item.title}</CardTitle>
                <div className="p-2 bg-[#C9A962]/10 rounded-xl">
                  <item.icon size={18} className="text-[#C9A962]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif text-[#1A1A1A]">{item.value}</div>
                <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <span>+12.5%</span>
                  <span className="text-gray-400">vs last week</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 3. 金色渐变图表 */}
        <Card className="bg-white/40 backdrop-blur-lg border border-white/50 shadow-xl rounded-3xl p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-serif text-[#1A1A1A]">收入趋势分析</CardTitle>
          </CardHeader>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A962" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#C9A962" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderRadius: '16px', border: '1px solid #C9A962/20', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} 
                />
                <Area type="monotone" dataKey="revenue" stroke="#C9A962" strokeWidth={4} fill="url(#colorRevenue)" animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
