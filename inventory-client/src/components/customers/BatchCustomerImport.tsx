import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useErrorHandler } from '@/hooks';
import { 
  Upload, 
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Copy
} from 'lucide-react';
import { useBatchImportCustomers } from '@/hooks/mutations/useBatchMutations';

/**
 * 批量客戶導入組件
 * 
 * 支援：
 * - CSV 格式文本導入
 * - 實時進度追蹤
 * - 錯誤處理和報告
 * - 範例模板
 */
export function BatchCustomerImport() {
  const [isOpen, setIsOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importResults, setImportResults] = useState<{
    succeeded: any[];
    failed: Array<{ index: number; error: string }>;
  } | null>(null);

  const batchImport = useBatchImportCustomers();
  const { handleError, handleSuccess } = useErrorHandler();

  // 範例 CSV 模板
  const sampleCsv = `姓名,電子郵件,電話,地址
張三,zhang3@example.com,0912345678,台北市中正區重慶南路一段122號
李四,li4@example.com,0923456789,台北市大安區忠孝東路三段1號
王五,wang5@example.com,0934567890,台北市信義區松仁路100號`;

  // 解析 CSV 文本
  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV 格式錯誤：至少需要標題行和一行數據');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const expectedHeaders = ['姓名', '電子郵件', '電話', '地址'];
    
    // 驗證標題
    const hasAllHeaders = expectedHeaders.every(h => headers.includes(h));
    if (!hasAllHeaders) {
      throw new Error(`CSV 標題錯誤：需要包含 ${expectedHeaders.join(', ')}`);
    }

    // 解析數據行
    const customers = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) {
        throw new Error(`第 ${i + 1} 行格式錯誤：欄位數量不匹配`);
      }

      const customer: any = {};
      headers.forEach((header, index) => {
        switch (header) {
          case '姓名':
            customer.name = values[index];
            break;
          case '電子郵件':
            customer.email = values[index] || undefined;
            break;
          case '電話':
            customer.phone = values[index] || undefined;
            break;
          case '地址':
            customer.address = values[index] || undefined;
            break;
        }
      });

      // 驗證必填欄位
      if (!customer.name) {
        throw new Error(`第 ${i + 1} 行錯誤：姓名為必填欄位`);
      }

      customers.push(customer);
    }

    return customers;
  };

  // 處理導入
  const handleImport = async () => {
    try {
      // 解析 CSV
      const customers = parseCSV(csvText);
      
      if (customers.length === 0) {
        handleError(new Error('沒有可導入的客戶數據'));
        return;
      }

      // 執行批量導入
      const result = await batchImport.mutateAsync(customers);
      setImportResults(result);

      // 如果全部成功，關閉對話框
      if (result.failed.length === 0) {
        handleSuccess(`成功導入 ${result.succeeded.length} 個客戶`);
        setTimeout(() => {
          setIsOpen(false);
          setCsvText('');
          setImportResults(null);
        }, 2000);
      }
    } catch (error) {
      handleError(error);
    }
  };

  // 複製範例
  const copyExample = () => {
    navigator.clipboard.writeText(sampleCsv);
    handleSuccess('範例已複製到剪貼板');
  };

  // 下載錯誤報告
  const downloadErrorReport = () => {
    if (!importResults) return;

    const report = [
      '客戶批量導入錯誤報告',
      `導入時間: ${new Date().toLocaleString()}`,
      `成功: ${importResults.succeeded.length}`,
      `失敗: ${importResults.failed.length}`,
      '',
      '失敗詳情:',
      ...importResults.failed.map(f => 
        `第 ${f.index + 2} 行: ${f.error}`
      ),
    ].join('\n');

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-errors-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isProcessing = batchImport.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          批量導入
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>批量導入客戶</DialogTitle>
          <DialogDescription>
            使用 CSV 格式批量導入客戶資料
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* CSV 輸入區 */}
          {!importResults && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">
                    貼上 CSV 數據
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyExample}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    複製範例
                  </Button>
                </div>
                <Textarea
                  placeholder={sampleCsv}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="font-mono text-sm h-64"
                  disabled={isProcessing}
                />
              </div>

              {/* 格式說明 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV 格式說明
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <ul className="space-y-1">
                    <li>• 第一行必須是標題：姓名,電子郵件,電話,地址</li>
                    <li>• 姓名為必填欄位，其他欄位可選</li>
                    <li>• 每行代表一個客戶，用逗號分隔各欄位</li>
                    <li>• 支援中文，建議使用 UTF-8 編碼</li>
                  </ul>
                </CardContent>
              </Card>
            </>
          )}

          {/* 導入進度 */}
          {isProcessing && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  正在導入客戶數據...
                </p>
              </CardContent>
            </Card>
          )}

          {/* 導入結果 */}
          {importResults && !isProcessing && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">導入結果</CardTitle>
              </CardHeader>
              <CardContent>
                {/* 統計 */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {importResults.succeeded.length + importResults.failed.length}
                    </div>
                    <div className="text-sm text-muted-foreground">總計</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {importResults.succeeded.length}
                    </div>
                    <div className="text-sm text-muted-foreground">成功</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {importResults.failed.length}
                    </div>
                    <div className="text-sm text-muted-foreground">失敗</div>
                  </div>
                </div>

                {/* 成功率進度條 */}
                <div className="mb-4">
                  <Progress 
                    value={
                      (importResults.succeeded.length / 
                      (importResults.succeeded.length + importResults.failed.length)) * 100
                    } 
                  />
                </div>

                {/* 失敗詳情 */}
                {importResults.failed.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">失敗詳情</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={downloadErrorReport}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        下載報告
                      </Button>
                    </div>
                    <div className="max-h-40 overflow-auto space-y-1">
                      {importResults.failed.map((item) => (
                        <div
                          key={item.index}
                          className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded text-sm"
                        >
                          <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                          <div>
                            <div className="font-medium">
                              第 {item.index + 2} 行
                            </div>
                            <div className="text-red-600">{item.error}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 成功提示 */}
                {importResults.succeeded.length > 0 && 
                 importResults.failed.length === 0 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>所有客戶都已成功導入！</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              setCsvText('');
              setImportResults(null);
            }}
            disabled={isProcessing}
          >
            {importResults ? '關閉' : '取消'}
          </Button>
          
          {!importResults && (
            <Button
              onClick={handleImport}
              disabled={!csvText.trim() || isProcessing}
            >
              開始導入
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}