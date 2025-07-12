"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  MessageCircle, 
  Phone, 
  Mail, 
  FileText,
  Video,
  Download,
  ExternalLink
} from "lucide-react";

/**
 * 幫助中心頁面
 * 
 * 提供用戶支援和說明文件
 */
export default function HelpPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center gap-3">
        <HelpCircle className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">幫助中心</h1>
          <p className="text-muted-foreground">
            尋找答案和獲得技術支援
          </p>
        </div>
      </div>

      <Separator />

      {/* 搜尋區域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            搜尋幫助
          </CardTitle>
          <CardDescription>
            輸入關鍵字尋找相關的幫助文件
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              placeholder="搜尋常見問題、教學或功能說明..." 
              className="flex-1"
            />
            <Button>
              <Search className="h-4 w-4" />
              搜尋
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 快速導航 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <h3 className="font-semibold mb-1">使用者手冊</h3>
            <p className="text-sm text-muted-foreground">完整的功能說明</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Video className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <h3 className="font-semibold mb-1">影片教學</h3>
            <p className="text-sm text-muted-foreground">實操示範影片</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <h3 className="font-semibold mb-1">常見問題</h3>
            <p className="text-sm text-muted-foreground">快速解答</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Phone className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <h3 className="font-semibold mb-1">技術支援</h3>
            <p className="text-sm text-muted-foreground">聯絡我們</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 常見問題 */}
        <Card>
          <CardHeader>
            <CardTitle>常見問題</CardTitle>
            <CardDescription>
              最常詢問的問題與解答
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>如何新增商品？</AccordionTrigger>
                <AccordionContent>
                  進入「商品管理」→「商品列表」→點擊「新增商品」按鈕，
                  填寫商品基本資訊、規格、定價等資料後儲存即可。
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger>如何調整庫存數量？</AccordionTrigger>
                <AccordionContent>
                  進入「庫存管理」→「庫存清單」→選擇要調整的商品→
                  點擊「調整庫存」→輸入調整數量和原因後確認。
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger>如何設定庫存預警？</AccordionTrigger>
                <AccordionContent>
                  在新增或編輯商品時，可以設定「低庫存閾值」，
                  當庫存低於此數量時系統會自動發出預警通知。
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger>如何匯出報表？</AccordionTrigger>
                <AccordionContent>
                  在各個管理頁面（如訂單管理、庫存管理）都有「匯出」按鈕，
                  選擇要匯出的格式（Excel、PDF）和時間範圍即可下載。
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger>忘記密碼怎麼辦？</AccordionTrigger>
                <AccordionContent>
                  在登入頁面點擊「忘記密碼」→輸入註冊的電子信箱→
                  檢查信箱中的重設密碼連結→設定新密碼。
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* 聯絡支援 */}
        <Card>
          <CardHeader>
            <CardTitle>聯絡支援</CardTitle>
            <CardDescription>
              需要更多協助？聯絡我們的支援團隊
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 線上客服 */}
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <MessageCircle className="h-6 w-6 text-blue-500" />
              <div className="flex-1">
                <h4 className="font-medium">線上客服</h4>
                <p className="text-sm text-muted-foreground">
                  即時線上協助，工作時間 9:00-18:00
                </p>
              </div>
              <Button variant="outline" size="sm">
                開始對話
              </Button>
            </div>

            {/* 電話支援 */}
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Phone className="h-6 w-6 text-green-500" />
              <div className="flex-1">
                <h4 className="font-medium">電話支援</h4>
                <p className="text-sm text-muted-foreground">
                  技術支援專線：(02) 1234-5678
                </p>
              </div>
              <Badge variant="secondary">24/7</Badge>
            </div>

            {/* 郵件支援 */}
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Mail className="h-6 w-6 text-orange-500" />
              <div className="flex-1">
                <h4 className="font-medium">郵件支援</h4>
                <p className="text-sm text-muted-foreground">
                  support@lomis.com.tw
                </p>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4" />
                發送
              </Button>
            </div>

            {/* 工單系統 */}
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <FileText className="h-6 w-6 text-purple-500" />
              <div className="flex-1">
                <h4 className="font-medium">工單系統</h4>
                <p className="text-sm text-muted-foreground">
                  提交詳細的技術問題報告
                </p>
              </div>
              <Button variant="outline" size="sm">
                建立工單
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 文件下載 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            文件下載
          </CardTitle>
          <CardDescription>
            下載使用手冊和相關文件
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <FileText className="h-8 w-8 text-red-500" />
              <div className="flex-1">
                <h4 className="font-medium">使用者手冊</h4>
                <p className="text-sm text-muted-foreground">PDF, 2.5 MB</p>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="flex-1">
                <h4 className="font-medium">快速入門指南</h4>
                <p className="text-sm text-muted-foreground">PDF, 1.2 MB</p>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <FileText className="h-8 w-8 text-green-500" />
              <div className="flex-1">
                <h4 className="font-medium">API 文件</h4>
                <p className="text-sm text-muted-foreground">PDF, 3.1 MB</p>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 