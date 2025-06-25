import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * 資料表骨架屏元件
 *
 * 功能特色：
 * 1. 語義化的載入狀態展示
 * 2. 符合實際資料表結構的骨架布局
 * 3. 響應式設計，適應不同螢幕尺寸
 * 4. 高度可定制的骨架行數和欄位
 * 5. 整合 shadcn/ui 的設計系統
 *
 * 用途：
 * - Suspense fallback
 * - 資料載入中的占位符
 * - 提升用戶體驗的載入動畫
 */
interface DataTableSkeletonProps {
  /** 骨架表格的行數 */
  rows?: number;
  /** 骨架表格的欄數 */
  columns?: number;
  /** 是否顯示標題區域 */
  showHeader?: boolean;
  /** 是否顯示操作按鈕區域 */
  showActions?: boolean;
  /** 自訂類別名稱 */
  className?: string;
}

/**
 * 資料表骨架屏元件
 * 模擬真實資料表的結構和載入狀態
 */
export function DataTableSkeleton({
  rows = 10,
  columns = 6,
  showHeader = true,
  showActions = true,
  className = "",
}: DataTableSkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`} data-oid="ipirm92">
      {/* 頁面標題骨架 */}
      {showHeader && (
        <div className="flex items-center justify-between" data-oid="a2fzib1">
          <div className="space-y-2" data-oid="i-f7ugw">
            <Skeleton className="h-8 w-48" data-oid="7:tlps_" />
            <Skeleton className="h-4 w-96" data-oid="gdd1:8v" />
          </div>
          {showActions && <Skeleton className="h-10 w-24" data-oid="hydhu79" />}
        </div>
      )}

      {/* 搜尋和篩選區骨架 */}
      <Card data-oid="1f0zzl5">
        <CardHeader className="pb-3" data-oid="0ybxn8p">
          <div className="flex items-center justify-between" data-oid="zc0rdu8">
            <Skeleton className="h-9 w-80" data-oid="e3a640v" />
            <div className="flex space-x-2" data-oid="chzvm:c">
              <Skeleton className="h-9 w-24" data-oid="dsg6z_b" />
              <Skeleton className="h-9 w-24" data-oid="e3p8-ss" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 資料表主體骨架 */}
      <Card data-oid="54os2mo">
        <CardContent className="p-0" data-oid="pqzovt8">
          {/* 表格標題行 */}
          <div className="border-b" data-oid="lu9yi9:">
            <div className="grid grid-cols-6 gap-4 p-4" data-oid=".ladkth">
              {Array.from({ length: columns }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-4 w-full"
                  data-oid="0-4:v1_"
                />
              ))}
            </div>
          </div>

          {/* 表格資料行 */}
          <div className="divide-y" data-oid="2wz9d87">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="grid grid-cols-6 gap-4 p-4"
                data-oid="tcv5x:y"
              >
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <div
                    key={colIndex}
                    className="flex items-center"
                    data-oid="j:gf_0e"
                  >
                    {/* 第一欄通常是選擇框 */}
                    {colIndex === 0 ? (
                      <Skeleton
                        className="h-4 w-4 rounded"
                        data-oid="71-hbs6"
                      />
                    ) : colIndex === 1 ? (
                      /* 第二欄通常是主要內容，稍微寬一些 */
                      <Skeleton className="h-4 w-full" data-oid="zu-d78o" />
                    ) : colIndex === columns - 1 ? (
                      /* 最後一欄通常是操作按鈕 */
                      <div className="flex space-x-1" data-oid="jufx5oq">
                        <Skeleton
                          className="h-8 w-8 rounded"
                          data-oid="w06dhwq"
                        />

                        <Skeleton
                          className="h-8 w-8 rounded"
                          data-oid="tl5n:jn"
                        />
                      </div>
                    ) : (
                      /* 其他欄位 */
                      <Skeleton className="h-4 w-3/4" data-oid="f6zcv_z" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 分頁骨架 */}
      <div className="flex items-center justify-between" data-oid="juzgy__">
        <Skeleton className="h-4 w-40" data-oid="bexuepm" />
        <div className="flex items-center space-x-2" data-oid="9go7bxr">
          <Skeleton className="h-8 w-8" data-oid="k450xxr" />
          <Skeleton className="h-8 w-8" data-oid="mp2wpii" />
          <Skeleton className="h-8 w-8" data-oid="5pa7ler" />
          <Skeleton className="h-8 w-8" data-oid="ua6vvhl" />
          <Skeleton className="h-8 w-8" data-oid="3c98lkd" />
        </div>
      </div>
    </div>
  );
}

/**
 * 簡化版骨架屏，用於較小的區域
 */
export function CompactDataTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" data-oid="6-yq56r">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center space-x-4 p-3 border rounded-lg"
          data-oid="n2i0a17"
        >
          <Skeleton className="h-4 w-4 rounded" data-oid="i_rclgo" />
          <Skeleton className="h-4 flex-1" data-oid="b2.m8wf" />
          <Skeleton className="h-4 w-20" data-oid="7voou4v" />
          <Skeleton className="h-8 w-16" data-oid="8spz6qu" />
        </div>
      ))}
    </div>
  );
}
