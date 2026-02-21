import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { userApi } from '@/services/api';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';
import { Mail, Lock, User, Phone, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 登录表单
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  // 注册表单
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginForm.email || !loginForm.password) {
      setError('请填写邮箱和密码');
      return;
    }

    try {
      setLoading(true);
      const res = await userApi.login(loginForm.email, loginForm.password);
      localStorage.setItem('userToken', res.data.token);
      window.location.hash = '/user';
    } catch (err: any) {
      setError(err.message || '登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!registerForm.email || !registerForm.password) {
      setError('请填写邮箱和密码');
      return;
    }

    if (registerForm.password.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    try {
      setLoading(true);
      const res = await userApi.register({
        name: registerForm.username || registerForm.email.split('@')[0],
        email: registerForm.email,
        password: registerForm.password,
        phone: registerForm.phone || undefined,
      });
      localStorage.setItem('userToken', res.data.token);
      window.location.hash = '/user';
    } catch (err: any) {
      setError(err.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSearchClick={() => {}} />
      
      <div className="pt-36 pb-20">
        <div className="container-luxury max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-serif">欢迎来到 TML Villa</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="login" className="flex-1">登录</TabsTrigger>
                  <TabsTrigger value="register" className="flex-1">注册</TabsTrigger>
                </TabsList>

                {error && (
                  <Alert className="mb-4 border-red-500 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">邮箱</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="请输入邮箱"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="login-password">密码</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="请输入密码"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      登录
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label htmlFor="register-username">用户名</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-username"
                          type="text"
                          placeholder="请输入用户名（可选）"
                          value={registerForm.username}
                          onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="register-email">邮箱 *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="请输入邮箱"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="register-phone">手机号</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-phone"
                          type="tel"
                          placeholder="请输入手机号（可选）"
                          value={registerForm.phone}
                          onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="register-password">密码 *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="请输入密码（至少6位）"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="register-confirm-password">确认密码 *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-confirm-password"
                          type="password"
                          placeholder="请再次输入密码"
                          value={registerForm.confirmPassword}
                          onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      注册
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6 text-center text-sm text-gray-500">
                <p>继续即表示您同意我们的服务条款和隐私政策</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
