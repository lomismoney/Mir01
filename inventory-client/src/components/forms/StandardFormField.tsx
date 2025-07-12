/**
 * 標準表單欄位組件
 * 
 * 提供統一的表單欄位UI和行為，包括：
 * 1. 各種表單欄位類型（input, textarea, select, checkbox等）
 * 2. 統一的錯誤顯示和樣式
 * 3. 標籤和幫助文字
 * 4. 驗證狀態指示
 */

import React from "react";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface BaseFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string;
  className?: string;
  required?: boolean;
}

interface InputFieldProps<TFieldValues extends FieldValues> extends BaseFieldProps<TFieldValues> {
  type?: "text" | "email" | "tel" | "url" | "number" | "password";
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

interface TextareaFieldProps<TFieldValues extends FieldValues> extends BaseFieldProps<TFieldValues> {
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}

interface SelectFieldProps<TFieldValues extends FieldValues> extends BaseFieldProps<TFieldValues> {
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

interface CheckboxFieldProps<TFieldValues extends FieldValues> extends BaseFieldProps<TFieldValues> {
  disabled?: boolean;
}

interface RadioFieldProps<TFieldValues extends FieldValues> extends BaseFieldProps<TFieldValues> {
  options: RadioOption[];
  disabled?: boolean;
}

interface SwitchFieldProps<TFieldValues extends FieldValues> extends BaseFieldProps<TFieldValues> {
  disabled?: boolean;
}

interface DateFieldProps<TFieldValues extends FieldValues> extends BaseFieldProps<TFieldValues> {
  placeholder?: string;
  disabled?: boolean;
  disabledDates?: (date: Date) => boolean;
}

/**
 * 文字輸入欄位
 */
export function StandardInputField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  required,
  type = "text",
  placeholder,
  disabled,
  min,
  max,
  step,
}: InputFieldProps<TFieldValues>) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className={required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""}>
            {label}
          </FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                {...field}
                type={type === "password" && showPassword ? "text" : type}
                placeholder={placeholder}
                disabled={disabled}
                min={min}
                max={max}
                step={step}
                value={field.value || ""}
              />
              {type === "password" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={disabled}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * 多行文字輸入欄位
 */
export function StandardTextareaField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  required,
  placeholder,
  disabled,
  rows = 3,
}: TextareaFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className={required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""}>
            {label}
          </FormLabel>
          <FormControl>
            <Textarea
              {...field}
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
              value={field.value || ""}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * 下拉選單欄位
 */
export function StandardSelectField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  required,
  options,
  placeholder = "請選擇...",
  disabled,
}: SelectFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className={required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""}>
            {label}
          </FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * 複選框欄位
 */
export function StandardCheckboxField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
}: CheckboxFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("flex flex-row items-start space-x-3 space-y-0", className)}>
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {label}
            </FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}

/**
 * 單選按鈕欄位
 */
export function StandardRadioField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  required,
  options,
  disabled,
}: RadioFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className={required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""}>
            {label}
          </FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={disabled}
              className="flex flex-col space-y-1"
            >
              {options.map((option) => (
                <FormItem key={option.value} className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value={option.value} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal">{option.label}</FormLabel>
                    {option.description && (
                      <FormDescription>{option.description}</FormDescription>
                    )}
                  </div>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * 開關欄位
 */
export function StandardSwitchField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
}: SwitchFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("flex flex-row items-center justify-between rounded-lg border p-4", className)}>
          <div className="space-y-0.5">
            <FormLabel className="text-base">{label}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * 日期選擇欄位
 */
export function StandardDateField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  required,
  placeholder = "選擇日期",
  disabled,
  disabledDates,
}: DateFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className={required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""}>
            {label}
          </FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  disabled={disabled}
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value ? (
                    format(field.value, "PPP", { locale: zhTW })
                  ) : (
                    <span>{placeholder}</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                disabled={disabledDates}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}