"use client";

import React, { useState } from 'react';
import {
  FriendlyErrorMessage,
  ErrorSeverity,
  ErrorCategory,
  ErrorTracker,
  generateErrorReport,
  getRecoveryActions,
} from '@/lib/friendlyErrorMessages';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  AlertTriangle,
  XCircle,
  Zap,
  ChevronDown,
  ChevronUp,
  Copy,
  Mail,
  RefreshCw,
  FileText,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface FriendlyErrorDisplayProps {
  error: Error | unknown;
  friendlyMessage: FriendlyErrorMessage;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
  showDetails?: boolean;
}

/**
 * 友善錯誤顯示組件
 * 
 * 以使用者友善的方式顯示錯誤訊息，包含：
 * - 易懂的錯誤說明
 * - 解決建議
 * - 操作按鈕
 * - 技術詳情（可選）
 * - 錯誤回報功能
 */
export function FriendlyErrorDisplay({
  error,
  friendlyMessage,
  onRetry,
  onDismiss,
  className = '',
  compact = false,
  showDetails = false,
}: FriendlyErrorDisplayProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(!compact);
  const [isReporting, setIsReporting] = useState(false);

  // 根據嚴重程度選擇圖示和樣式
  const getSeverityConfig = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return {
          icon: AlertCircle,
          variant: 'default' as const,
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-700 dark:text-blue-300',
        };
      case ErrorSeverity.MEDIUM:
        return {
          icon: AlertTriangle,
          variant: 'destructive' as const,
          bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-700 dark:text-yellow-300',
        };
      case ErrorSeverity.HIGH:
        return {
          icon: XCircle,
          variant: 'destructive' as const,
          bgColor: 'bg-red-50 dark:bg-red-950/20',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-700 dark:text-red-300',
        };
      case ErrorSeverity.CRITICAL:
        return {
          icon: Zap,
          variant: 'destructive' as const,
          bgColor: 'bg-red-100 dark:bg-red-950/40',
          borderColor: 'border-red-300 dark:border-red-700',
          textColor: 'text-red-800 dark:text-red-200',
        };
      default:
        return {
          icon: AlertCircle,
          variant: 'default' as const,
          bgColor: 'bg-gray-50 dark:bg-gray-950/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          textColor: 'text-gray-700 dark:text-gray-300',
        };
    }
  };

  const config = getSeverityConfig(friendlyMessage.severity);
  const IconComponent = config.icon;

  // 複製錯誤報告到剪貼簿
  const copyErrorReport = async () => {
    try {
      const report = generateErrorReport(error, friendlyMessage);
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      toast.success('錯誤報告已複製到剪貼簿');
    } catch (err) {
      toast.error('複製失敗');
    }
  };

  // 發送錯誤報告
  const sendErrorReport = () => {
    setIsReporting(true);
    try {
      const report = generateErrorReport(error, friendlyMessage);
      const subject = `錯誤回報 - ${friendlyMessage.title}`;
      const body = `
錯誤詳情：
${JSON.stringify(report, null, 2)}

請描述您進行的操作：
[請在此描述您的操作步驟]

問題發生的頻率：
[一次性 / 偶爾 / 經常]
      `;
      
      const mailto = `mailto:support@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailto);
      
      toast.success('已開啟郵件應用程式');
    } catch (err) {
      toast.error('無法開啟郵件應用程式');
    } finally {
      setIsReporting(false);
    }
  };

  // 追蹤錯誤
  React.useEffect(() => {
    ErrorTracker.track(error, friendlyMessage);
  }, [error, friendlyMessage]);

  // 獲取恢復建議
  const recoveryActions = getRecoveryActions(friendlyMessage);

  // 緊湊模式渲染
  if (compact) {
    return (
      <Alert className={`${config.bgColor} ${config.borderColor} ${className}`}>
        <IconComponent className={`h-4 w-4 ${config.textColor}`} />
        <AlertTitle className={config.textColor}>
          {friendlyMessage.icon} {friendlyMessage.title}
        </AlertTitle>
        <AlertDescription>
          {friendlyMessage.message}
          {friendlyMessage.actions && friendlyMessage.actions.length > 0 && (
            <div className="mt-2 flex gap-2">
              {friendlyMessage.actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={action.primary ? 'default' : 'outline'}
                  onClick={action.action}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // 完整模式渲染
  return (
    <Card className={`${config.bgColor} ${config.borderColor} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 ${config.textColor}`}>
          <IconComponent className="h-5 w-5" />
          {friendlyMessage.icon} {friendlyMessage.title}
          <Badge
            variant={config.variant}
            className="ml-auto text-xs"
          >
            {friendlyMessage.severity.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 錯誤訊息 */}
        <p className="text-sm leading-relaxed">
          {friendlyMessage.message}
        </p>

        {/* 操作按鈕 */}
        {friendlyMessage.actions && friendlyMessage.actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {friendlyMessage.actions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant={action.primary ? 'default' : 'outline'}
                onClick={action.action}
              >
                {action.label}
              </Button>
            ))}
            {onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-1" />
                重試
              </Button>
            )}
          </div>
        )}

        {/* 解決建議 */}
        {friendlyMessage.suggestions.length > 0 && (
          <Collapsible open={showSuggestions} onOpenChange={setShowSuggestions}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 text-sm font-medium">
                <span>解決建議</span>
                {showSuggestions ? (
                  <ChevronUp className="h-4 w-4 ml-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-1" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {friendlyMessage.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* 恢復操作 */}
        {recoveryActions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">快速修復：</h4>
            <div className="flex flex-wrap gap-2">
              {recoveryActions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="secondary"
                  onClick={action.action}
                  className="text-xs"
                >
                  {action.automatic && <Clock className="h-3 w-3 mr-1" />}
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* 技術詳情和回報 */}
        <div className="flex items-center gap-2 pt-2 border-t">
          {showDetails && (
            <Collapsible open={showTechnicalDetails} onOpenChange={setShowTechnicalDetails}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <FileText className="h-4 w-4 mr-1" />
                  技術詳情
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(error, null, 2)}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          )}

          <Button size="sm" variant="ghost" onClick={copyErrorReport}>
            <Copy className="h-4 w-4 mr-1" />
            複製報告
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost">
                <Mail className="h-4 w-4 mr-1" />
                回報問題
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>回報錯誤</DialogTitle>
                <DialogDescription>
                  請描述問題發生時的情況，這將幫助我們更快解決問題。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">錯誤描述：</label>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    {friendlyMessage.title} - {friendlyMessage.message}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">您的操作步驟：</label>
                  <Textarea 
                    placeholder="請描述您進行的操作..." 
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={sendErrorReport} disabled={isReporting}>
                    {isReporting ? '發送中...' : '發送報告'}
                  </Button>
                  <Button variant="outline" onClick={copyErrorReport}>
                    複製詳情
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss} className="ml-auto">
              <CheckCircle className="h-4 w-4 mr-1" />
              已了解
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 錯誤邊界組件
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error | unknown) => React.ReactNode;
}

export class FriendlyErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean; error: Error | unknown }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error | unknown) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error | unknown, errorInfo: React.ErrorInfo) {
    console.error('Error caught by FriendlyErrorBoundary:', error, errorInfo);
    ErrorTracker.track(error, {
      title: '應用程式錯誤',
      message: '應用程式發生未預期的錯誤。',
      category: ErrorCategory.CLIENT_ERROR,
      severity: ErrorSeverity.HIGH,
      suggestions: [
        '重新載入頁面',
        '清除瀏覽器快取',
        '聯繫技術支援'
      ],
      icon: '💥',
      recoverable: true,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }

      return (
        <FriendlyErrorDisplay
          error={this.state.error}
          friendlyMessage={{
            title: '應用程式發生錯誤',
            message: '很抱歉，應用程式遇到了未預期的問題。',
            category: ErrorCategory.CLIENT_ERROR,
            severity: ErrorSeverity.HIGH,
            suggestions: [
              '重新載入頁面通常能解決問題',
              '檢查瀏覽器是否為最新版本',
              '清除瀏覽器快取和 Cookies'
            ],
            actions: [
              {
                label: '重新載入',
                action: () => window.location.reload(),
                primary: true,
              },
              {
                label: '返回首頁',
                action: () => window.location.href = '/',
              },
            ],
            icon: '💥',
            recoverable: true,
          }}
          onRetry={() => this.setState({ hasError: false, error: null })}
          showDetails={true}
        />
      );
    }

    return this.props.children;
  }
}