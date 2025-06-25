import {
  IconTrendingDown,
  IconTrendingUp,
  IconBox,
  IconPackage,
  IconTruck,
  IconAlertTriangle,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * 庫存管理系統統計卡片組件
 * 顯示總庫存、待入庫、待出庫和低庫存警告等關鍵指標
 */
export function SectionCards() {
  return (
    <div
      className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4"
      data-oid="qlcqme8"
    >
      <Card className="@container/card" data-oid="qh3beh_">
        <CardHeader data-oid="9ea8jtd">
          <CardDescription data-oid="9y7ol.f">總庫存數量</CardDescription>
          <CardTitle
            className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
            data-oid="k5lagp4"
          >
            15,234
          </CardTitle>
          <CardAction data-oid="45kpufs">
            <Badge variant="outline" data-oid="diavbs4">
              <IconTrendingUp data-oid="-97s0zx" />
              +8.2%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter
          className="flex-col items-start gap-1.5 text-sm"
          data-oid="mgn62p."
        >
          <div
            className="line-clamp-1 flex gap-2 font-medium"
            data-oid="_06.:pw"
          >
            庫存增長穩定 <IconBox className="size-4" data-oid="-3ajcnn" />
          </div>
          <div className="text-muted-foreground" data-oid="c0j8x35">
            與上月相比增加了 8.2%
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card" data-oid="75-66og">
        <CardHeader data-oid="-ps-8oj">
          <CardDescription data-oid="3qiw.dq">待入庫訂單</CardDescription>
          <CardTitle
            className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
            data-oid="feo.qkd"
          >
            127
          </CardTitle>
          <CardAction data-oid="jx-w9gd">
            <Badge variant="outline" data-oid="3e9j8mk">
              <IconTrendingUp data-oid="olw91fs" />
              +15%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter
          className="flex-col items-start gap-1.5 text-sm"
          data-oid="tofbh6y"
        >
          <div
            className="line-clamp-1 flex gap-2 font-medium"
            data-oid=":n7zie9"
          >
            入庫作業繁忙 <IconPackage className="size-4" data-oid="_h4njr-" />
          </div>
          <div className="text-muted-foreground" data-oid="1qznpli">
            需要加快入庫處理速度
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card" data-oid="n9hijz.">
        <CardHeader data-oid="_ujb7iv">
          <CardDescription data-oid="d3:m_gr">待出庫訂單</CardDescription>
          <CardTitle
            className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
            data-oid="o_:6_s0"
          >
            89
          </CardTitle>
          <CardAction data-oid="xk:ucs8">
            <Badge variant="outline" data-oid="8xl5vo:">
              <IconTrendingDown data-oid="htx8kn0" />
              -12%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter
          className="flex-col items-start gap-1.5 text-sm"
          data-oid=".3dtfw_"
        >
          <div
            className="line-clamp-1 flex gap-2 font-medium"
            data-oid="v-1r-f0"
          >
            出庫效率提升 <IconTruck className="size-4" data-oid="hpxlm-v" />
          </div>
          <div className="text-muted-foreground" data-oid="d8_f8cu">
            出貨速度較上週改善
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card" data-oid="f9z-y3c">
        <CardHeader data-oid="6aueg7i">
          <CardDescription data-oid="ue_cu67">低庫存警告</CardDescription>
          <CardTitle
            className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
            data-oid="oa32hzu"
          >
            23
          </CardTitle>
          <CardAction data-oid="0pcicdf">
            <Badge variant="destructive" data-oid="5cidg_.">
              <IconAlertTriangle data-oid="huw5ssl" />
              警告
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter
          className="flex-col items-start gap-1.5 text-sm"
          data-oid="3iwlu0q"
        >
          <div
            className="line-clamp-1 flex gap-2 font-medium"
            data-oid="fm4xb7r"
          >
            需要補貨 <IconAlertTriangle className="size-4" data-oid="xbwk59k" />
          </div>
          <div className="text-muted-foreground" data-oid="1l8co:o">
            23 項商品庫存不足
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
