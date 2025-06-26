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
      data-oid="2n3p0df"
    >
      <Card className="@container/card" data-oid="4.87by1">
        <CardHeader data-oid="0wqgai6">
          <CardDescription data-oid="-o5uk89">總庫存數量</CardDescription>
          <CardTitle
            className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
            data-oid="uaq3btr"
          >
            15,234
          </CardTitle>
          <CardAction data-oid="k15r0qw">
            <Badge variant="outline" data-oid="8phjmgd">
              <IconTrendingUp data-oid="tw-_:y4" />
              +8.2%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter
          className="flex-col items-start gap-1.5 text-sm"
          data-oid="f:xz_i."
        >
          <div
            className="line-clamp-1 flex gap-2 font-medium"
            data-oid="fjbev:p"
          >
            庫存增長穩定 <IconBox className="size-4" data-oid="1orfshw" />
          </div>
          <div className="text-muted-foreground" data-oid="db732p0">
            與上月相比增加了 8.2%
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card" data-oid="_djqiu9">
        <CardHeader data-oid="h94oufi">
          <CardDescription data-oid="nll-0kq">待入庫訂單</CardDescription>
          <CardTitle
            className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
            data-oid="xabytb9"
          >
            127
          </CardTitle>
          <CardAction data-oid=":wr.eue">
            <Badge variant="outline" data-oid="zuxtp0y">
              <IconTrendingUp data-oid="h55cpwt" />
              +15%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter
          className="flex-col items-start gap-1.5 text-sm"
          data-oid="_7_ohd3"
        >
          <div
            className="line-clamp-1 flex gap-2 font-medium"
            data-oid="w5vhfor"
          >
            入庫作業繁忙 <IconPackage className="size-4" data-oid="sn178lk" />
          </div>
          <div className="text-muted-foreground" data-oid="fh0pulf">
            需要加快入庫處理速度
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card" data-oid="okkvtk4">
        <CardHeader data-oid="y7g5x-f">
          <CardDescription data-oid="xsp7:d7">待出庫訂單</CardDescription>
          <CardTitle
            className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
            data-oid="_.n2kub"
          >
            89
          </CardTitle>
          <CardAction data-oid="7xyn9_s">
            <Badge variant="outline" data-oid="yw7swx.">
              <IconTrendingDown data-oid="t2.lvj4" />
              -12%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter
          className="flex-col items-start gap-1.5 text-sm"
          data-oid="4fo.xlv"
        >
          <div
            className="line-clamp-1 flex gap-2 font-medium"
            data-oid="ustqdor"
          >
            出庫效率提升 <IconTruck className="size-4" data-oid="yvfajqg" />
          </div>
          <div className="text-muted-foreground" data-oid=".fwifl9">
            出貨速度較上週改善
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card" data-oid="crgz23q">
        <CardHeader data-oid="jxa-tmp">
          <CardDescription data-oid="34i2-4b">低庫存警告</CardDescription>
          <CardTitle
            className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
            data-oid="jjwxaj6"
          >
            23
          </CardTitle>
          <CardAction data-oid="-ce_0wz">
            <Badge variant="destructive" data-oid="8uep12u">
              <IconAlertTriangle data-oid="1odrx7q" />
              警告
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter
          className="flex-col items-start gap-1.5 text-sm"
          data-oid="v-:_v5t"
        >
          <div
            className="line-clamp-1 flex gap-2 font-medium"
            data-oid="8d9k_tm"
          >
            需要補貨 <IconAlertTriangle className="size-4" data-oid="ztektv1" />
          </div>
          <div className="text-muted-foreground" data-oid="jclhqow">
            23 項商品庫存不足
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
