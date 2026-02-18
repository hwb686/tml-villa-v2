import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Bell, Shield, Globe, CreditCard, Eye, EyeOff } from 'lucide-react';
import { adminApi } from '@/services/api';

export default function Settings() {
  const [generalSettings, setGeneralSettings] = useState({ 
    siteName: 'TML Villa', 
    siteDescription: '泰国本地生活服务平台', 
    contactEmail: 'contact@tml-villa.com', 
    contactPhone: '+66 2-XXX-XXXX' 
  });
  const [notificationSettings, setNotificationSettings] = useState({ 
    emailNotification: true, 
    orderNotification: true, 
    newUserNotification: false, 
    withdrawalNotification: true 
  });
  const [paymentSettings, setPaymentSettings] = useState({ 
    enableCreditCard: true, 
    enablePromptPay: true, 
    enableWeChatPay: true, 
    enableAlipay: true 
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('请填写所有密码字段');
      return;
    }

    if (passwordData.newPassword.length < 5) {
      setPasswordError('新密码长度不能少于5位');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('两次输入的新密码不一致');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('新密码不能与当前密码相同');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Get admin info from localStorage
      const adminInfo = localStorage.getItem('adminInfo');
      if (!adminInfo) {
        setPasswordError('无法获取管理员信息，请重新登录');
        return;
      }
      const { username } = JSON.parse(adminInfo);

      await adminApi.changePassword(
        username,
        passwordData.currentPassword,
        passwordData.newPassword
      );

      setPasswordSuccess('密码修改成功！请使用新密码重新登录。');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err: any) {
      setPasswordError(err.message || '密码修改失败，请检查当前密码是否正确');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">系统设置</h1>
        <Button className="bg-champagne hover:bg-champagne-dark gap-2"><Save size={18} />保存设置</Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="general" className="gap-2"><Globe size={16} /><span className="hidden sm:inline">基本设置</span></TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell size={16} /><span className="hidden sm:inline">通知设置</span></TabsTrigger>
          <TabsTrigger value="payment" className="gap-2"><CreditCard size={16} /><span className="hidden sm:inline">支付设置</span></TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield size={16} /><span className="hidden sm:inline">安全设置</span></TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader><CardTitle>基本设置</CardTitle><CardDescription>配置网站基本信息</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label htmlFor="siteName">网站名称</Label><Input id="siteName" value={generalSettings.siteName} onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="siteDescription">网站描述</Label><Input id="siteDescription" value={generalSettings.siteDescription} onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="contactEmail">联系邮箱</Label><Input id="contactEmail" type="email" value={generalSettings.contactEmail} onChange={(e) => setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="contactPhone">联系电话</Label><Input id="contactPhone" value={generalSettings.contactPhone} onChange={(e) => setGeneralSettings({ ...generalSettings, contactPhone: e.target.value })} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle>通知设置</CardTitle><CardDescription>配置系统通知方式</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between"><div className="space-y-0.5"><Label>邮件通知</Label><p className="text-sm text-gray-500">启用邮件通知功能</p></div><Switch checked={notificationSettings.emailNotification} onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotification: checked })} /></div>
              <Separator />
              <div className="flex items-center justify-between"><div className="space-y-0.5"><Label>订单通知</Label><p className="text-sm text-gray-500">新订单时发送通知</p></div><Switch checked={notificationSettings.orderNotification} onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, orderNotification: checked })} /></div>
              <Separator />
              <div className="flex items-center justify-between"><div className="space-y-0.5"><Label>新用户通知</Label><p className="text-sm text-gray-500">新用户注册时发送通知</p></div><Switch checked={notificationSettings.newUserNotification} onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newUserNotification: checked })} /></div>
              <Separator />
              <div className="flex items-center justify-between"><div className="space-y-0.5"><Label>提现通知</Label><p className="text-sm text-gray-500">有新的提现申请时发送通知</p></div><Switch checked={notificationSettings.withdrawalNotification} onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, withdrawalNotification: checked })} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader><CardTitle>支付设置</CardTitle><CardDescription>配置支付方式</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between"><div className="space-y-0.5"><Label>信用卡支付</Label><p className="text-sm text-gray-500">Visa、MasterCard 等</p></div><Switch checked={paymentSettings.enableCreditCard} onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, enableCreditCard: checked })} /></div>
              <Separator />
              <div className="flex items-center justify-between"><div className="space-y-0.5"><Label>PromptPay</Label><p className="text-sm text-gray-500">泰国本地支付方式</p></div><Switch checked={paymentSettings.enablePromptPay} onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, enablePromptPay: checked })} /></div>
              <Separator />
              <div className="flex items-center justify-between"><div className="space-y-0.5"><Label>微信支付</Label><p className="text-sm text-gray-500">WeChat Pay</p></div><Switch checked={paymentSettings.enableWeChatPay} onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, enableWeChatPay: checked })} /></div>
              <Separator />
              <div className="flex items-center justify-between"><div className="space-y-0.5"><Label>支付宝</Label><p className="text-sm text-gray-500">Alipay</p></div><Switch checked={paymentSettings.enableAlipay} onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, enableAlipay: checked })} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader><CardTitle>安全设置</CardTitle><CardDescription>修改管理员密码</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              {passwordError && (
                <Alert variant="destructive">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
              {passwordSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">{passwordSuccess}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="currentPassword">当前密码</Label>
                <div className="relative">
                  <Input 
                    id="currentPassword" 
                    type={showPasswords.current ? 'text' : 'password'} 
                    placeholder="请输入当前密码" 
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  >
                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">新密码</Label>
                <div className="relative">
                  <Input 
                    id="newPassword" 
                    type={showPasswords.new ? 'text' : 'password'} 
                    placeholder="请输入新密码（至少5位）" 
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  >
                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认新密码</Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword" 
                    type={showPasswords.confirm ? 'text' : 'password'} 
                    placeholder="请再次输入新密码" 
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  >
                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <Button 
                className="bg-champagne hover:bg-champagne-dark"
                onClick={handleChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? '修改中...' : '修改密码'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
