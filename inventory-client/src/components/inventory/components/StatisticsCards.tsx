import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, TrendingUp, Clock, Archive, Activity } from "lucide-react";

interface StatisticsCardsProps {
  todayCount: number;
  weekCount: number;
  totalCount: number;
  pendingCount: number;
}

export function StatisticsCards({
  todayCount,
  weekCount,
  totalCount,
  pendingCount,
}: StatisticsCardsProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 mb-6">
      {/* 今日入庫 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>今日入庫</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {todayCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-green-600">
              <ArrowUp className="size-4" />
              新增
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            入庫作業進行中 <Activity className="size-4" />
          </div>
          <div className="text-muted-foreground">今日商品入庫操作次數</div>
        </CardFooter>
      </Card>

      {/* 本週入庫 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>本週入庫</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {weekCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-blue-600">
              <TrendingUp className="size-4" />
              成長
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            入庫效率良好 <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">本週入庫操作統計</div>
        </CardFooter>
      </Card>

      {/* 待處理 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>待處理</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {pendingCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-orange-600">
              <Clock className="size-4" />
              待處理
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            需要處理 <Clock className="size-4" />
          </div>
          <div className="text-muted-foreground">等待處理的入庫操作</div>
        </CardFooter>
      </Card>

      {/* 總計 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>總計</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-gray-600">
              <Archive className="size-4" />
              總計
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            歷史記錄 <Archive className="size-4" />
          </div>
          <div className="text-muted-foreground">歷史入庫操作總數</div>
        </CardFooter>
      </Card>
    </div>
  );
}