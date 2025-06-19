'use client';

import React, { useState } from 'react';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { useCustomers } from '@/hooks/queries/useEntityQueries';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Customer } from '@/types/api-helpers';

interface CustomerSelectorProps {
  selectedCustomerId: number | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onAddNewCustomer?: () => void; // 新增客戶回調
}

export function CustomerSelector({ selectedCustomerId, onSelectCustomer, onAddNewCustomer }: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: response, isLoading } = useCustomers({ search: debouncedSearch });
  // 安全地處理 API 響應，確保類型安全
  const customers: Customer[] = (response && 'data' in response && Array.isArray(response.data)) 
    ? response.data as Customer[] 
    : [];

  const selectedCustomerName = customers.find((c) => c.id === selectedCustomerId)?.name || '請選擇一個客戶...';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selectedCustomerName}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput 
            placeholder="搜尋客戶名稱或電話..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>{isLoading ? '搜尋中...' : '找不到客戶。'}</CommandEmpty>
            <CommandGroup>
              {/* 新增客戶按鈕 */}
              {onAddNewCustomer && (
                <CommandItem
                  onSelect={() => {
                    onAddNewCustomer();
                    setOpen(false);
                  }}
                  className="text-primary"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  新增客戶
                </CommandItem>
              )}
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.name || ''}
                  onSelect={() => {
                    onSelectCustomer(customer);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", selectedCustomerId === customer.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col">
                    <span>{customer.name}</span>
                    {customer.phone && (
                      <span className="text-xs text-muted-foreground">{customer.phone}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 