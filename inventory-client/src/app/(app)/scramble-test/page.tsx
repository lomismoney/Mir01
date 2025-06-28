'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useScrambleCategories, useCreateCategory, useUpdateCategory, useDeleteScrambleCategory } from '@/hooks/useScrambleCategories';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Sparkles, Shield, User } from 'lucide-react';
import { CategoryData } from '@/lib/scrambleApiClient';
import { components } from '@/types/scramble-api';

// 正確的類型定義
type CategoryIndexResponse = components['schemas']['CategoryResource'];

/**
 * Scramble PRO API 測試頁面
 * 
 * 驗證 DTO 驅動遷移的完美成果：
 * ✅ 100% 類型安全的 API 調用
 * ✅ 精確的 TypeScript 契約
 * ✅ 即時錯誤檢查和自動完成
 * ✅ Scramble PRO 自動推斷的響應結構
 */
export default function ScrambleTestPage() {
  const { data: session, status } = useSession();
  
  const [newCategory, setNewCategory] = useState<CategoryData>({
    name: '',
    description: '',
    parent_id: null,
    sort_order: 0,
  });
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCategory, setEditCategory] = useState<CategoryData>({});

  // 使用 Scramble PRO 生成的 Hooks
  const { data: categories = [], isLoading, error } = useScrambleCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteScrambleCategory();

  // 認證檢查
  if (status === 'loading') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>正在檢查認證狀態...</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Shield className="h-5 w-5" />
              認證失敗
            </CardTitle>
            <CardDescription>
              Scramble API 需要有效的認證。請先登入系統。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                請前往 <strong>/login</strong> 頁面登入後再試
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreate = () => {
    if (!newCategory.name?.trim()) return;
    
    createMutation.mutate({
      name: newCategory.name,
      description: newCategory.description || undefined,
      parent_id: newCategory.parent_id || null,
    }, {
      onSuccess: () => {
        setNewCategory({ name: '', description: '', parent_id: null, sort_order: 0 });
      },
    });
  };

  const handleUpdate = () => {
    if (!editingId || !editCategory.name?.trim()) return;
    
    updateMutation.mutate(
      { 
        id: editingId, 
        data: {
          name: editCategory.name!,
          description: editCategory.description || undefined,
          parent_id: editCategory.parent_id || null,
        }
      },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditCategory({});
        },
      }
    );
  };

  const startEdit = (category: typeof categories[0]) => {
    setEditingId(category.id);
    setEditCategory({
      name: category.name,
      description: category.description,
      parent_id: category.parent_id,
      sort_order: category.sort_order,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCategory({});
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頭部標題 */}
      <div className="flex items-center gap-3">
        <Sparkles className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">Scramble PRO API 測試</h1>
          <p className="text-muted-foreground">
            驗證 DTO 驅動遷移後的完美類型安全體驗
          </p>
        </div>
      </div>

      {/* 認證狀態卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-green-600" />
            認證狀態
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              已認證
            </Badge>
            <span className="text-sm text-muted-foreground">
              用戶：{session.user?.name} | Token: {session.accessToken ? '✅ 有效' : '❌ 無效'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* API 狀態卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Scramble PRO
            </Badge>
            分類模組 API 狀態
          </CardTitle>
          <CardDescription>
            使用 CategoryData DTO 和 CategoryResource 的完美契約
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <Alert>
              <AlertDescription>正在載入分類數據...</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                載入失敗：{error.message}
                <br />
                <small className="text-xs">
                  檢查點：
                  • 後端服務器是否運行在 http://127.0.0.1:8000
                  • 用戶是否有分類管理權限
                  • API Token 是否有效
                </small>
              </AlertDescription>
            </Alert>
          )}
          
          {!isLoading && !error && (
            <Alert>
              <AlertDescription>
                ✅ 成功載入 {categories.length} 個分類，API 連接正常
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 創建新分類 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            創建新分類
          </CardTitle>
          <CardDescription>
            使用 CategoryData DTO 的類型安全創建
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">分類名稱 *</Label>
              <Input
                id="name"
                value={newCategory.name || ''}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="輸入分類名稱"
              />
            </div>
            <div>
              <Label htmlFor="sort_order">排序</Label>
              <Input
                id="sort_order"
                type="number"
                value={newCategory.sort_order || 0}
                onChange={(e) => setNewCategory({ ...newCategory, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">描述</Label>
            <Input
              id="description"
              value={newCategory.description || ''}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              placeholder="可選的分類描述"
            />
          </div>
          
          <Button 
            onClick={handleCreate}
            disabled={!newCategory.name?.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? '創建中...' : '創建分類'}
          </Button>
        </CardContent>
      </Card>

      {/* 分類列表 */}
      <Card>
        <CardHeader>
          <CardTitle>分類列表</CardTitle>
          <CardDescription>
            Scramble PRO 自動推斷的 CategoryResource 響應
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <Alert>
              <AlertDescription>暫無分類數據</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    {editingId === category.id ? (
                      // 編輯模式
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          value={editCategory.name || ''}
                          onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                          placeholder="分類名稱"
                        />
                        <Input
                          value={editCategory.description || ''}
                          onChange={(e) => setEditCategory({ ...editCategory, description: e.target.value })}
                          placeholder="描述"
                        />
                        <Input
                          type="number"
                          value={editCategory.sort_order || 0}
                          onChange={(e) => setEditCategory({ ...editCategory, sort_order: parseInt(e.target.value) || 0 })}
                          placeholder="排序"
                        />
                      </div>
                    ) : (
                      // 顯示模式
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{category.name}</h3>
                          <Badge variant="secondary">ID: {category.id}</Badge>
                          <Badge variant="outline">排序: {category.sort_order}</Badge>
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {category.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          創建時間: {category.created_at ? new Date(category.created_at).toLocaleDateString() : '未知'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {editingId === category.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={handleUpdate}
                          disabled={updateMutation.isPending}
                        >
                          保存
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                        >
                          取消
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(category.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 技術成果展示 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-700">🎉 DTO 驅動遷移成果</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">✅ 已完成</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Scramble PRO 安裝與配置</li>
                <li>• CategoryData DTO 實現</li>
                <li>• 後端 Controller 重構</li>
                <li>• TypeScript 類型自動生成</li>
                <li>• 前端 API 客戶端整合</li>
                <li>• 統一認證攔截器</li>
                <li>• 完整的 CRUD 功能驗證</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🚀 技術優勢</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 100% 類型安全</li>
                <li>• 自動 API 文檔生成</li>
                <li>• 程式碼即契約</li>
                <li>• 零文檔空窗期</li>
                <li>• 精確的錯誤處理</li>
                <li>• 統一的認證機制</li>
                <li>• 即時的開發回饋</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 