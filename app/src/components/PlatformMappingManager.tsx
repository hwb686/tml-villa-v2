import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { platformSyncApi, type PlatformMapping, type SyncStatus } from '@/services/platformSyncApi';
import { useLanguage } from '@/hooks/useLanguage';

interface PlatformMappingManagerProps {
  homestayId: string;
}

const PLATFORMS = [
  { id: 'agoda', name: 'Agoda', color: 'bg-orange-500', textColor: 'text-orange-500' },
  { id: 'airbnb', name: 'Airbnb', color: 'bg-red-500', textColor: 'text-red-500' },
  { id: 'booking', name: 'Booking.com', color: 'bg-blue-600', textColor: 'text-blue-600' },
  { id: 'trip', name: 'Trip.com', color: 'bg-teal-500', textColor: 'text-teal-500' }
];

export function PlatformMappingManager({ homestayId }: PlatformMappingManagerProps) {
  const { t, lang } = useLanguage();
  const [, setMapping] = useState<PlatformMapping | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    loadMappingData();
  }, [homestayId]);

  const loadMappingData = async () => {
    try {
      setLoading(true);
      const [mappingResponse, statusResponse] = await Promise.all([
        platformSyncApi.getRoomMappings(homestayId),
        platformSyncApi.getSyncStatus(homestayId)
      ]);
      
      setMapping(mappingResponse.data);
      setSyncStatus(statusResponse.data);
      
      // 初始化表单数据
      const initialData: Record<string, string> = {};
      PLATFORMS.forEach(platform => {
        const fieldKey = `${platform.id}RoomId`;
        initialData[fieldKey] = mappingResponse.data[fieldKey as keyof PlatformMapping] as string || '';
      });
      setFormData(initialData);
    } catch (error) {
      console.error('加载映射数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (platformId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [`${platformId}RoomId`]: value
    }));
  };

  const verifyRoomId = async (platformId: string) => {
    const roomId = formData[`${platformId}RoomId`];
    if (!roomId) return;

    try {
      setVerifying(prev => ({ ...prev, [platformId]: true }));
      const response = await platformSyncApi.verifyPlatformRoom(platformId, roomId);
      
      if (response.data.isValid) {
        alert(`${PLATFORMS.find(p => p.id === platformId)?.name} 房间ID验证成功！`);
      } else {
        alert(`${PLATFORMS.find(p => p.id === platformId)?.name} 房间ID验证失败：${response.data.details}`);
      }
    } catch (error) {
      alert(`${PLATFORMS.find(p => p.id === platformId)?.name} 验证过程中出错`);
    } finally {
      setVerifying(prev => ({ ...prev, [platformId]: false }));
    }
  };

  const saveMapping = async () => {
    try {
      setSaving(true);
      const updateData: any = {};
      
      PLATFORMS.forEach(platform => {
        const fieldKey = `${platform.id}RoomId`;
        if (formData[fieldKey]) {
          updateData[fieldKey] = formData[fieldKey];
        }
      });
      
      await platformSyncApi.updateRoomMapping(homestayId, updateData);
      await loadMappingData(); // 重新加载数据
      
      alert(lang === 'zh' ? '映射关系保存成功' : lang === 'th' ? 'บันทึกความสัมพันธ์การแมปสำเร็จ' : 'Mapping saved successfully');
    } catch (error) {
      alert(lang === 'zh' ? '保存失败' : lang === 'th' ? 'บันทึกไม่สำเร็จ' : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleSync = async () => {
    try {
      if (syncStatus?.isSyncActive) {
        // 暂停同步
        // 这里需要添加暂停同步的API
      } else {
        // 启动同步
        await platformSyncApi.triggerSync(homestayId);
      }
      await loadMappingData();
    } catch (error) {
      console.error('切换同步状态失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin mr-2" />
        {lang === 'zh' ? '加载中...' : lang === 'th' ? 'กำลังโหลด...' : 'Loading...'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 同步控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{lang === 'zh' ? '同步控制' : lang === 'th' ? 'ควบคุมการซิงค์' : 'Sync Control'}</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={syncStatus?.isSyncActive || false}
                  onCheckedChange={toggleSync}
                />
                <span className={`text-sm font-medium ${
                  syncStatus?.isSyncActive ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {syncStatus?.isSyncActive ? 
                    (lang === 'zh' ? '同步中' : lang === 'th' ? 'กำลังซิงค์' : 'Syncing') :
                    (lang === 'zh' ? '已暂停' : lang === 'th' ? 'หยุดชั่วคราว' : 'Paused')
                  }
                </span>
              </div>
              <Button 
                onClick={() => platformSyncApi.triggerSync(homestayId)}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {lang === 'zh' ? '立即同步' : lang === 'th' ? 'ซิงค์ทันที' : 'Sync Now'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">
                {lang === 'zh' ? '最后同步' : lang === 'th' ? 'ซิงค์ล่าสุด' : 'Last Sync'}: 
                <span className="font-medium ml-2">
                  {syncStatus?.lastSyncTime ? 
                    new Date(syncStatus.lastSyncTime).toLocaleString() : 
                    (lang === 'zh' ? '从未' : lang === 'th' ? 'ไม่เคย' : 'Never')
                  }
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">
                {lang === 'zh' ? '下次同步' : lang === 'th' ? 'ซิงค์ครั้งต่อไป' : 'Next Sync'}: 
                <span className="font-medium ml-2">
                  {syncStatus?.nextSyncTime ? 
                    new Date(syncStatus.nextSyncTime).toLocaleString() : 
                    (lang === 'zh' ? '待定' : lang === 'th' ? 'รอการกำหนด' : 'Pending')
                  }
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 平台映射配置 */}
      <Card>
        <CardHeader>
          <CardTitle>
            {lang === 'zh' ? '平台房间映射' : lang === 'th' ? 'การแมปห้องแพลตฟอร์ม' : 'Platform Room Mapping'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PLATFORMS.map(platform => {
              const roomId = formData[`${platform.id}RoomId`] || '';
              const platformStatus = syncStatus?.platformStatus[platform.id];
              
              return (
                <div key={platform.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${platform.color}`}></div>
                      {platform.name}
                    </Label>
                    {platformStatus && (
                      <Badge 
                        variant={platformStatus.isConnected ? "default" : "destructive"}
                        className={platformStatus.isConnected ? platform.textColor : ""}
                      >
                        {platformStatus.isConnected ? 
                          (lang === 'zh' ? '已连接' : lang === 'th' ? 'เชื่อมต่อแล้ว' : 'Connected') :
                          (lang === 'zh' ? '连接失败' : lang === 'th' ? 'การเชื่อมต่อล้มเหลว' : 'Disconnected')
                        }
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={roomId}
                      onChange={(e) => handleInputChange(platform.id, e.target.value)}
                      placeholder={
                        lang === 'zh' ? `输入${platform.name}房间ID` :
                        lang === 'th' ? `ใส่ ID ห้อง ${platform.name}` :
                        `Enter ${platform.name} room ID`
                      }
                      className="flex-1"
                    />
                    <Button
                      onClick={() => verifyRoomId(platform.id)}
                      disabled={!roomId || verifying[platform.id]}
                      variant="outline"
                      size="sm"
                    >
                      {verifying[platform.id] ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  {platformStatus?.error && (
                    <div className="flex items-center gap-2 text-sm text-red-500">
                      <AlertCircle className="w-4 h-4" />
                      <span>{platformStatus.error}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Button 
              onClick={saveMapping}
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {lang === 'zh' ? '保存中...' : lang === 'th' ? 'กำลังบันทึก...' : 'Saving...'}
                </>
              ) : (
                lang === 'zh' ? '保存映射关系' : lang === 'th' ? 'บันทึกความสัมพันธ์การแมป' : 'Save Mapping'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}