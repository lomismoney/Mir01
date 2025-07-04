"use client";

import React, { useState, useEffect } from "react";
import {
  Check,
  ChevronsUpDown,
  PlusCircle,
  UserCircle2,
  Search,
} from "lucide-react";
import { useCustomers } from "@/hooks";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Customer } from "@/types/api-helpers";

interface CustomerSelectorProps {
  selectedCustomerId: number | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onAddNewCustomer?: () => void; // 新增客戶回調
}

export function CustomerSelector({
  selectedCustomerId,
  onSelectCustomer,
  onAddNewCustomer,
}: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // 儲存已選擇的客戶資訊
  const [cachedSelectedCustomer, setCachedSelectedCustomer] =
    useState<Customer | null>(null);

  const { data: response, isLoading } = useCustomers({
    search: debouncedSearch,
  });
  // 安全地處理 API 響應，確保類型安全
  const customers: Customer[] =
    response && "data" in response && Array.isArray(response.data)
      ? (response.data as Customer[])
      : [];

  const selectedCustomer =
    customers.find((c) => c.id === selectedCustomerId) ||
    cachedSelectedCustomer;

  // 更新快取的選中客戶
  useEffect(() => {
    if (selectedCustomer && selectedCustomer.id === selectedCustomerId) {
      setCachedSelectedCustomer(selectedCustomer);
    }
  }, [selectedCustomer, selectedCustomerId]);

  // 過濾客戶列表
  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Popover open={open} onOpenChange={setOpen} data-oid="tb.grcy">
      <PopoverTrigger asChild data-oid="ffe11u7">
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full h-10 px-3 justify-between text-left font-normal hover:bg-accent/50"
          data-oid=".2y8byn"
        >
          {selectedCustomer ? (
            <div
              className="flex items-center gap-2 overflow-hidden"
              data-oid="3rbc-o1"
            >
              <UserCircle2
                className="h-4 w-4 text-muted-foreground shrink-0"
                data-oid="t-uj2uz"
              />

              <span className="truncate" data-oid="spt0o5p">
                {selectedCustomer.name}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground" data-oid="2h9_op1">
              請選擇客戶...
            </span>
          )}
          <ChevronsUpDown
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
            data-oid="lhrzikh"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-2"
        align="start"
        data-oid="r6beoiu"
      >
        <div className="flex flex-col gap-2" data-oid="smr-scr">
          {/* 搜尋框 */}
          <div className="relative" data-oid="8:vlt-6">
            <Search
              className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              data-oid="auv9b-u"
            />

            <Input
              type="text"
              placeholder="搜尋客戶名稱或電話..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              autoFocus
              data-oid="xtjc2yl"
            />
          </div>

          {/* 客戶列表 */}
          <div
            className="max-h-[300px] overflow-y-auto py-1"
            data-oid="q5.3mi6"
          >
            {isLoading ? (
              <div
                className="py-6 text-center text-sm text-muted-foreground"
                data-oid="ym2gkpq"
              >
                載入中...
              </div>
            ) : filteredCustomers.length === 0 && searchQuery ? (
              <div
                className="py-6 text-center text-sm text-muted-foreground"
                data-oid="6oyvjtz"
              >
                找不到符合的客戶
              </div>
            ) : customers.length === 0 ? (
              <div
                className="py-6 text-center text-sm text-muted-foreground"
                data-oid="3me.6ru"
              >
                尚無客戶資料
              </div>
            ) : (
              <>
                {/* 新增客戶按鈕 */}
                {onAddNewCustomer && (
                  <button
                    onClick={() => {
                      onAddNewCustomer();
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent text-left transition-colors w-full"
                    data-oid="cwk8pmi"
                  >
                    <div
                      className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"
                      data-oid="3aq4s6r"
                    >
                      <PlusCircle
                        className="h-4 w-4 text-primary"
                        data-oid="s9lki8_"
                      />
                    </div>
                    <span
                      className="text-primary font-medium"
                      data-oid="b9j9tqy"
                    >
                      新增客戶
                    </span>
                  </button>
                )}

                {/* 分隔線 */}
                {onAddNewCustomer && filteredCustomers.length > 0 && (
                  <div className="my-1 mx-3 border-t" data-oid="f06w-dv" />
                )}

                {/* 客戶項目 */}
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      onSelectCustomer(customer);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent text-left transition-colors relative w-full",
                      selectedCustomerId === customer.id && "bg-accent",
                    )}
                    data-oid=".fkpxgq"
                  >
                    {selectedCustomerId === customer.id && (
                      <div
                        className="absolute left-1 top-1/2 -translate-y-1/2"
                        data-oid="kw1o74q"
                      >
                        <Check
                          className="h-3 w-3 text-primary"
                          data-oid="rv40_s6"
                        />
                      </div>
                    )}

                    <div
                      className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0"
                      data-oid="mth65dq"
                    >
                      <UserCircle2
                        className="h-5 w-5 text-muted-foreground"
                        data-oid="q8nv13d"
                      />
                    </div>

                    <div className="flex flex-col min-w-0" data-oid="2hjl7bh">
                      <span className="font-medium truncate" data-oid="gkqtyo1">
                        {customer.name}
                      </span>
                      {customer.phone && (
                        <span
                          className="text-xs text-muted-foreground"
                          data-oid="0iz9mtu"
                        >
                          {customer.phone}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
