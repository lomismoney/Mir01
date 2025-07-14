import { 
  IconBox, 
  IconDashboard, 
  IconBuilding,
  IconShoppingCart,
  IconTool,
  IconUserCheck,
  IconBuildingStore,
  IconUsers,
  IconFileDescription,
  IconSettings,
  IconHelp,
  IconSearch,
  IconDatabase,
  IconChartBar,
  IconReport,
  IconPackage,
  IconTags,
  IconAdjustments,
  IconClipboardList,
  IconTruckDelivery,
  IconArrowsExchange,
  IconBell,
  IconHistory,
  IconPlus,
  IconEdit,
  IconEye,
  type IconProps
} from "@tabler/icons-react";
import { ComponentType } from "react";

export interface RouteConfig {
  path: string;
  label: string;
  icon?: ComponentType<IconProps>;
  parent?: string;
  children?: RouteConfig[];
  isDynamic?: boolean;
  hideInBreadcrumb?: boolean;
}

/**
 * 完整的路由配置
 * 用於麵包屑導航和側邊欄菜單的統一配置
 */
export const routesConfig: RouteConfig[] = [
  {
    path: "/dashboard",
    label: "儀表板",
    icon: IconDashboard,
  },
  {
    path: "/inventory",
    label: "庫存管理",
    icon: IconBuilding,
    children: [
      {
        path: "/inventory/management",
        label: "庫存清單",
        icon: IconClipboardList,
        parent: "/inventory",
      },
      {
        path: "/inventory/incoming",
        label: "進貨管理",
        icon: IconTruckDelivery,
        parent: "/inventory",
      },
      {
        path: "/inventory/transfers",
        label: "庫存轉移",
        icon: IconArrowsExchange,
        parent: "/inventory",
      },
      {
        path: "/inventory/alerts",
        label: "庫存預警",
        icon: IconBell,
        parent: "/inventory",
      },
      {
        path: "/inventory/history",
        label: "變動歷史",
        icon: IconHistory,
        parent: "/inventory",
        children: [
          {
            path: "/inventory/history/:id",
            label: "歷史詳情",
            parent: "/inventory/history",
            isDynamic: true,
          },
          {
            path: "/inventory/history/sku/:sku",
            label: "SKU 歷史",
            parent: "/inventory/history",
            isDynamic: true,
          },
        ],
      },
    ],
  },
  {
    path: "/products",
    label: "商品管理",
    icon: IconBox,
    children: [
      {
        path: "/products",
        label: "商品列表",
        icon: IconPackage,
        parent: "/products",
      },
      {
        path: "/products/new",
        label: "新增商品",
        icon: IconPlus,
        parent: "/products",
      },
      {
        path: "/products/:productId",
        label: "商品詳情",
        icon: IconEye,
        parent: "/products",
        isDynamic: true,
        children: [
          {
            path: "/products/:productId/edit",
            label: "編輯商品",
            icon: IconEdit,
            parent: "/products/:productId",
            isDynamic: true,
          },
        ],
      },
      {
        path: "/categories",
        label: "分類管理",
        icon: IconTags,
        parent: "/products",
      },
      {
        path: "/attributes",
        label: "規格管理",
        icon: IconAdjustments,
        parent: "/products",
      },
    ],
  },
  {
    path: "/orders",
    label: "訂單管理",
    icon: IconShoppingCart,
    children: [
      {
        path: "/orders",
        label: "訂單列表",
        parent: "/orders",
      },
      {
        path: "/orders/new",
        label: "新增訂單",
        icon: IconPlus,
        parent: "/orders",
      },
      {
        path: "/orders/backorders",
        label: "待進貨商品管理",
        parent: "/orders",
      },
      {
        path: "/orders/:id",
        label: "訂單詳情",
        parent: "/orders",
        isDynamic: true,
        children: [
          {
            path: "/orders/:id/edit",
            label: "編輯訂單",
            parent: "/orders/:id",
            isDynamic: true,
          },
        ],
      },
    ],
  },
  {
    path: "/installations",
    label: "安裝管理",
    icon: IconTool,
    children: [
      {
        path: "/installations",
        label: "安裝列表",
        parent: "/installations",
      },
      {
        path: "/installations/new",
        label: "新增安裝",
        parent: "/installations",
      },
      {
        path: "/installations/:id",
        label: "安裝詳情",
        parent: "/installations",
        isDynamic: true,
        children: [
          {
            path: "/installations/:id/edit",
            label: "編輯安裝",
            parent: "/installations/:id",
            isDynamic: true,
          },
        ],
      },
    ],
  },
  {
    path: "/customers",
    label: "客戶管理",
    icon: IconUserCheck,
    children: [
      {
        path: "/customers/:id",
        label: "客戶詳情",
        parent: "/customers",
        isDynamic: true,
      },
    ],
  },
  {
    path: "/purchases",
    label: "進貨單管理",
    icon: IconFileDescription,
    children: [
      {
        path: "/purchases/:id",
        label: "進貨單詳情",
        parent: "/purchases",
        isDynamic: true,
        children: [
          {
            path: "/purchases/:id/edit",
            label: "編輯進貨單",
            parent: "/purchases/:id",
            isDynamic: true,
          },
        ],
      },
    ],
  },
  {
    path: "/stores",
    label: "分店管理",
    icon: IconBuildingStore,
  },
  {
    path: "/users",
    label: "用戶管理",
    icon: IconUsers,
  },
  {
    path: "/data",
    label: "數據中心",
    icon: IconDatabase,
  },
  {
    path: "/analytics",
    label: "分析報表",
    icon: IconChartBar,
  },
  {
    path: "/system-reports",
    label: "系統報告",
    icon: IconReport,
  },
  {
    path: "/settings",
    label: "系統設定",
    icon: IconSettings,
  },
  {
    path: "/help",
    label: "幫助中心",
    icon: IconHelp,
  },
  {
    path: "/search",
    label: "搜尋",
    icon: IconSearch,
  },
  {
    path: "/api-test",
    label: "API 測試",
    hideInBreadcrumb: false,
  },
];

/**
 * 根據當前路徑查找匹配的路由配置
 */
export function findRouteConfig(
  pathname: string,
  routes: RouteConfig[] = routesConfig
): RouteConfig | null {
  for (const route of routes) {
    // 精確匹配
    if (route.path === pathname) {
      return route;
    }

    // 動態路由匹配
    if (route.isDynamic) {
      const pattern = route.path.replace(/:\w+/g, "([^/]+)");
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(pathname)) {
        return route;
      }
    }

    // 遞歸查找子路由
    if (route.children) {
      const found = findRouteConfig(pathname, route.children);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 生成麵包屑路徑
 */
export function generateBreadcrumbPath(pathname: string): RouteConfig[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: RouteConfig[] = [];
  let currentPath = "";

  for (let i = 0; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;
    
    // 查找匹配的路由配置
    let config = findRouteConfig(currentPath);
    
    // 如果沒有找到精確匹配，嘗試動態路由匹配
    if (!config) {
      // 構建可能的動態路徑模式
      const pathParts = currentPath.split("/").filter(Boolean);
      for (let j = pathParts.length - 1; j >= 0; j--) {
        const possiblePattern = "/" + pathParts
          .map((part, index) => {
            if (index === j && /^\d+$/.test(part)) {
              return ":id";
            } else if (index === j && part !== "new" && part !== "edit") {
              return `:${pathParts[index - 1]?.slice(0, -1) || "param"}`;
            }
            return part;
          })
          .join("/");
        
        config = findRouteConfig(possiblePattern);
        if (config) break;
      }
    }

    if (config && !config.hideInBreadcrumb) {
      breadcrumbs.push({
        ...config,
        path: currentPath,
      });
    }
  }

  return breadcrumbs;
}

/**
 * 獲取父級路由配置
 */
export function getParentRoute(route: RouteConfig): RouteConfig | null {
  if (!route.parent) return null;
  return findRouteConfig(route.parent);
}

/**
 * 獲取路由的完整層級路徑
 */
export function getRouteBreadcrumbs(pathname: string): RouteConfig[] {
  const route = findRouteConfig(pathname);
  if (!route) {
    // 如果沒有找到路由配置，嘗試生成基於路徑的麵包屑
    return generateBreadcrumbPath(pathname);
  }

  const breadcrumbs: RouteConfig[] = [];
  let current: RouteConfig | null = route;

  // 向上遍歷父級路由
  while (current) {
    breadcrumbs.unshift(current);
    current = current.parent ? findRouteConfig(current.parent) : null;
  }

  return breadcrumbs;
}