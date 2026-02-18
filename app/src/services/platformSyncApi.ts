import { fetchApi } from './api';

// 平台同步相关API接口
export const platformSyncApi = {
  // 获取房间平台映射
  getRoomMappings: (homestayId: string) => fetchApi<PlatformMapping>(`/homestays/${homestayId}/platform-mappings`),
  
  // 更新房间平台映射
  updateRoomMapping: (homestayId: string, data: PlatformMappingUpdate) => 
    fetchApi<PlatformMapping>(`/homestays/${homestayId}/platform-mappings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // 验证平台房间ID
  verifyPlatformRoom: (platform: string, roomId: string) => 
    fetchApi<VerificationResult>(`/platforms/${platform}/verify-room/${roomId}`),
  
  // 手动触发同步
  triggerSync: (homestayId: string) => 
    fetchApi<SyncResult>(`/homestays/${homestayId}/sync`, { method: 'POST' }),
  
  // 获取同步状态
  getSyncStatus: (homestayId: string) => 
    fetchApi<SyncStatus>(`/homestays/${homestayId}/sync-status`),
  
  // 获取不可用日期
  getUnavailableDates: (homestayId: string) => 
    fetchApi<string[]>(`/homestays/${homestayId}/unavailable-dates`),
  
  // 更新不可用日期
  updateUnavailableDates: (homestayId: string, dates: string[]) => 
    fetchApi<void>(`/homestays/${homestayId}/unavailable-dates`, {
      method: 'PUT',
      body: JSON.stringify({ dates }),
    }),
};

// 平台映射相关类型
export interface PlatformMapping {
  id: string;
  homestayId: string;
  agodaRoomId?: string;
  airbnbListingId?: string;
  bookingRoomId?: string;
  tripRoomId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformMappingUpdate {
  agodaRoomId?: string;
  airbnbListingId?: string;
  bookingRoomId?: string;
  tripRoomId?: string;
}

export interface VerificationResult {
  isValid: boolean;
  platform: string;
  roomId: string;
  details?: any;
}

export interface SyncResult {
  success: boolean;
  syncedPlatforms: string[];
  failedPlatforms: string[];
  message?: string;
}

export interface SyncStatus {
  homestayId: string;
  isSyncActive: boolean;
  lastSyncTime?: string;
  nextSyncTime?: string;
  platformStatus: Record<string, {
    isConnected: boolean;
    lastSync?: string;
    error?: string;
  }>;
}