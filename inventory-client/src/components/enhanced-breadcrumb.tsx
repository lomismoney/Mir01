"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  getRouteBreadcrumbs, 
  RouteConfig,
  findRouteConfig 
} from "@/lib/routes-config";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useBreadcrumbContext } from "@/components/breadcrumb-context";

interface EnhancedBreadcrumbProps {
  /**
   * 自定義麵包屑項目，會覆蓋自動生成的項目
   */
  customItems?: Array<{
    label: string;
    href?: string;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  /**
   * 最大顯示項目數（移動端）
   */
  maxItemsMobile?: number;
  /**
   * 最大顯示項目數（桌面端）
   */
  maxItemsDesktop?: number;
  /**
   * 是否顯示首頁圖標
   */
  showHomeIcon?: boolean;
  /**
   * 自定義類名
   */
  className?: string;
  /**
   * 是否顯示圖標
   */
  showIcons?: boolean;
  /**
   * 自定義分隔符
   */
  separator?: React.ReactNode;
}

export function EnhancedBreadcrumb({
  customItems,
  maxItemsMobile = 2,
  maxItemsDesktop = 5,
  showHomeIcon = true,
  className,
  showIcons = true,
  separator,
}: EnhancedBreadcrumbProps) {
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const { customLabel, customItems: contextItems } = useBreadcrumbContext();
  
  // 獲取麵包屑項目
  const items = React.useMemo(() => {
    // 優先使用傳入的自定義項目
    if (customItems) {
      return customItems;
    }
    
    // 其次使用上下文中的自定義項目
    if (contextItems) {
      return contextItems;
    }

    const routeBreadcrumbs = getRouteBreadcrumbs(pathname);
    
    // 如果在首頁，只返回首頁項目
    if (pathname === "/" || pathname === "/dashboard") {
      return [{
        label: "儀表板",
        href: "/dashboard",
        icon: Home,
      }];
    }

    // 轉換路由配置為麵包屑項目
    return routeBreadcrumbs.map((route, index) => {
      const isLast = index === routeBreadcrumbs.length - 1;
      
      // 處理動態路由的標籤
      let label = route.label;
      
      // 如果是最後一個項目且有自定義標籤，使用自定義標籤
      if (isLast && customLabel) {
        label = customLabel;
      } else if (route.isDynamic && route.path.includes(":")) {
        // 從實際路徑中提取動態參數
        const segments = pathname.split("/");
        const routeSegments = route.path.split("/");
        
        routeSegments.forEach((segment, i) => {
          if (segment.startsWith(":")) {
            const paramValue = segments[i];
            if (paramValue) {
              // 根據參數名稱自定義標籤
              if (segment === ":id" || segment === ":productId") {
                label = `${route.label} #${paramValue}`;
              } else if (segment === ":sku") {
                label = `SKU: ${paramValue}`;
              } else {
                label = `${route.label}: ${paramValue}`;
              }
            }
          }
        });
      }

      return {
        label,
        href: isLast ? undefined : route.path.replace(/:\w+/g, (match) => {
          // 替換動態參數為實際值
          const paramName = match.substring(1);
          const segments = pathname.split("/");
          const routeSegments = route.path.split("/");
          const paramIndex = routeSegments.indexOf(match);
          return segments[paramIndex] || match;
        }),
        icon: showIcons ? route.icon : undefined,
      };
    });
  }, [pathname, customItems, contextItems, customLabel, showIcons]);

  // 決定要顯示的項目
  const maxItems = isMobile ? maxItemsMobile : maxItemsDesktop;
  const shouldCollapse = items.length > maxItems;
  
  let displayItems = items;
  let collapsedItems: typeof items = [];
  
  if (shouldCollapse) {
    // 總是顯示第一個和最後幾個項目
    const firstItem = showHomeIcon ? items[0] : null;
    const lastItems = items.slice(-(maxItems - (showHomeIcon ? 1 : 0)));
    
    displayItems = [
      ...(firstItem ? [firstItem] : []),
      ...lastItems,
    ];
    
    // 收起的項目
    collapsedItems = items.slice(
      showHomeIcon ? 1 : 0,
      items.length - (maxItems - (showHomeIcon ? 1 : 0))
    );
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {/* 首頁圖標 */}
        {showHomeIcon && pathname !== "/" && pathname !== "/dashboard" && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span className="sr-only">首頁</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              {separator || <ChevronRight className="h-4 w-4" />}
            </BreadcrumbSeparator>
          </>
        )}

        {/* 麵包屑項目 */}
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const Icon = item.icon;
          
          // 如果有收起的項目，在第二個位置顯示下拉菜單
          if (shouldCollapse && index === (showHomeIcon ? 1 : 0) && collapsedItems.length > 0) {
            return (
              <React.Fragment key={`collapsed-${index}`}>
                <BreadcrumbItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-normal hover:bg-transparent"
                      >
                        <span className="text-muted-foreground">...</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {collapsedItems.map((collapsedItem, i) => {
                        const CollapsedIcon = collapsedItem.icon;
                        return (
                          <DropdownMenuItem key={i} asChild>
                            <Link
                              href={collapsedItem.href || "#"}
                              className="flex items-center gap-2"
                            >
                              {CollapsedIcon && (
                                <CollapsedIcon className="h-4 w-4" />
                              )}
                              {collapsedItem.label}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  {separator || <ChevronRight className="h-4 w-4" />}
                </BreadcrumbSeparator>
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={item.href || item.label}>
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage className="flex items-center gap-1.5">
                    {Icon && <Icon className="h-4 w-4" />}
                    <span className={cn(isMobile && "max-w-[120px] truncate")}>
                      {item.label}
                    </span>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={item.href}
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <span className={cn(isMobile && "max-w-[120px] truncate")}>
                        {item.label}
                      </span>
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && (
                <BreadcrumbSeparator>
                  {separator || <ChevronRight className="h-4 w-4" />}
                </BreadcrumbSeparator>
              )}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * 使用動態參數的麵包屑 Hook
 * 用於在頁面中動態設置麵包屑文字
 */
export function useBreadcrumb() {
  const pathname = usePathname();
  const [customLabel, setCustomLabel] = React.useState<string | null>(null);

  const setDynamicLabel = React.useCallback((label: string) => {
    setCustomLabel(label);
  }, []);

  const breadcrumbs = React.useMemo(() => {
    const items = getRouteBreadcrumbs(pathname);
    
    if (customLabel && items.length > 0) {
      // 更新最後一個項目的標籤
      const updatedItems = [...items];
      updatedItems[updatedItems.length - 1] = {
        ...updatedItems[updatedItems.length - 1],
        label: customLabel,
      };
      return updatedItems;
    }
    
    return items;
  }, [pathname, customLabel]);

  return {
    breadcrumbs,
    setDynamicLabel,
  };
}