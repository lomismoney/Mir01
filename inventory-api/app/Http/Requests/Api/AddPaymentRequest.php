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
                'min:0.01',
                function ($attribute, $value, $fail) {
                    // 自定義驗證：檢查收款金額不超過剩餘未付金額
                    $order = $this->route('order');
                    if ($order) {
                        $remainingAmount = $order->grand_total - $order->paid_amount;
                        if ($value > $remainingAmount) {
                            $fail("收款金額不能超過剩餘未付金額：$remainingAmount");
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
     * 準備驗證的資料
     * 
     * 如果沒有提供付款日期，則設定為當前時間
     */
    protected function prepareForValidation(): void
    {
        if (!$this->has('payment_date')) {
            $this->merge([
                'payment_date' => now(),
            ]);
        }
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
