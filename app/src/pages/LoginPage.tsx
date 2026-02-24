import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { userApi } from '@/services/api';
import Navbar from '@/sections/Navbar';
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

  const getErrorMessage = (key: string): string => {
    const messages: Record<string, Record<string, string>> = {
      zh: {
        fillEmailPassword: '请填写邮箱和密码',
        loginFailed: '登录失败，请检查邮箱和密码',
        passwordTooShort: '密码长度不能少于6位',
        passwordMismatch: '两次输入的密码不一致',
        registerFailed: '注册失败，请稍后重试',
        fillRequired: '请填写邮箱和密码',
      },
      en: {
        fillEmailPassword: 'Please fill in email and password',
        loginFailed: 'Login failed, please check your email and password',
        passwordTooShort: 'Password must be at least 6 characters',
        passwordMismatch: 'Passwords do not match',
        registerFailed: 'Registration failed, please try again later',
        fillRequired: 'Please fill in email and password',
      },
      th: {
        fillEmailPassword: 'กรุณากรอกอีเมลและรหัสผ่าน',
        loginFailed: 'เข้าสู่ระบบล้มเหลว กรุณาตรวจสอบอีเมลและรหัสผ่าน',
        passwordTooShort: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
        passwordMismatch: 'รหัสผ่านไม่ตรงกัน',
        registerFailed: 'สมัครสมาชิกล้มเหลว กรุณาลองอีกครั้ง',
        fillRequired: 'กรุณากรอกอีเมลและรหัสผ่าน',
      },
    };
    return messages[t?.lang || 'zh']?.[key] || messages.zh[key];
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginForm.email || !loginForm.password) {
      setError(getErrorMessage('fillEmailPassword'));
      return;
    }

    try {
      setLoading(true);
      const res = await userApi.login(loginForm.email, loginForm.password);
      localStorage.setItem('userToken', res.data.token);
      window.location.hash = '/user';
    } catch (err: any) {
      setError(err.message || getErrorMessage('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!registerForm.email || !registerForm.password) {
      setError(getErrorMessage('fillRequired'));
      return;
    }

    if (registerForm.password.length < 6) {
      setError(getErrorMessage('passwordTooShort'));
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError(getErrorMessage('passwordMismatch'));
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
      setError(err.message || getErrorMessage('registerFailed'));
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
              <CardTitle className="text-2xl font-serif">TML Villa</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="login" className="flex-1">{t.auth.login}</TabsTrigger>
                  <TabsTrigger value="register" className="flex-1">{t.auth.register}</TabsTrigger>
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
                      <Label htmlFor="login-email">{t.auth.email}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder={t.auth.email}
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="login-password">{t.auth.password}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder={t.auth.password}
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {t.auth.login}
                    </Button>
                    <div className="text-center mt-3">
                      <button
                        type="button"
                        className="text-sm text-champagne hover:underline"
                        onClick={() => setError(
                          lang === 'th' ? 'กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่าน' :
                          lang === 'en' ? 'Please contact admin to reset your password' :
                          '请联系管理员重置密码'
                        )}
                      >
                        {lang === 'th' ? 'ลืมรหัสผ่าน?' : lang === 'en' ? 'Forgot password?' : '忘记密码？'}
                      </button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label htmlFor="register-username">{t.auth.username}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-username"
                          type="text"
                          placeholder={t.auth.username}
                          value={registerForm.username}
                          onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="register-email">{t.auth.email} *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder={t.auth.email}
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="register-phone">{t.auth.phone}</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-phone"
                          type="tel"
                          placeholder={t.auth.phone}
                          value={registerForm.phone}
                          onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="register-password">{t.auth.password} *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-password"
                          type="password"
                          placeholder={t.auth.password}
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="register-confirm-password">{t.auth.confirmPassword} *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-confirm-password"
                          type="password"
                          placeholder={t.auth.confirmPassword}
                          value={registerForm.confirmPassword}
                          onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {t.auth.register}
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
    </div>
  );
}
