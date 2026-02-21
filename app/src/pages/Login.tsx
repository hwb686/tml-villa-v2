import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { adminApi } from '@/services/api';

interface LoginProps { onLogin: () => void; }

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('请输入用户名和密码'); return; }
    
    setIsLoading(true);
    
    try {
      // 使用统一的API服务，避免URL路径问题
      const result = await adminApi.login(username, password);
      
      if (result.success) {
        localStorage.setItem('adminToken', result.data.token);
        localStorage.setItem('adminInfo', JSON.stringify(result.data.admin));
        onLogin();
      } else {
        setError(result.message || '登录失败');
      }
    } catch (err: any) {
      console.error('登录错误详情:', err);
      // 显示具体的错误信息用于调试
      setError(`登录失败: ${err.message || '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-champagne to-champagne-dark flex-col justify-center items-center text-white p-12">
        <div className="max-w-md text-center">
          <img src="/images/logo.png" alt="TML Villa" className="h-24 w-auto mx-auto mb-8" />
          <h1 className="font-serif text-4xl mb-4">TML Villa</h1>
          <p className="text-white/80 text-lg mb-2">泰美丽后台管理系统</p>
          <p className="text-white/60 text-sm">LocalLife Platform Admin</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="lg:hidden text-center mb-4">
              <img src="/images/logo.png" alt="TML Villa" className="h-16 w-auto mx-auto mb-4" />
            </div>
            <CardTitle className="text-2xl text-center">管理员登录</CardTitle>
            <CardDescription className="text-center">请输入您的账号密码</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input id="username" type="text" placeholder="admin" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="请输入密码" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">记住我</Label>
                </div>
              </div>
              <Button type="submit" className="w-full bg-champagne hover:bg-champagne-dark" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />登录中...</> : '登录'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
