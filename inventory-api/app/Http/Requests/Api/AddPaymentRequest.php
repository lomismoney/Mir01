<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\PaymentRecord;

/**
 * 新增付款記錄的請求驗證
 * 
 * 用於驗證部分付款的輸入資料，確保資料完整性和業務邏輯正確性。
 */
class AddPaymentRequest extends FormRequest
{
    /**
     * 判斷用戶是否有權限進行此請求
     */
    public function authorize(): bool
    {
        return true; // 暫時允許所有用戶，實際應檢查權限
    }

    /**
     * 獲取適用於請求的驗證規則
     */
    public function rules(): array
    {
        return [
            'amount' => [
                'required',
                'numeric',
                'min:1',  // 最小 1 分
                function ($attribute, $value, $fail) {
                    // 自定義驗證：檢查收款金額不超過剩餘未付金額
                    // 注意：經過 prepareForValidation 後，$value 已經是分為單位
                    $order = $this->route('order');
                    if ($order) {
                        // 使用 getRawOriginal 獲取資料庫原始值（分）
                        $grandTotalInCents = $order->getRawOriginal('grand_total');
                        $paidAmountInCents = $order->getRawOriginal('paid_amount');
                        $remainingAmount = $grandTotalInCents - $paidAmountInCents; // 分
                        
                        if ($value > $remainingAmount) {
                            // 將剩餘金額轉換為元顯示給用戶
                            $remainingAmountInYuan = $remainingAmount / 100;
                            $fail("收款金額不能超過剩餘未付金額：{$remainingAmountInYuan}");
                        }
                    }
                },
            ],
            'payment_method' => [
                'required',
                'string',
                Rule::in(array_keys(PaymentRecord::getPaymentMethods())),
            ],
            'payment_date' => [
                'sometimes',
                'date',
                'before_or_equal:now',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:500',
            ],
        ];
    }

    /**
     * 自定義驗證錯誤訊息
     */
    public function messages(): array
    {
        return [
            'amount.required' => '付款金額為必填項目',
            'amount.numeric' => '付款金額必須為數字',
            'amount.min' => '付款金額必須大於 0.01',
            'payment_method.required' => '付款方式為必填項目',
            'payment_method.in' => '付款方式必須為：現金、轉帳或信用卡',
            'payment_date.date' => '付款日期格式不正確',
            'payment_date.before_or_equal' => '付款日期不能為未來時間',
            'notes.max' => '備註不能超過 500 個字符',
        ];
    }

    /**
     * 在驗證前準備資料
     * 
     * 1. 如果沒有提供付款日期，則設定為當前時間
     * 2. 將金額從元轉換為分
     */
    protected function prepareForValidation(): void
    {
        $data = [];
        
        if (!$this->has('payment_date')) {
            $data['payment_date'] = now();
        }
        
        // 處理金額轉換：元 -> 分
        if ($this->has('amount') && $this->input('amount') !== null) {
            $data['amount'] = round($this->input('amount') * 100);
        }
        
        $this->merge($data);
    }
    
    
    /**
     * 取得請求體參數的文檔
     * 
     * 用於 Scribe API 文檔生成
     * 
     * @return array
     */
    public function bodyParameters(): array
    {
        return [
            'amount' => [
                'description' => '付款金額',
                'example' => 5000.00,
            ],
            'payment_method' => [
                'description' => '付款方式（cash: 現金, transfer: 轉帳, credit_card: 信用卡）',
                'example' => 'cash',
            ],
            'payment_date' => [
                'description' => '付款日期（可選，預設為當前時間）',
                'example' => '2025-06-24',
            ],
            'notes' => [
                'description' => '付款備註（可選）',
                'example' => '第一期款項',
            ],
        ];
    }
}
