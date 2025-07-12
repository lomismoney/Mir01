"use client";

import React, { useState } from "react";
import { Control, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandSeparator,
  CommandEmpty,
} from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormValues } from "./CategoryForm";
import { Category } from "@/types/category";

interface CategoryOption {
  id: number;
  name: string;
  depth: number;
  displayName: string;
  children: Category[];
}

interface ParentCategoryFieldProps {
  control: Control<FormValues>;
  categoryOptions: CategoryOption[];
  parentId?: number | null;
  initialDataId?: number | null;
  childrenMap: Map<number, Category[]>;
}

/**
 * 判斷選擇指定分類作為父分類是否會造成循環關係
 */
function shouldDisableOption(
  optionId: number,
  currentCategoryId: number | null,
  childrenMap: Map<number, Category[]>
): boolean {
  if (!currentCategoryId) return false;
  if (optionId === currentCategoryId) return true;
  return isDescendant(currentCategoryId, optionId, childrenMap);
}

/**
 * 遞迴檢查指定分類是否為目標分類的後代
 */
function isDescendant(
  parentId: number,
  targetId: number,
  childrenMap: Map<number, Category[]>
): boolean {
  const children = childrenMap.get(parentId) || [];
  for (const child of children) {
    if (child.id === targetId) return true;
    if (isDescendant(child.id, targetId, childrenMap)) return true;
  }
  return false;
}

export function ParentCategoryField({
  control,
  categoryOptions,
  parentId,
  initialDataId,
  childrenMap,
}: ParentCategoryFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="parent_id" className="text-right">
        父分類
      </Label>
      <Controller
        name="parent_id"
        control={control}
        render={({ field }) => {
          const selectedOption =
            field.value && field.value !== "null"
              ? categoryOptions.find((opt) => opt.id === Number(field.value))
              : null;

          return (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger
                asChild
                className="col-span-3"
               
              >
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  disabled={!!parentId}
                  className={cn(
                    "w-full justify-between",
                    !field.value && "text-muted-foreground"
                  )}
                 
                >
                  {field.value === "null" || field.value === null
                    ? "設為頂層分類"
                    : selectedOption?.displayName || "選擇父分類"}
                  <ChevronsUpDown
                    className="ml-2 h-4 w-4 shrink-0 opacity-50"
                   
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-full p-0"
                align="start"
               
              >
                <Command>
                  <CommandInput
                    placeholder="搜尋分類..."
                   
                  />
                  <CommandList>
                    <CommandEmpty>
                      找不到相關分類
                    </CommandEmpty>

                    {/* 設為頂層分類選項 */}
                    <CommandItem
                      value="頂層分類"
                      onSelect={() => {
                        field.onChange(null);
                        setOpen(false);
                      }}
                     
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          field.value === "null" || field.value === null
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                       
                      />
                      設為頂層分類
                    </CommandItem>

                    <CommandSeparator />

                    {/* 分類選項 */}
                    {categoryOptions.map((option) => {
                      const isDisabled = shouldDisableOption(
                        option.id,
                        initialDataId ?? null,
                        childrenMap
                      );

                      const getDisabledReason = () => {
                        if (!initialDataId) return "";
                        if (option.id === initialDataId) return " (自己)";
                        return " (會造成循環關係)";
                      };

                      return (
                        <CommandItem
                          key={option.id}
                          value={option.displayName}
                          disabled={isDisabled}
                          onSelect={() => {
                            field.onChange(String(option.id));
                            setOpen(false);
                          }}
                         
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value === String(option.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                           
                          />
                          <span
                            className={cn(
                              "truncate",
                              option.depth === 0 && "font-medium",
                              option.depth === 1 && "pl-4",
                              option.depth === 2 && "pl-8",
                              option.depth === 3 && "pl-12",
                              option.depth >= 4 && "pl-16",
                              isDisabled && "opacity-50 text-muted-foreground"
                            )}
                           
                          >
                            {option.name}
                            {isDisabled && getDisabledReason()}
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          );
        }}
       
      />
    </div>
  );
}