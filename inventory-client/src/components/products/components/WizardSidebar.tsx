import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle } from "lucide-react";

/**
 * 步驟配置定義
 */
const STEPS = [
  {
    id: 1,
    title: "基本資訊",
    description: "商品名稱、描述、分類",
    icon: "📋",
  },
  {
    id: 2,
    title: "規格定義",
    description: "屬性選擇與規格管理",
    icon: "⚙️",
  },
  {
    id: 3,
    title: "設定變體",
    description: "SKU 變體與價格配置",
    icon: "🏷️",
  },
  {
    id: 4,
    title: "預覽確認",
    description: "最終確認與提交",
    icon: "✅",
  },
];

interface WizardSidebarProps {
  currentStep: number;
  progressPercentage: number;
  isEditMode: boolean;
}

export function WizardSidebar({
  currentStep,
  progressPercentage,
  isEditMode,
}: WizardSidebarProps) {
  return (
    <aside className="hidden md:block md:col-span-1 space-y-6 sticky top-6">
      {/* 嚮導標題 */}
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold">
          {isEditMode ? "編輯商品" : "創建商品"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isEditMode ? "更新商品資訊" : "填寫商品基本資訊和規格"}
        </p>
      </div>

      {/* 進度條 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">創建進度</span>
          <Badge variant="outline" className="text-xs">
            {Math.round(progressPercentage)}% 完成
          </Badge>
        </div>
        <Progress value={progressPercentage} className="w-full h-2" />
      </div>

      {/* 步驟列表 */}
      <div className="space-y-2">
        {STEPS.map((stepInfo, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div
              key={stepInfo.id}
              className={`flex items-start space-x-3 p-3 rounded-lg transition-all ${
                isCurrent
                  ? "bg-primary/10 border border-primary/20"
                  : isCompleted
                    ? "bg-muted/50"
                    : "bg-transparent"
              }`}
            >
              {/* 步驟圖標 */}
              <div className="flex-shrink-0 mt-0.5">
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-primary" />
                ) : isCurrent ? (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-xs font-medium">
                      {stepNumber}
                    </span>
                  </div>
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* 步驟資訊 */}
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-medium ${
                    isCurrent
                      ? "text-foreground"
                      : isCompleted
                        ? "text-muted-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {stepInfo.title}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {stepInfo.description}
                </div>

                {/* 當前步驟標示 */}
                {isCurrent && (
                  <div className="flex items-center mt-1.5 text-xs text-primary">
                    <div className="h-1.5 w-1.5 bg-primary rounded-full mr-2 animate-pulse"></div>
                    進行中
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}