"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  IconHelpCircle, 
  IconSearch, 
  IconBook, 
  IconMessageCircle, 
  IconPhone, 
  IconMail, 
  IconFileText,
  IconVideo,
  IconDownload,
  IconExternalLink,
  IconTrendingUp,
  IconQuestionMark,
  IconHeadphones,
  IconTicket,
  IconClock,
  IconCheck
} from "@tabler/icons-react";

/**
 * 幫助中心頁面（美化版）
 * 
 * 重新設計的幫助中心頁面，具有以下特色：
 * 1. 採用 Dashboard 風格的卡片設計
 * 2. 100% 使用 shadcn/UI 組件
 * 3. 遵循官方顏色規範
 * 4. 現代化的視覺設計和互動體驗
 * 5. 響應式設計和微互動效果
 */
export default function HelpPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 px-4 lg:px-6">
        {/* 📱 頁面標題區域 - Dashboard 風格 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <IconHelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">幫助中心</h1>
              <p className="text-muted-foreground">
                尋找答案、獲得技術支援和學習系統功能
              </p>
            </div>
          </div>
        </div>

        {/* 🔍 搜尋區域 - Dashboard 風格卡片 */}
        <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconSearch className="h-5 w-5 text-primary" />
              智能搜尋幫助
            </CardTitle>
            <CardDescription>
              輸入關鍵字快速找到您需要的幫助內容和解決方案
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Input 
                placeholder="搜尋常見問題、功能教學、故障排除..." 
                className="flex-1 h-11 bg-background/60 border-border/60 focus:border-primary/60 transition-all duration-200"
              />
              <Button className="sm:w-auto bg-primary hover:bg-primary/90 shadow-sm">
                <IconSearch className="h-4 w-4 mr-2" />
                立即搜尋
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors">
                <IconQuestionMark className="h-3 w-3 mr-1" />
                商品管理
              </Badge>
              <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors">
                <IconQuestionMark className="h-3 w-3 mr-1" />
                庫存調整
              </Badge>
              <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors">
                <IconQuestionMark className="h-3 w-3 mr-1" />
                訂單處理
              </Badge>
              <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors">
                <IconQuestionMark className="h-3 w-3 mr-1" />
                報表匯出
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 📋 快速導航 - Dashboard 統計卡片風格 */}
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          <Card className="@container/card cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
            <CardHeader>
              <CardDescription>使用者手冊</CardDescription>
              <CardTitle className="text-xl font-semibold @[250px]/card:text-2xl">
                完整指南
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <IconBook className="size-3" />
                  PDF
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                詳細功能說明 <IconBook className="size-4 text-primary" />
              </div>
              <div className="text-muted-foreground">
                系統完整使用教學
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
            <CardHeader>
              <CardDescription>影片教學</CardDescription>
              <CardTitle className="text-xl font-semibold @[250px]/card:text-2xl">
                視覺學習
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <IconVideo className="size-3" />
                  HD
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                實操示範影片 <IconVideo className="size-4 text-primary" />
              </div>
              <div className="text-muted-foreground">
                步驟式操作教學
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
            <CardHeader>
              <CardDescription>常見問題</CardDescription>
              <CardTitle className="text-xl font-semibold @[250px]/card:text-2xl">
                快速解答
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <IconTrendingUp className="size-3" />
                  熱門
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                即時問題解決 <IconMessageCircle className="size-4 text-primary" />
              </div>
              <div className="text-muted-foreground">
                最常遇到的問題
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
            <CardHeader>
              <CardDescription>技術支援</CardDescription>
              <CardTitle className="text-xl font-semibold @[250px]/card:text-2xl">
                專業服務
              </CardTitle>
              <CardAction>
                <Badge variant="destructive">
                  <IconClock className="size-3" />
                  24/7
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                聯絡專業團隊 <IconHeadphones className="size-4 text-primary" />
              </div>
              <div className="text-muted-foreground">
                即時技術支援服務
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 📋 常見問題 - 美化版 */}
          <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconQuestionMark className="h-5 w-5 text-primary" />
                常見問題
              </CardTitle>
              <CardDescription>
                最常詢問的問題與詳細解答，幫助您快速解決疑問
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-border/50">
                  <AccordionTrigger className="hover:no-underline group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                        <IconBook className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">如何新增商品？</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed ml-11">
                    進入「商品管理」→「商品列表」→點擊「新增商品」按鈕，
                    填寫商品基本資訊、規格、定價等資料後儲存即可。
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2" className="border-border/50">
                  <AccordionTrigger className="hover:no-underline group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                        <IconTrendingUp className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">如何調整庫存數量？</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed ml-11">
                    進入「庫存管理」→「庫存清單」→選擇要調整的商品→
                    點擊「調整庫存」→輸入調整數量和原因後確認。
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3" className="border-border/50">
                  <AccordionTrigger className="hover:no-underline group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                        <IconClock className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">如何設定庫存預警？</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed ml-11">
                    在新增或編輯商品時，可以設定「低庫存閾值」，
                    當庫存低於此數量時系統會自動發出預警通知。
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4" className="border-border/50">
                  <AccordionTrigger className="hover:no-underline group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                        <IconDownload className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">如何匯出報表？</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed ml-11">
                    在各個管理頁面（如訂單管理、庫存管理）都有「匯出」按鈕，
                    選擇要匯出的格式（Excel、PDF）和時間範圍即可下載。
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5" className="border-b-0">
                  <AccordionTrigger className="hover:no-underline group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                        <IconMail className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">忘記密碼怎麼辦？</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed ml-11">
                    在登入頁面點擊「忘記密碼」→輸入註冊的電子信箱→
                    檢查信箱中的重設密碼連結→設定新密碼。
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* 🎧 聯絡支援 - 美化版 */}
          <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconHeadphones className="h-5 w-5 text-primary" />
                聯絡支援
              </CardTitle>
              <CardDescription>
                需要更多協助？我們的專業團隊隨時為您服務
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 線上客服 */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg hover:border-primary/20 transition-all duration-200 hover:bg-primary/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <IconMessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">線上客服</h4>
                  <p className="text-sm text-muted-foreground">
                    即時線上協助，工作時間 9:00-18:00
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <IconMessageCircle className="h-4 w-4 mr-1" />
                  開始對話
                </Button>
              </div>

              {/* 電話支援 */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg hover:border-primary/20 transition-all duration-200 hover:bg-primary/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <IconPhone className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">電話支援</h4>
                  <p className="text-sm text-muted-foreground font-mono">
                    技術支援專線：(02) 1234-5678
                  </p>
                </div>
                <Badge variant="destructive">
                  <IconClock className="h-3 w-3 mr-1" />
                  24/7
                </Badge>
              </div>

              {/* 郵件支援 */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg hover:border-primary/20 transition-all duration-200 hover:bg-primary/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <IconMail className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">郵件支援</h4>
                  <p className="text-sm text-muted-foreground font-mono">
                    support@lomis.com.tw
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <IconExternalLink className="h-4 w-4 mr-1" />
                  發送郵件
                </Button>
              </div>

              {/* 工單系統 */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg hover:border-primary/20 transition-all duration-200 hover:bg-primary/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <IconTicket className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">工單系統</h4>
                  <p className="text-sm text-muted-foreground">
                    提交詳細的技術問題報告，追蹤處理進度
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <IconTicket className="h-4 w-4 mr-1" />
                  建立工單
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 📥 文件下載 - Dashboard 風格 */}
        <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconDownload className="h-5 w-5 text-primary" />
              文件下載中心
            </CardTitle>
            <CardDescription>
              下載完整的使用手冊、快速指南和開發文件
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="group flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg hover:border-primary/20 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-primary/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <IconFileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">使用者手冊</h4>
                  <p className="text-sm text-muted-foreground">
                    <Badge variant="secondary">PDF</Badge>
                    <span className="ml-2">2.5 MB</span>
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconDownload className="h-4 w-4" />
                </Button>
              </div>

              <div className="group flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg hover:border-primary/20 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-primary/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <IconCheck className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">快速入門指南</h4>
                  <p className="text-sm text-muted-foreground">
                    <Badge variant="secondary">PDF</Badge>
                    <span className="ml-2">1.2 MB</span>
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconDownload className="h-4 w-4" />
                </Button>
              </div>

              <div className="group flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg hover:border-primary/20 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-primary/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <IconFileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">API 開發文件</h4>
                  <p className="text-sm text-muted-foreground">
                    <Badge variant="secondary">PDF</Badge>
                    <span className="ml-2">3.1 MB</span>
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconDownload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-dashed border-border/50">
              <div className="flex items-center gap-3">
                <IconCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">下載提示</p>
                  <p className="text-xs text-muted-foreground">
                    所有文件均為最新版本，建議您定期更新以獲得最佳體驗
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 