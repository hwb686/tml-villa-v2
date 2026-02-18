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
      <div className="min-h-screen bg-gradient-to-b from-green-50/50 to-white py-12 px-4">
        <div className="max-w-md mx-auto">
          <Card className="border-green-200">
            <CardContent className="pt-8 pb-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">租车登记成功</h2>
              <p className="text-gray-600 mb-6">您的租车申请已提交，我们会尽快为您安排。</p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="border-green-300"
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
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
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
    <div className="min-h-screen bg-gradient-to-b from-green-50/50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        <Card className="border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-500/10 to-green-600/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">租车登记</CardTitle>
                <CardDescription>选择您需要的车辆</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Room Number */}
              <div className="space-y-2">
                <Label htmlFor="roomNumber">房号 <span className="text-red-500">*</span></Label>
                <Input
                  id="roomNumber"
                  placeholder="请输入您的房号，如：A101"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  className="border-green-200 focus:border-green-400"
                  required
                />
              </div>

              {/* Car Selection */}
              <div className="space-y-2">
                <Label>
                  选择车辆 <span className="text-red-500">*</span>
                  {formData.selectedConfig && (
                    <span className="ml-2 text-sm font-normal text-green-600">
                      ✓ 已选择: {formData.selectedConfig.name}
                    </span>
                  )}
                </Label>
                {configs.length === 0 ? (
                  <p className="text-gray-500 text-sm">暂无可租用车辆</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {configs.map((config) => (
                      <div
                        key={config.id}
                        onClick={() => setFormData({ ...formData, selectedConfig: config })}
                        className={`cursor-pointer rounded-lg border-2 transition-all overflow-hidden relative ${
                          formData.selectedConfig?.id === config.id
                            ? 'border-green-500 ring-2 ring-green-200 bg-green-50'
                            : 'border-gray-200 hover:border-green-300'
                        }`}
                      >
                        {formData.selectedConfig?.id === config.id && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-10">
                            ✓ 已选中
                          </div>
                        )}
                        <div className="aspect-video bg-gray-100">
                          {config.image ? (
                            <img src={config.image} alt={config.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <Car size={32} />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{config.name}</h4>
                            <Badge className="bg-green-100 text-green-800">฿{config.price}/天</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Badge variant="outline">{config.carType}</Badge>
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {config.seats}座
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!formData.selectedConfig && (
                  <p className="text-sm text-red-500 mt-2">请点击上方卡片选择一辆车</p>
                )}
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    <CalendarDays className="inline w-4 h-4 mr-1" />
                    取车日期 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="border-green-200 focus:border-green-400"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">
                    <CalendarDays className="inline w-4 h-4 mr-1" />
                    还车日期 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="border-green-200 focus:border-green-400"
                    required
                  />
                </div>
              </div>

              {/* Days */}
              <div className="space-y-2">
                <Label>租赁天数</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={1}
                    value={formData.days}
                    readOnly
                    className="border-green-200 focus:border-green-400 w-24 bg-gray-50"
                  />
                  <span className="text-gray-500">天</span>
                </div>
              </div>

              {/* Remark */}
              <div className="space-y-2">
                <Label htmlFor="remark">备注说明</Label>
                <Textarea
                  id="remark"
                  placeholder="如有特殊需求请在此说明"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  className="border-green-200 focus:border-green-400 min-h-[100px]"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 text-right">{formData.remark.length}/200</p>
              </div>

              {/* Price Summary */}
              {formData.selectedConfig && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">{formData.selectedConfig.name}</span>
                    <span>฿{formData.selectedConfig.price} × {formData.days}天</span>
                  </div>
                  <div className="border-t border-green-200 pt-2 flex items-center justify-between font-semibold text-lg">
                    <span>总计</span>
                    <span className="text-green-600">฿{totalPrice}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !formData.selectedConfig}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white h-12"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
