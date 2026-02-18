import { useState, useEffect } from 'react';
import { mealApi, mealConfigApi, type MealConfig } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Utensils, ArrowLeft, CheckCircle, Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function MealOrderPage() {
  const navigate = (path: string) => {
    window.location.hash = path;
  };
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configs, setConfigs] = useState<MealConfig[]>([]);
  const [activeTab, setActiveTab] = useState('BREAKFAST');
  
  const [formData, setFormData] = useState({
    roomNumber: '',
    selectedConfig: null as MealConfig | null,
    peopleCount: 1,
    remark: '',
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await mealConfigApi.getAll({ isActive: true });
      setConfigs(response.data);
    } catch (err) {
      console.error('Error fetching meal configs:', err);
    }
  };

  const filteredConfigs = configs.filter(c => c.mealType === activeTab);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.roomNumber) {
      setError('请输入房号');
      return;
    }
    if (!formData.selectedConfig) {
      setError('请选择套餐');
      return;
    }

    setIsLoading(true);

    try {
      await mealApi.create({
        roomNumber: formData.roomNumber,
        mealConfigId: formData.selectedConfig.id,
        peopleCount: formData.peopleCount,
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
    ? formData.selectedConfig.price * formData.peopleCount 
    : 0;

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white py-12 px-4">
        <div className="max-w-md mx-auto">
          <Card className="border-amber-200">
            <CardContent className="pt-8 pb-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">订餐登记成功</h2>
              <p className="text-gray-600 mb-6">您的订餐信息已提交，我们会尽快为您安排。</p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="border-amber-300"
                >
                  返回首页
                </Button>
                <Button
                  onClick={() => {
                    setIsSuccess(false);
                    setFormData({
                      roomNumber: '',
                      selectedConfig: null,
                      peopleCount: 1,
                      remark: '',
                    });
                  }}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                >
                  继续订餐
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        <Card className="border-amber-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-500/10 to-amber-600/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <Utensils className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">订餐登记</CardTitle>
                <CardDescription>选择您喜欢的套餐</CardDescription>
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
                  className="border-amber-200 focus:border-amber-400"
                  required
                />
              </div>

              {/* Meal Type Tabs */}
              <div className="space-y-2">
                <Label>选择用餐类型</Label>
                <Tabs value={activeTab} onValueChange={(value) => {
                  setActiveTab(value);
                  // 切换用餐类型时清空已选配置
                  setFormData({ ...formData, selectedConfig: null });
                }}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="BREAKFAST">早餐</TabsTrigger>
                    <TabsTrigger value="DINNER">晚餐</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Meal Config Selection */}
              <div className="space-y-2">
                <Label>
                  选择套餐 <span className="text-red-500">*</span>
                  {formData.selectedConfig && (
                    <span className="ml-2 text-sm font-normal text-green-600">
                      ✓ 已选择: {formData.selectedConfig.name}
                    </span>
                  )}
                </Label>
                {filteredConfigs.length === 0 ? (
                  <p className="text-gray-500 text-sm">暂无{activeTab === 'BREAKFAST' ? '早餐' : '晚餐'}套餐</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredConfigs.map((config) => (
                      <div
                        key={config.id}
                        onClick={() => setFormData({ ...formData, selectedConfig: config })}
                        className={`cursor-pointer rounded-lg border-2 transition-all overflow-hidden relative ${
                          formData.selectedConfig?.id === config.id
                            ? 'border-amber-500 ring-2 ring-amber-200 bg-amber-50'
                            : 'border-gray-200 hover:border-amber-300'
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
                              <Utensils size={32} />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{config.name}</h4>
                            <Badge className="bg-amber-100 text-amber-800">฿{config.price}/人</Badge>
                          </div>
                          <p className="text-sm text-gray-500 whitespace-pre-wrap">{config.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!formData.selectedConfig && (
                  <p className="text-sm text-red-500 mt-2">请点击上方卡片选择一个套餐</p>
                )}
              </div>

              {/* People Count */}
              <div className="space-y-2">
                <Label htmlFor="peopleCount">用餐人数 <span className="text-red-500">*</span></Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="peopleCount"
                    type="number"
                    min={1}
                    max={20}
                    value={formData.peopleCount}
                    onChange={(e) => setFormData({ ...formData, peopleCount: parseInt(e.target.value) || 1 })}
                    className="border-amber-200 focus:border-amber-400 w-32"
                    required
                  />
                  <Users className="text-gray-400" size={20} />
                </div>
              </div>

              {/* Remark */}
              <div className="space-y-2">
                <Label htmlFor="remark">备注说明</Label>
                <Textarea
                  id="remark"
                  placeholder="如有特殊需求请在此说明（如素食、儿童座椅等）"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  className="border-amber-200 focus:border-amber-400 min-h-[100px]"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 text-right">{formData.remark.length}/200</p>
              </div>

              {/* Price Summary */}
              {formData.selectedConfig && (
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">{formData.selectedConfig.name}</span>
                    <span>฿{formData.selectedConfig.price} × {formData.peopleCount}人</span>
                  </div>
                  <div className="border-t border-amber-200 pt-2 flex items-center justify-between font-semibold text-lg">
                    <span>总计</span>
                    <span className="text-amber-600">฿{totalPrice}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !formData.selectedConfig}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white h-12"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  '提交订餐登记'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
