import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { userApi, bookingApi, favoriteApi } from '@/services/api';
import { getHashLink } from '@/lib/router';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';
import {
  User, Mail, Phone, Calendar, Heart, Package, Settings,
  Edit2, Lock, LogOut, ChevronRight, Star, MapPin, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserInfo {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  avatar: string | null;
  isHost: boolean;
  createdAt: string;
}

interface Booking {
  id: string;
  homestayId: string;
  homestay: {
    id: string;
    title: string;
    location: string;
    images: string[];
    price: number;
  } | null;
  checkIn: string | null;
  checkOut: string | null;
  guests: number | null;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface Favorite {
  id: string;
  createdAt: string;
  homestay: {
    id: string;
    title: string;
    location: string;
    price: number;
    rating: number;
    reviews: number;
    images: string[];
    type: string;
    isFavorite: boolean;
  };
}

export default function UserCenter() {
  const { t, lang } = useLanguage();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    username: '',
    phone: '',
  });

  // 密码表单状态
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      
      if (!token) {
        window.location.hash = '/';
        return;
      }

      // 加载用户信息
      const userRes = await userApi.getMe();
      setUser(userRes.data);
      setEditForm({
        username: userRes.data.username,
        phone: userRes.data.phone || '',
      });

      // 加载订单
      try {
        const bookingsRes = await bookingApi.getMyBookings();
        setBookings(bookingsRes.data);
      } catch (e) {
        console.log('No bookings');
      }

      // 加载收藏
      try {
        const favoritesRes = await favoriteApi.getAll();
        setFavorites(favoritesRes.data);
      } catch (e) {
        console.log('No favorites');
      }

    } catch (err) {
      console.error('Failed to load user data:', err);
      localStorage.removeItem('userToken');
      window.location.hash = '/';
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setMessage(null);
      const res = await userApi.updateProfile({
        username: editForm.username,
        phone: editForm.phone || null,
      });
      setUser(res.data);
      setEditDialogOpen(false);
      setMessage({ type: 'success', text: '个人信息更新成功' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '更新失败' });
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的密码不一致' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: '密码长度不能少于6位' });
      return;
    }

    try {
      setMessage(null);
      await userApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordDialogOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: '密码修改成功' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '密码修改失败' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    window.location.hash = '/';
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: '待确认', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: '已确认', className: 'bg-blue-100 text-blue-800' },
      completed: { label: '已完成', className: 'bg-green-100 text-green-800' },
      cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-800' },
    };
    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar onSearchClick={() => {}} />
        <div className="pt-36 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-champagne" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSearchClick={() => {}} />
      
      <div className="pt-36 pb-20">
        <div className="container-luxury">
          {/* 消息提示 */}
          {message && (
            <Alert className={`mb-4 ${message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* 用户信息卡片 */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="bg-champagne text-white text-2xl">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h1 className="text-2xl font-serif font-medium text-ink">{user.username}</h1>
                  <p className="text-gray-500 mt-1">{user.email}</p>
                  {user.phone && <p className="text-gray-500 text-sm">{user.phone}</p>}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-sm text-gray-400">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      注册于 {formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit2 className="h-4 w-4 mr-2" />
                        编辑资料
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>编辑个人资料</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label htmlFor="username">用户名</Label>
                          <Input
                            id="username"
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">手机号</Label>
                          <Input
                            id="phone"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          />
                        </div>
                        <Button onClick={handleUpdateProfile} className="w-full">保存</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Lock className="h-4 w-4 mr-2" />
                        修改密码
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>修改密码</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label htmlFor="currentPassword">当前密码</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="newPassword">新密码</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">确认新密码</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          />
                        </div>
                        <Button onClick={handleChangePassword} className="w-full">确认修改</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    退出登录
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 快捷入口 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('bookings')}>
              <CardContent className="p-4 text-center">
                <Package className="h-8 w-8 mx-auto mb-2 text-champagne" />
                <p className="font-medium">我的订单</p>
                <p className="text-sm text-gray-500">{bookings.length} 个订单</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('favorites')}>
              <CardContent className="p-4 text-center">
                <Heart className="h-8 w-8 mx-auto mb-2 text-red-400" />
                <p className="font-medium">我的收藏</p>
                <p className="text-sm text-gray-500">{favorites.length} 个收藏</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setEditDialogOpen(true)}>
              <CardContent className="p-4 text-center">
                <User className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                <p className="font-medium">个人资料</p>
                <p className="text-sm text-gray-500">编辑信息</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setPasswordDialogOpen(true)}>
              <CardContent className="p-4 text-center">
                <Lock className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                <p className="font-medium">账户安全</p>
                <p className="text-sm text-gray-500">修改密码</p>
              </CardContent>
            </Card>
          </div>

          {/* 内容标签页 */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="profile">个人资料</TabsTrigger>
              <TabsTrigger value="bookings">我的订单</TabsTrigger>
              <TabsTrigger value="favorites">我的收藏</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>基本信息</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">用户名</p>
                        <p className="font-medium">{user.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">邮箱</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">手机号</p>
                        <p className="font-medium">{user.phone || '未设置'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings">
              <div className="space-y-4">
                {bookings.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">暂无订单</p>
                      <Button className="mt-4" onClick={() => window.location.hash = '/'}>
                        去预订
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  bookings.map((booking) => (
                    <Card key={booking.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row">
                        {booking.homestay?.images?.[0] && (
                          <div className="md:w-48 h-32 md:h-auto">
                            <img
                              src={booking.homestay.images[0]}
                              alt={booking.homestay.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium text-ink">
                                {booking.homestay?.title || '民宿预订'}
                              </h3>
                              {booking.homestay?.location && (
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {booking.homestay.location}
                                </p>
                              )}
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            {booking.checkIn && (
                              <span>入住: {formatDate(booking.checkIn)}</span>
                            )}
                            {booking.checkOut && (
                              <span>退房: {formatDate(booking.checkOut)}</span>
                            )}
                            {booking.guests && (
                              <span>房客: {booking.guests}人</span>
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <p className="text-lg font-medium text-champagne">
                              ¥{booking.totalPrice}
                            </p>
                            <Button variant="outline" size="sm" asChild>
                              <a href={getHashLink(`/homestay/${booking.homestayId}`)}>
                                查看详情
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="favorites">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="p-12 text-center">
                      <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">暂无收藏</p>
                      <Button className="mt-4" onClick={() => window.location.hash = '/'}>
                        去发现
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  favorites.map((favorite) => (
                    <Card key={favorite.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                      <a href={getHashLink(`/homestay/${favorite.homestay.id}`)}>
                        <div className="relative aspect-[4/3]">
                          <img
                            src={favorite.homestay.images?.[0] || '/images/placeholder.jpg'}
                            alt={favorite.homestay.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 right-3">
                            <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-medium text-ink truncate">{favorite.homestay.title}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {favorite.homestay.location}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <p className="text-champagne font-medium">
                              ¥{favorite.homestay.price}<span className="text-sm text-gray-500">/晚</span>
                            </p>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {favorite.homestay.rating}
                            </div>
                          </div>
                        </CardContent>
                      </a>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
}
