import { useState, useEffect } from 'react';
import { carApi, carConfigApi, type CarConfig } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Car, ArrowLeft, CheckCircle, CalendarDays, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CarRentalPage() {
  const navigate = (path: string) => {
    window.location.hash = path;
  };
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configs, setConfigs] = useState<CarConfig[]>([]);
  
  const [formData, setFormData] = useState({
    roomNumber: '',
    selectedConfig: null as CarConfig | null,
    startDate: '',
    endDate: '',
    days: 1,
    remark: '',
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await carConfigApi.getAll({ isActive: true });
      setConfigs(response.data);
    } catch (err) {
      console.error('Error fetching car configs:', err);
    }
  };

  // 计算天数
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setFormData(prev => ({ ...prev, days: Math.max(1, diffDays) }));
    }
  }, [formData.startDate, formData.endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.roomNumber) {
      setError('请输入房号');
      return;
    }
    if (!formData.selectedConfig) {
      setError('请选择车辆');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setError('请选择租赁日期');
      return;
    }

    setIsLoading(true);

    try {
      await carApi.create({
        roomNumber: formData.roomNumber,
        carConfigId: formData.selectedConfig.id,
        startTime: new Date(formData.startDate).toISOString(),
        endTime: new Date(formData.endDate).toISOString(),
        days: formData.days,
        remark: formData.remark,
      });

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || '提交失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPrice = formData.selectedConfig 
    ? formData.selectedConfig.price * formData.days 
    : 0;

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-cream py-12 px-4 animate-fade-in">
        <div className="max-w-md mx-auto">
          <Card className="border-champagne/20 shadow-card">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-20 h-20 bg-champagne/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-champagne" />
              </div>
              <h2 className="text-3xl font-serif text-ink mb-3">租车登记成功</h2>
              <p className="text-warm-gray mb-8">您的租车申请已提交，我们会尽快为您安排。</p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="border-champagne text-champagne hover:bg-champagne hover:text-white rounded-lg"
                >
                  返回首页
                </Button>
                <Button
                  onClick={() => {
                    setIsSuccess(false);
                    setFormData({
                      roomNumber: '',
                      selectedConfig: null,
                      startDate: '',
                      endDate: '',
                      days: 1,
                      remark: '',
                    });
                  }}
                  className="bg-champagne hover:bg-champagne-dark text-white rounded-lg"
                >
                  继续租车
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-12 px-4 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 text-warm-gray hover:text-ink hover:bg-champagne/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        <Card className="border-champagne/20 shadow-card">
          <CardHeader className="bg-champagne/5 border-b border-champagne/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-champagne rounded-xl shadow-md">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-serif text-ink">租车登记</CardTitle>
                <CardDescription className="text-warm-gray">选择您需要的车辆</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-4 border-red-300 bg-red-50">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Room Number */}
              <div className="space-y-2">
                <Label htmlFor="roomNumber" className="text-ink font-medium">
                  房号 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="roomNumber"
                  placeholder="请输入您的房号，如：A101"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  className="border-champagne/30 focus:border-champagne focus:ring-champagne/20 rounded-lg bg-white"
                  required
                />
              </div>

              {/* Car Selection */}
              <div className="space-y-2">
                <Label className="text-ink font-medium">
                  选择车辆 <span className="text-red-500">*</span>
                  {formData.selectedConfig && (
                    <span className="ml-2 text-sm font-normal text-champagne">
                      ✓ 已选择: {formData.selectedConfig.name}
                    </span>
                  )}
                </Label>
                {configs.length === 0 ? (
                  <p className="text-warm-gray text-sm">暂无可租用车辆</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {configs.map((config) => (
                      <div
                        key={config.id}
                        onClick={() => setFormData({ ...formData, selectedConfig: config })}
                        className={`cursor-pointer rounded-xl border-2 transition-all duration-300 overflow-hidden relative group bg-white ${
                          formData.selectedConfig?.id === config.id
                            ? 'border-champagne ring-2 ring-champagne/20 shadow-md'
                            : 'border-champagne/20 hover:border-champagne/50 hover:shadow-md'
                        }`}
                      >
                        {formData.selectedConfig?.id === config.id && (
                          <div className="absolute top-3 left-3 bg-champagne text-white text-xs px-3 py-1.5 rounded-full z-10 font-medium">
                            ✓ 已选中
                          </div>
                        )}
                        <div className="aspect-video bg-gray-100">
                          {config.image ? (
                            <img 
                              src={config.image} 
                              alt={config.name} 
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-warm-gray">
                              <Car size={40} className="text-champagne/40" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-serif text-lg text-ink">{config.name}</h4>
                            <Badge className="bg-champagne/10 text-champagne border-champagne/30 font-medium">
                              ฿{config.price}/天
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-warm-gray">
                            <Badge variant="outline" className="border-champagne/30 text-warm-gray">
                              {config.carType}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Users size={14} className="text-champagne" />
                              {config.seats}座
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!formData.selectedConfig && (
                  <p className="text-sm text-warm-gray mt-2">请点击上方卡片选择一辆车</p>
                )}
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-ink font-medium">
                    <CalendarDays className="inline w-4 h-4 mr-1 text-champagne" />
                    取车日期 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="border-champagne/30 focus:border-champagne focus:ring-champagne/20 rounded-lg bg-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-ink font-medium">
                    <CalendarDays className="inline w-4 h-4 mr-1 text-champagne" />
                    还车日期 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="border-champagne/30 focus:border-champagne focus:ring-champagne/20 rounded-lg bg-white"
                    required
                  />
                </div>
              </div>

              {/* Days */}
              <div className="space-y-2">
                <Label className="text-ink font-medium">租赁天数</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={1}
                    value={formData.days}
                    readOnly
                    className="border-champagne/30 focus:border-champagne focus:ring-champagne/20 w-24 bg-champagne/5 rounded-lg text-ink font-medium"
                  />
                  <span className="text-warm-gray">天</span>
                </div>
              </div>

              {/* Remark */}
              <div className="space-y-2">
                <Label htmlFor="remark" className="text-ink font-medium">备注说明</Label>
                <Textarea
                  id="remark"
                  placeholder="如有特殊需求请在此说明"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  className="border-champagne/30 focus:border-champagne focus:ring-champagne/20 min-h-[100px] rounded-lg bg-white resize-none"
                  maxLength={200}
                />
                <p className="text-xs text-warm-gray text-right">{formData.remark.length}/200</p>
              </div>

              {/* Price Summary */}
              {formData.selectedConfig && (
                <div className="bg-champagne/5 rounded-xl p-5 border border-champagne/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-warm-gray">{formData.selectedConfig.name}</span>
                    <span className="text-ink">฿{formData.selectedConfig.price} × {formData.days}天</span>
                  </div>
                  <div className="border-t border-champagne/20 pt-3 flex items-center justify-between">
                    <span className="font-serif text-xl text-ink">总计</span>
                    <span className="text-2xl font-serif text-champagne font-semibold">฿{totalPrice}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !formData.selectedConfig}
                className="w-full bg-champagne hover:bg-champagne-dark text-white h-12 rounded-lg text-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  '提交租车登记'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
