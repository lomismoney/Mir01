"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useStores, type Store } from "@/hooks/useStores"

interface StoreComboboxProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  emptyText?: string
  className?: string
}

export function StoreCombobox({
  value,
  onValueChange,
  placeholder = "選擇分店...",
  emptyText = "未找到分店",
  className
}: StoreComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const { data: storesData, isLoading } = useStores()
  
  // useStores 已經處理了資料結構，直接使用 data 並強制類型
  const stores = (storesData?.data || []) as Store[]

  const selectedStore = value 
    ? stores.find((store) => store.id?.toString() === value)
    : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={isLoading}
        >
          {selectedStore ? selectedStore.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="搜尋分店名稱..." 
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {/* 全部選項 */}
              <CommandItem
                value=""
                onSelect={() => {
                  onValueChange("")
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === "" ? "opacity-100" : "opacity-0"
                  )}
                />
                全部分店
              </CommandItem>
              
              {/* 分店選項 */}
              {stores.map((store) => (
                <CommandItem
                  key={store.id}
                  value={store.name || ''}
                  onSelect={() => {
                    onValueChange(store.id?.toString() || '')
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === store.id?.toString() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {store.name}
                  {store.address && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {store.address}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
