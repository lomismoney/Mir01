"use client";

import * as React from "react";
import { useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInventoryTimeSeries } from "@/hooks/queries/useEntityQueries";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

/**
 * 庫存趨勢互動式圖表組件
 * 顯示指定商品變體的庫存數量歷史趨勢，支持不同時間範圍的篩選
 * 使用真實數據驅動，透過 useInventoryTimeSeries Hook 獲取數據
 */
interface ChartAreaInteractiveProps {
  productVariantId: number | null;
}

export function ChartAreaInteractive({
  productVariantId,
}: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("30d");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  // 根據時間範圍計算 start_date 和 end_date
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    const days = parseInt(timeRange.replace("d", ""));
    start.setDate(end.getDate() - days);

    // 格式化為 YYYY-MM-DD
    const toISODateString = (date: Date) => date.toISOString().split("T")[0];

    return {
      startDate: toISODateString(start),
      endDate: toISODateString(end),
    };
  }, [timeRange]);

  // 調用數據獲取 Hook
  const {
    data: chartData,
    isLoading,
    error,
  } = useInventoryTimeSeries({
    product_variant_id: productVariantId,
    start_date: startDate,
    end_date: endDate,
  });

  // 計算統計數據
  const stats = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        startQuantity: 0,
        endQuantity: 0,
        change: 0,
        changePercent: 0,
        maxQuantity: 0,
        minQuantity: 0,
      };
    }

    const startQuantity = chartData[0].quantity;
    const endQuantity = chartData[chartData.length - 1].quantity;
    const change = endQuantity - startQuantity;
    const changePercent =
      startQuantity > 0 ? (change / startQuantity) * 100 : 0;
    const quantities = chartData.map((d) => d.quantity);
    const maxQuantity = Math.max(...quantities);
    const minQuantity = Math.min(...quantities);

    return {
      startQuantity,
      endQuantity,
      change,
      changePercent,
      maxQuantity,
      minQuantity,
    };
  }, [chartData]);

  // 圖表配置
  const chartConfig = {
    quantity: {
      label: "庫存數量",
      color: "hsl(var(--chart-1))",
    },
  };

  // 時間範圍顯示文字
  const getTimeRangeText = () => {
    switch (timeRange) {
      case "7d":
        return "最近 7 天";
      case "30d":
        return "最近 30 天";
      default:
        return "最近 90 天";
    }
  };

  return (
    <Card className="@container/card" data-oid="aqwuz:l">
      <CardHeader data-oid="or45sug">
        <CardTitle data-oid="rtyntz_">庫存趨勢</CardTitle>
        <CardDescription data-oid="6jw.jh-">
          <span className="hidden @[540px]/card:block" data-oid="auol4vj">
            {getTimeRangeText()}的庫存數量變化趨勢
          </span>
          <span className="@[540px]/card:hidden" data-oid="sfs.388">
            {getTimeRangeText()}
          </span>
        </CardDescription>
        <CardAction data-oid="j0aqfn0">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
            data-oid="9zx_upr"
          >
            <ToggleGroupItem value="90d" data-oid="en5509l">
              過去3個月
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" data-oid="su-kbsy">
              過去30天
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" data-oid="8bl0qto">
              過去7天
            </ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
            data-oid=":yswdx0"
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="選擇時間範圍"
              data-oid="5ve3mp6"
            >
              <SelectValue placeholder="過去30天" data-oid="h6y0d9q" />
            </SelectTrigger>
            <SelectContent className="rounded-xl" data-oid="doy4-q4">
              <SelectItem value="90d" className="rounded-lg" data-oid="c__hg:s">
                過去3個月
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg" data-oid="84mw-xn">
                過去30天
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg" data-oid="h4:_2u4">
                過去7天
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6" data-oid="7ou5d78">
        {/* 載入狀態 */}
        {isLoading && (
          <div className="h-[300px] w-full space-y-3" data-oid="jk3ofwj">
            <Skeleton className="h-[250px] w-full" data-oid="ziobp6w" />
            <div className="grid grid-cols-3 gap-4" data-oid="rw-bxby">
              <Skeleton className="h-12 w-full" data-oid="-ig55d6" />
              <Skeleton className="h-12 w-full" data-oid="r-.u5z8" />
              <Skeleton className="h-12 w-full" data-oid="xoyr5l0" />
            </div>
          </div>
        )}

        {/* 錯誤狀態 */}
        {error && (
          <div
            className="h-[300px] w-full flex items-center justify-center"
            data-oid="4-iyebj"
          >
            <div className="text-center space-y-2" data-oid="9_jcma.">
              <div className="text-destructive font-medium" data-oid="r2onc02">
                載入失敗
              </div>
              <div className="text-sm text-muted-foreground" data-oid="smckkvf">
                {error.message}
              </div>
            </div>
          </div>
        )}

        {/* 無商品選擇提示 */}
        {!productVariantId && !isLoading && !error && (
          <div
            className="h-[300px] w-full flex items-center justify-center"
            data-oid="543_e3d"
          >
            <div className="text-center space-y-2" data-oid="78.g05a">
              <div
                className="text-lg font-semibold text-muted-foreground"
                data-oid="9slh5y:"
              >
                📊 請選擇商品
              </div>
              <div className="text-sm text-muted-foreground" data-oid="mecb-3s">
                選擇一個商品變體以查看其庫存趨勢
              </div>
            </div>
          </div>
        )}

        {/* 圖表渲染 */}
        {!isLoading &&
          !error &&
          productVariantId &&
          chartData &&
          chartData.length > 0 && (
            <div className="space-y-4" data-oid="s8nr5z2">
              <div className="h-[250px] w-full" data-oid="eodgmy.">
                <ChartContainer config={chartConfig} data-oid="ppkragr">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    data-oid="ie4_cxd"
                  >
                    <AreaChart
                      data={chartData}
                      margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
                      data-oid="_hp5a5v"
                    >
                      <defs data-oid="ay2uyns">
                        <linearGradient
                          id="colorQuantity"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                          data-oid="3.bqe-b"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(var(--chart-1))"
                            stopOpacity={0.8}
                            data-oid="ro0kos6"
                          />

                          <stop
                            offset="95%"
                            stopColor="hsl(var(--chart-1))"
                            stopOpacity={0.1}
                            data-oid="j43ju58"
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="hsl(var(--border))"
                        strokeOpacity={0.5}
                        data-oid="3jptcw9"
                      />

                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return format(date, "MM/dd", { locale: zhTW });
                        }}
                        tick={{ fontSize: 12 }}
                        data-oid="nffzj8:"
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 12 }}
                        domain={[
                          Math.max(0, stats.minQuantity - 5),
                          stats.maxQuantity + 5,
                        ]}
                        data-oid="7ag_jb."
                      />

                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            labelFormatter={(label) => {
                              const date = new Date(label);
                              return format(date, "yyyy年MM月dd日", {
                                locale: zhTW,
                              });
                            }}
                            data-oid="q4yt.91"
                          />
                        }
                        data-oid="8b0rrko"
                      />

                      <Area
                        type="monotone"
                        dataKey="quantity"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorQuantity)"
                        data-oid="rk0t14e"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>

              {/* 統計數據顯示 */}
              <div
                className="grid grid-cols-3 gap-4 text-center"
                data-oid="lnj:h_4"
              >
                <div className="space-y-1" data-oid="w-tkloc">
                  <div
                    className="text-xs text-muted-foreground"
                    data-oid="f479bd9"
                  >
                    期初庫存
                  </div>
                  <div className="text-sm font-medium" data-oid="2z7q_-v">
                    {stats.startQuantity.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-1" data-oid=":_43svn">
                  <div
                    className="text-xs text-muted-foreground"
                    data-oid="6.wj:px"
                  >
                    期末庫存
                  </div>
                  <div className="text-sm font-medium" data-oid="nqyyfxf">
                    {stats.endQuantity.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-1" data-oid="vtjy.od">
                  <div
                    className="text-xs text-muted-foreground"
                    data-oid="06v8vjc"
                  >
                    變化量
                  </div>
                  <div
                    className={`text-sm font-medium ${stats.change >= 0 ? "text-green-600" : "text-red-600"}`}
                    data-oid="9r31wiz"
                  >
                    {stats.change >= 0 ? "+" : ""}
                    {stats.change.toLocaleString()}
                    <span className="text-xs ml-1" data-oid="6-5qqu_">
                      ({stats.changePercent >= 0 ? "+" : ""}
                      {stats.changePercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* 無數據提示 */}
        {!isLoading &&
          !error &&
          productVariantId &&
          chartData &&
          chartData.length === 0 && (
            <div
              className="h-[300px] w-full flex items-center justify-center"
              data-oid="bwoq1c1"
            >
              <div className="text-center space-y-2" data-oid="z3jrqzj">
                <div
                  className="text-lg font-semibold text-muted-foreground"
                  data-oid="8q805-8"
                >
                  📈 無歷史數據
                </div>
                <div
                  className="text-sm text-muted-foreground"
                  data-oid="17v644u"
                >
                  該商品在選定時間範圍內沒有庫存記錄
                </div>
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
