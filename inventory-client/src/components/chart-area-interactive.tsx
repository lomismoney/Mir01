"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

/**
 * 庫存趨勢互動式圖表組件
 * 顯示庫存數量的歷史趨勢，支持不同時間範圍的篩選
 * 暫時使用佔位符設計，避免 SSR 問題
 */

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // 模擬數據統計
  const getStats = () => {
    switch (timeRange) {
      case "7d":
        return { 入庫總量: "8,450", 出庫總量: "7,890", 淨增長: "+560" }
      case "30d":
        return { 入庫總量: "34,200", 出庫總量: "31,800", 淨增長: "+2,400" }
      default:
        return { 入庫總量: "125,600", 出庫總量: "118,900", 淨增長: "+6,700" }
    }
  }

  const stats = getStats()

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>庫存流量趨勢</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            過去3個月的入庫與出庫趨勢
          </span>
          <span className="@[540px]/card:hidden">過去3個月趨勢</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">過去3個月</ToggleGroupItem>
            <ToggleGroupItem value="30d">過去30天</ToggleGroupItem>
            <ToggleGroupItem value="7d">過去7天</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="選擇時間範圍"
            >
              <SelectValue placeholder="過去3個月" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                過去3個月
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                過去30天
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                過去7天
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {/* 暫時的圖表佔位符 */}
        <div className="aspect-auto h-[250px] w-full">
          <div className="h-full w-full border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-4 bg-muted/20">
            <div className="text-center space-y-2">
              <div className="text-lg font-semibold text-muted-foreground">
                📊 庫存流量圖表
              </div>
              <div className="text-sm text-muted-foreground">
                圖表組件正在開發中
              </div>
            </div>
            
            {/* 統計數據顯示 */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">入庫總量</div>
                <div className="text-sm font-medium text-green-600">{stats.入庫總量}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">出庫總量</div>
                <div className="text-sm font-medium text-red-600">{stats.出庫總量}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">淨增長</div>
                <div className="text-sm font-medium text-blue-600">{stats.淨增長}</div>
              </div>
            </div>
            
            {/* 時間範圍指示器 */}
            <div className="text-xs text-muted-foreground">
              當前顯示：{timeRange === "7d" ? "過去7天" : timeRange === "30d" ? "過去30天" : "過去3個月"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
