/**
 * 標準表單 Hook
 * 
 * 提供統一的表單處理邏輯，包括：
 * 1. 表單初始化和驗證
 * 2. 提交處理和錯誤處理
 * 3. 載入狀態管理
 * 4. 成功/失敗回調
 */

import { useForm, UseFormReturn, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";

export interface UseStandardFormOptions<TSchema extends z.ZodType> {
  schema: TSchema;
  defaultValues?: DefaultValues<z.infer<TSchema>>;
  onSubmit: (data: z.infer<TSchema>) => Promise<void> | void;
  onSuccess?: (data: z.infer<TSchema>) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export interface UseStandardFormReturn<TSchema extends z.ZodType> {
  form: UseFormReturn<z.infer<TSchema>>;
  isSubmitting: boolean;
  handleSubmit: () => void;
  reset: (values?: DefaultValues<z.infer<TSchema>>) => void;
}

export function useStandardForm<TSchema extends z.ZodType>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  onError,
  successMessage = "操作成功",
  errorMessage = "操作失敗",
}: UseStandardFormOptions<TSchema>): UseStandardFormReturn<TSchema> {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const data = form.getValues();
      await onSubmit(data);
      
      toast.success(successMessage);
      onSuccess?.(data);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      toast.error(errorMessage, {
        description: errorObj.message,
      });
      onError?.(errorObj);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = (values?: DefaultValues<z.infer<TSchema>>) => {
    form.reset(values || defaultValues);
  };

  return {
    form,
    isSubmitting,
    handleSubmit: form.handleSubmit(handleSubmit),
    reset,
  };
}