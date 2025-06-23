import { useFieldArray, Control, FieldValues, FieldArrayPath } from 'react-hook-form';

// 我們將原始的 props 類型導出，以便在需要時可以擴展
export type UseAppFieldArrayProps<
  TFieldValues extends FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues>
> = {
  name: TFieldArrayName;
  control: Control<TFieldValues>;
};

/**
 * 專案專用的 useFieldArray 封裝。
 * 預設將 `keyName` 設置為 'key'，以避免與業務數據的 'id' 欄位衝突。
 * 在專案中，應優先使用此 Hook，而不是直接使用原始的 useFieldArray。
 */
export const useAppFieldArray = <
  TFieldValues extends FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues>
>({ name, control }: UseAppFieldArrayProps<TFieldValues, TFieldArrayName>) => {
  return useFieldArray({
    name,
    control,
    keyName: 'key', // 🎯 核心：在此處設定安全預設值
  });
}; 