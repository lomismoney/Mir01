/**
 * 標準表單組件
 * 
 * 提供統一的表單UI結構和行為，包括：
 * 1. 標準化的表單佈局和樣式
 * 2. 統一的錯誤處理和顯示
 * 3. 載入狀態管理
 * 4. 提交和取消操作
 */

import React from "react";
import { z } from "zod";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertCircle, CheckCircle } from "lucide-react";

export interface StandardFormProps<TSchema extends z.ZodType = z.ZodType> {
  title: string;
  description?: string;
  form: UseFormReturn<z.infer<TSchema>>;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  children: React.ReactNode;
  className?: string;
  showSuccessMessage?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export function StandardForm<TSchema extends z.ZodType = z.ZodType>({
  title,
  description,
  form,
  isSubmitting,
  onSubmit,
  onCancel,
  submitText = "提交",
  cancelText = "取消",
  children,
  className = "",
  showSuccessMessage = false,
  successMessage,
  errorMessage,
}: StandardFormProps<TSchema>) {
  const { formState } = form;
  const hasErrors = Object.keys(formState.errors).length > 0;

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 成功訊息 */}
        {showSuccessMessage && successMessage && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* 錯誤訊息 */}
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* 表單驗證錯誤摘要 */}
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              請檢查以下欄位：
              <ul className="mt-2 space-y-1">
                {Object.entries(formState.errors).map(([field, error]) => (
                  <li key={field} className="text-sm">
                    • {typeof error?.message === 'string' ? error.message : `${field} 有誤`}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* 表單內容 */}
        <form onSubmit={onSubmit} className="space-y-6">
          {children}

          {/* 操作按鈕 */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {cancelText}
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={isSubmitting || hasErrors}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>處理中...</span>
                </div>
              ) : (
                submitText
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * 簡化版表單組件（無卡片包裝）
 */
export interface StandardFormInlineProps<TSchema extends z.ZodType = z.ZodType> 
  extends Omit<StandardFormProps<TSchema>, 'title' | 'description' | 'className'> {
  className?: string;
}

/**
 * Dialog 版表單組件（適用於對話框）
 */
export interface StandardFormDialogProps<TSchema extends z.ZodType = z.ZodType> 
  extends StandardFormProps<TSchema> {
}

export function StandardFormInline<TSchema extends z.ZodType = z.ZodType>({
  form,
  isSubmitting,
  onSubmit,
  onCancel,
  submitText = "提交",
  cancelText = "取消",
  children,
  className = "",
  showSuccessMessage = false,
  successMessage,
  errorMessage,
}: StandardFormInlineProps<TSchema>) {
  const { formState } = form;
  const hasErrors = Object.keys(formState.errors).length > 0;

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* 狀態訊息 */}
      {showSuccessMessage && successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* 表單 */}
      <form onSubmit={onSubmit} className="space-y-6">
        {children}

        <div className="flex items-center justify-end space-x-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {cancelText}
            </Button>
          )}
          
          <Button
            type="submit"
            disabled={isSubmitting || hasErrors}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span>處理中...</span>
              </div>
            ) : (
              submitText
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

/**
 * Dialog 版表單組件（適用於對話框）
 */
export function StandardFormDialog<TSchema extends z.ZodType = z.ZodType>({
  title,
  description,
  form,
  isSubmitting,
  onSubmit,
  onCancel,
  submitText = "提交",
  cancelText = "取消",
  children,
  className = "",
  showSuccessMessage = false,
  successMessage,
  errorMessage,
}: StandardFormDialogProps<TSchema>) {
  const { formState } = form;
  const hasErrors = Object.keys(formState.errors).length > 0;

  return (
    <div className={`w-full ${className}`}>
      {/* Dialog Header */}
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {/* Dialog Content */}
      <div className="px-6 py-4 space-y-6">
        {/* 成功訊息 */}
        {showSuccessMessage && successMessage && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* 錯誤訊息 */}
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* 表單驗證錯誤摘要 */}
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              請檢查以下欄位：
              <ul className="mt-2 space-y-1">
                {Object.entries(formState.errors).map(([field, error]) => (
                  <li key={field} className="text-sm">
                    • {typeof error?.message === 'string' ? error.message : `${field} 有誤`}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* 表單內容 */}
        <form onSubmit={onSubmit} className="space-y-6">
          {children}
        </form>
      </div>

      {/* Dialog Footer */}
      <div className="px-6 py-4 border-t flex items-center justify-end space-x-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelText}
          </Button>
        )}
        
        <Button
          type="submit"
          disabled={isSubmitting || hasErrors}
          className="min-w-[100px]"
          onClick={onSubmit}
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span>處理中...</span>
            </div>
          ) : (
            submitText
          )}
        </Button>
      </div>
    </div>
  );
}