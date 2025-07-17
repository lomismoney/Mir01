"use client";

import React, { lazy, Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateOrder } from "@/hooks";
import { useCheckStockAvailability, StockSuggestion } from "@/hooks/queries/orders/useCheckStockAvailability";
import { useOrderSubmitProgress } from "@/hooks/useOrderSubmitProgress";
import { OrderFormValues } from "@/components/orders/OrderForm";
import { StockSuggestionDialog, StockDecision } from "@/components/orders/StockSuggestionDialog";
import { OrderSubmitProgressDialog } from "@/components/orders/OrderSubmitProgressDialog";
import { toast } from "sonner";
import { LoadingFallback } from "@/components/ui/skeleton";
import { OrderFormErrorBoundary } from "@/components/orders/OrderFormErrorBoundary";

// 動態導入訂單表單組件
const OrderForm = lazy(() => import("@/components/orders/OrderForm").then(module => ({ default: module.OrderForm })));

/**
 * 擴展的錯誤介面，支援庫存檢查結構化異常
 */
interface StockCheckError extends Error {
  error_type?: string;
  stockCheckResults?: unknown[];
  insufficientStockItems?: unknown[];
}

/**
 * 新增訂單頁面
 * 
 * 🎯 智能預訂系統：自動處理庫存不足情況
 * 
 * 功能特性：
 * 1. 📦 智能判斷：系統自動根據庫存狀況設定商品類型
 * 2. 🛒 自動預訂：無庫存商品自動轉為預訂狀態
 * 3. 🎯 簡化體驗：無需手動確認，直接建立訂單
 */
export default function NewOrderPage() {
  const router = useRouter();
  const { mutate: createOrder, isPending } = useCreateOrder();
  const { mutate: checkStock, isPending: isCheckingStock } = useCheckStockAvailability();
  const progress = useOrderSubmitProgress();

  // 智慧庫存建議狀態
  const [showStockSuggestions, setShowStockSuggestions] = useState(false);
  const [stockSuggestions, setStockSuggestions] = useState<StockSuggestion[]>([]);
  const [pendingOrderData, setPendingOrderData] = useState<OrderFormValues | null>(null);
  const [stockDecisions, setStockDecisions] = useState<StockDecision[]>([]);
  
  // 添加 useEffect 來監控狀態變化
  React.useEffect(() => {
    console.log('showStockSuggestions 狀態變化:', showStockSuggestions);
    console.log('stockSuggestions 長度:', stockSuggestions.length);
  }, [showStockSuggestions, stockSuggestions]);

  /**
   * 處理智慧庫存建議確認
   */
  const handleStockDecisionConfirm = async (decisions: StockDecision[]) => {
    setStockDecisions(decisions);
    setShowStockSuggestions(false);
    
    if (!pendingOrderData) return;
    
    // 處理進貨需求
    const purchaseDecisions = decisions.filter(d => d.action === 'purchase' || d.action === 'mixed');
    const purchaseItems = purchaseDecisions
      .filter(d => d.purchase_quantity && d.purchase_quantity > 0)
      .map(d => ({
        product_variant_id: d.product_variant_id,
        quantity: d.purchase_quantity
      }));
    
    // 附帶進貨需求資訊到訂單
    const orderWithStockInfo = {
      ...pendingOrderData,
      needs_purchase: purchaseItems.length > 0,
      purchase_items: purchaseItems,
      stock_decisions: decisions
    };
    
    // 儲存調貨資訊，待訂單建立後使用
    setPendingOrderData(orderWithStockInfo);
    
    // 直接建立訂單，後端會自動處理調貨
    submitOrder(orderWithStockInfo, false);
  };

  /**
   * 強制建立預訂單
   */
  const handleForceCreate = () => {
    setShowStockSuggestions(false);
    if (pendingOrderData) {
      submitOrder(pendingOrderData, true);
    }
  };

  /**
   * 處理訂單提交邏輯
   * 
   * @param values 表單數據
   */
  const handleSubmit = async (values: OrderFormValues, forceCreate: boolean = false) => {
    // 開始進度追蹤
    progress.start();
    progress.updateStep('validate', 'processing');
    // 💡 修正：確保所有必填欄位都正確提供，並統一數據格式處理
    const orderData = {
      customer_id: values.customer_id,
      store_id: Number(values.store_id), // 🎯 確保 store_id 為數字類型
      shipping_status: values.shipping_status || 'pending',
      payment_status: values.payment_status || 'pending',
      shipping_fee: values.shipping_fee || 0,
      tax: values.tax || 0,
      discount_amount: values.discount_amount || 0,
      payment_method: values.payment_method || 'cash',
      order_source: values.order_source || 'direct',
      shipping_address: values.shipping_address || '',
      notes: values.notes || '',
      items: values.items.map((item) => ({
        product_variant_id: item.product_variant_id,
        is_stocked_sale: item.is_stocked_sale,
        is_backorder: item.is_backorder || false, // 🎯 確保包含預訂標記
        status: item.status || 'pending',
        quantity: item.quantity,
        price: item.price,
        product_name: item.product_name,
        sku: item.sku,
        custom_specifications: item.custom_specifications 
          ? JSON.stringify(item.custom_specifications) 
          : null,
      })),
    };


    // 驗證完成
    progress.updateStep('validate', 'completed');

    // 準備庫存檢查數據
    const stockCheckData = {
      store_id: orderData.store_id,
      items: orderData.items
        .filter((item: any) => item.product_variant_id) // 🎯 檢查所有有 product_variant_id 的商品
        .map((item: any) => ({
          product_variant_id: item.product_variant_id,
          quantity: item.quantity,
        })),
    };

    // 如果有現貨商品且不是強制建單，先檢查庫存
    if (stockCheckData.items.length > 0 && !forceCreate) {
      setPendingOrderData(orderData);
      progress.updateStep('check-stock', 'processing');
      
      checkStock(stockCheckData, {
        onSuccess: (response) => {
          progress.updateStep('check-stock', 'completed');
          
          console.log('庫存檢查響應:', response);
          console.log('has_shortage:', response.has_shortage);
          console.log('suggestions:', response.suggestions);
          
          if (response.has_shortage) {
            // 🎯 確保篩選出真正有庫存不足的商品
            const shortageItems = response.suggestions.filter(s => s.type !== 'sufficient');
            console.log('過濾後的 shortageItems:', shortageItems);
            
            if (shortageItems.length > 0) {
              // 保存待處理的訂單數據
              setPendingOrderData(values);
              
              // 顯示智慧建議對話框
              console.log('設置 stockSuggestions:', shortageItems);
              console.log('設置 showStockSuggestions: true');
              setStockSuggestions(shortageItems);
              setShowStockSuggestions(true);
              progress.reset(); // 暫停進度，等待用戶決定
              return; // 確保不會繼續執行
            } else {
              // 雖然 has_shortage 為 true，但沒有真正不足的商品，直接建單
              submitOrder(orderData, false);
            }
          } else {
            // 庫存充足，直接建單
            submitOrder(orderData, false);
          }
        },
        onError: (error) => {
          progress.updateStep('check-stock', 'error', '庫存檢查失敗');
          progress.fail('庫存檢查失敗');
          
          // 庫存檢查失敗，讓用戶選擇是否繼續
          console.error('庫存檢查失敗:', error);
          toast.error('庫存檢查失敗', {
            description: '是否要繼續建立訂單？',
            action: {
              label: '繼續建單',
              onClick: () => {
                progress.reset();
                submitOrder(orderData, true);
              },
            },
          });
        },
      });
    } else {
      // 沒有現貨商品或強制建單，跳過庫存檢查
      progress.updateStep('check-stock', 'completed');
      submitOrder(orderData, forceCreate);
    }
  };

  /**
   * 實際提交訂單
   */
  const submitOrder = (orderData: Record<string, any>, forceCreate: boolean) => {
    // 更新進度：開始建立訂單
    if (!progress.isActive) {
      progress.start();
      progress.updateStep('validate', 'completed');
      progress.updateStep('check-stock', 'completed');
    }
    progress.updateStep('create-order', 'processing');
    // 處理商品類型標記
    const processedItems = orderData.items.map((item: any) => {
      // 如果沒有 product_variant_id，是訂製商品，保持原樣
      if (!item.product_variant_id) {
        return item;
      }
      
      // 檢查這個商品是否在庫存決策中被標記為需要進貨
      const needsPurchase = orderData.purchase_items?.some(
        (p: any) => p.product_variant_id === item.product_variant_id
      );
      
      // 如果是強制建單或需要進貨，覆蓋原有的標記
      if (needsPurchase || forceCreate) {
        // 需要進貨或強制建單的設為預訂商品
        return {
          ...item,
          is_stocked_sale: false,
          is_backorder: true,
        };
      }
      
      // 否則保持原有的標記（這樣可以保留從商品選擇器中設定的正確標記）
      return item;
    });

    const finalOrderData = {
      ...orderData,
      items: processedItems,
      force_create_despite_stock: forceCreate ? 1 : 0,
    };

    createOrder(finalOrderData, {
      onSuccess: (data) => {
        // 🎯 成功建立訂單
        progress.updateStep('create-order', 'completed');
        
        const response = data as { data?: { id?: number; order_number?: string } };
        const newOrderId = response?.data?.id;
        const orderNumber = response?.data?.order_number;
        
        // 沒有調貨需求，跳過調貨步驟
        progress.skipStep('create-transfers');
        progress.updateStep('finalize', 'processing');
        
        // 根據是否為預訂模式顯示不同的成功訊息
        if (forceCreate) {
          toast.success('預訂訂單建立成功！', {
            description: `訂單編號：${orderNumber}，部分商品將於補貨後出貨`,
          });
        } else {
          toast.success('訂單建立成功！', {
            description: `訂單編號：${orderNumber}`,
          });
        }
        
        progress.complete();
        
        // 延遲導航
        setTimeout(() => {
          if (newOrderId) {
            router.push(`/orders/${newOrderId}`);
          } else {
            router.push("/orders");
          }
        }, 1500);
      },
      onError: (error) => {
        console.error('❌ 訂單創建失敗:', error);
        console.log('錯誤詳細結構:', {
          message: error.message,
          error_type: (error as any).error_type,
          stockCheckResults: (error as any).stockCheckResults,
          insufficientStockItems: (error as any).insufficientStockItems,
          fullError: error
        });
        progress.updateStep('create-order', 'error', error.message || '訂單建立失敗');
        
        // 🎯 預訂系統：智能錯誤處理 - 自動預訂模式
        const stockError = error as StockCheckError;
        // 檢查多種可能的錯誤格式
        const isStockError = 
          (error as any).error_type === 'insufficient_stock' ||
          error.message === '庫存不足' ||
          stockError?.stockCheckResults || 
          stockError?.insufficientStockItems;

        // 檢查此次提交是否已經帶有 forceCreate 標記
        const alreadyForced = forceCreate;

        if (isStockError && !alreadyForced) {
          // 🎯 智能處理：先獲取庫存建議，再決定如何處理
          progress.fail('庫存不足');
          
          // 準備庫存檢查數據
          const stockCheckData = {
            store_id: orderData.store_id,
            items: orderData.items
              .filter((item: any) => item.product_variant_id) // 🎯 檢查所有有 product_variant_id 的商品
              .map((item: any) => ({
                product_variant_id: item.product_variant_id,
                quantity: item.quantity,
              })),
          };
          
          // 調用庫存檢查 API 獲取智能建議
          checkStock(stockCheckData, {
            onSuccess: (response) => {
              
              if (response.has_shortage) {
                // 🎯 確保篩選出真正有庫存不足的商品
                const shortageItems = response.suggestions.filter(s => s.type !== 'sufficient');
                
                if (shortageItems.length > 0) {
                  // 顯示智慧建議對話框
                  setStockSuggestions(shortageItems);
                  setShowStockSuggestions(true);
                  setPendingOrderData(orderData); // 保存訂單數據，等待用戶決定
                } else {
                  // 雖然 has_shortage 為 true，但沒有真正不足的商品，強制建單
                  const forceOrder = {
                    ...orderData,
                    force_create_despite_stock: 1,
                  };
                  submitOrder(forceOrder, true);
                }
              } else {
                // 理論上不應該到這裡，因為已經報庫存不足錯誤
                // 但為了安全起見，還是處理一下
                const forceOrder = {
                  ...orderData,
                  force_create_despite_stock: 1,
                };
                submitOrder(forceOrder, true);
              }
            },
            onError: (checkError) => {
              // 如果獲取建議失敗，顯示選項讓用戶決定
              console.error('獲取庫存建議失敗:', checkError);
              toast.error('庫存不足', {
                description: '部分商品庫存不足，是否要繼續建立預訂訂單？',
                duration: 10000,
                action: {
                  label: '建立預訂單',
                  onClick: () => {
                    const forceOrder = {
                      ...orderData,
                      force_create_despite_stock: 1,
                    };
                    progress.reset();
                    submitOrder(forceOrder, true);
                  },
                },
              });
            },
          });
        } else {
          // 🎯 其他類型的錯誤：顯示一般錯誤訊息
          toast.error('訂單建立失敗', {
            description: error.message || '請檢查輸入資料並重試。',
          });
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">新增訂單</h1>
        <p className="text-muted-foreground">
          建立新的訂單記錄，系統將自動處理庫存狀況。
        </p>
      </div>
      
      <OrderFormErrorBoundary>
        <Suspense fallback={<LoadingFallback type="page" text="載入訂單表單..." />}>
          <OrderForm
            isSubmitting={isPending || isCheckingStock}
            onSubmit={(values) => handleSubmit(values, false)} // 初始提交，不強制建單
          />
        </Suspense>
      </OrderFormErrorBoundary>

      {/* 智慧庫存建議對話框 */}
      <StockSuggestionDialog
        open={showStockSuggestions}
        onOpenChange={(open) => {
          console.log('StockSuggestionDialog onOpenChange:', open);
          setShowStockSuggestions(open);
        }}
        suggestions={stockSuggestions}
        onConfirm={handleStockDecisionConfirm}
        onForceCreate={handleForceCreate}
        isProcessing={isPending}
      />
      
      {/* 訂單提交進度對話框 */}
      <OrderSubmitProgressDialog
        open={progress.isActive}
        steps={progress.steps}
        currentStep={progress.currentStep}
      />
    </div>
  );
}