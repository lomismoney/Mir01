<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreInstallationRequest;
use App\Http\Requests\Api\UpdateInstallationRequest;
use App\Http\Requests\Api\CreateInstallationFromOrderRequest;
use App\Http\Requests\Api\GetInstallationScheduleRequest;
use App\Http\Resources\Api\InstallationResource;
use App\Models\Installation;
use App\Services\InstallationService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;

/**
 * @group 安裝管理
 * @authenticated
 * 管理安裝單的相關 API
 */
class InstallationController extends Controller
{
    /**
     * @var InstallationService
     */
    private InstallationService $installationService;

    /**
     * 建構子 - 注入服務並設置資源授權
     */
    public function __construct(InstallationService $installationService)
    {
        $this->installationService = $installationService;
        
        // 🔐 使用 authorizeResource 自動將控制器方法與 InstallationPolicy 中的
        // viewAny、view、create、update、delete 方法進行映射
        $this->authorizeResource(Installation::class, 'installation');
    }

    /**
     * 檢查安裝師傅是否只能查看自己的資源
     * 
     * @param \App\Models\User $user
     * @return bool 如果用戶只能查看自己的資源則返回 true
     */
    private function isInstallerRestrictedToOwn($user): bool
    {
        // 檢查用戶是否只有 installer 角色
        // 如果用戶同時有其他高權限角色（admin, staff, viewer），則不限制
        return $user->hasRole('installer') && !$user->hasAnyRole(['admin', 'staff', 'viewer']);
    }

    /**
     * 獲取安裝單列表
     * 
     * @summary 獲取安裝單列表
     * @queryParam filter[status] 按狀態篩選。可選值：pending, scheduled, in_progress, completed, cancelled。Example: pending
     * @queryParam filter[installer_user_id] 按安裝師傅篩選。Example: 1
     * @queryParam filter[scheduled_date] 按預計安裝日期篩選。Example: 2025-06-24
     * @queryParam filter[customer_name] 按客戶姓名篩選（模糊搜尋）。Example: 王小明
     * @queryParam filter[installation_number] 按安裝單號篩選。Example: I-202506-0001
     * @queryParam include 包含關聯資源。可選值：items,order,installer,creator。Example: items,order
     * @queryParam sort 排序欄位。可選值：created_at,-created_at,scheduled_date,-scheduled_date。Example: -created_at
     * @queryParam per_page 每頁顯示筆數。Example: 15
     * 
     * @apiResourceCollection \App\Http\Resources\Api\InstallationResource
     * @apiResourceModel \App\Models\Installation
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        // 授權檢查已由 __construct 中的 authorizeResource 處理

        $query = QueryBuilder::for(Installation::class)
            ->allowedIncludes(['items', 'order', 'installer', 'creator'])
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('installer_user_id'),
                AllowedFilter::exact('scheduled_date'),
                AllowedFilter::partial('customer_name'),
                AllowedFilter::partial('installation_number'),
            ])
            ->allowedSorts(['created_at', 'scheduled_date'])
            ->defaultSort('-created_at');

        // 如果是安裝師傅，只能看到分配給自己的安裝單
        if ($this->isInstallerRestrictedToOwn($request->user())) {
            $query->where('installer_user_id', $request->user()->id);
        }

        $installations = $query->paginate($request->input('per_page', 15));

        return InstallationResource::collection($installations);
    }

    /**
     * 建立新的安裝單
     * 
     * @summary 建立新的安裝單
     * @bodyParam order_id integer 關聯的訂單ID（可選）。Example: 1
     * @bodyParam installer_user_id integer 分配的安裝師傅ID（可選）。Example: 2
     * @bodyParam customer_name string required 客戶姓名。Example: 王小明
     * @bodyParam customer_phone string required 客戶電話。Example: 0912345678
     * @bodyParam installation_address string required 安裝地址。Example: 台北市信義區信義路五段7號
     * @bodyParam scheduled_date string 預計安裝日期（可選，格式：Y-m-d）。Example: 2025-06-25
     * @bodyParam notes string 備註（可選）。Example: 請於下午2點後安裝
     * @bodyParam items array required 安裝項目清單。Example: [{"product_name": "辦公桌", "sku": "DESK-001", "quantity": 2, "specifications": "靠窗安裝"}]
     * @bodyParam items.*.order_item_id integer 關聯的訂單項目ID（可選）。Example: 1
     * @bodyParam items.*.product_name string required 商品名稱。Example: 辦公桌
     * @bodyParam items.*.sku string required 商品編號。Example: DESK-001
     * @bodyParam items.*.quantity integer required 數量。Example: 2
     * @bodyParam items.*.specifications string 安裝規格說明（可選）。Example: 靠窗安裝
     * @bodyParam items.*.notes string 項目備註（可選）。Example: 需要特殊固定器
     * 
     * @apiResource \App\Http\Resources\Api\InstallationResource
     * @apiResourceModel \App\Models\Installation
     */
    public function store(StoreInstallationRequest $request): InstallationResource
    {
        // 授權檢查已由 __construct 中的 authorizeResource 處理

        $installation = $this->installationService->createInstallation(
            $request->validated(),
            $request->user()->id
        );

        return new InstallationResource($installation->load(['items']));
    }

    /**
     * 從訂單建立安裝單
     * 
     * @summary 從訂單建立安裝單
     * @bodyParam order_id integer required 訂單ID。Example: 1
     * @bodyParam order_item_ids array required 要安裝的訂單項目ID清單。Example: [1, 2, 3]
     * @bodyParam order_item_ids.* integer required 訂單項目ID。Example: 1
     * @bodyParam installer_user_id integer 分配的安裝師傅ID（可選）。Example: 2
     * @bodyParam installation_address string 安裝地址（可選，預設使用訂單地址）。Example: 台北市信義區信義路五段7號
     * @bodyParam scheduled_date string 預計安裝日期（可選，格式：Y-m-d）。Example: 2025-06-25
     * @bodyParam notes string 備註（可選）。Example: 請於下午2點後安裝
     * @bodyParam specifications array 安裝規格（按訂單項目ID）。Example: ["靠窗安裝", "靠牆安裝"]
     * @bodyParam specifications.* string 安裝規格說明。Example: 靠窗安裝
     * 
     * @apiResource \App\Http\Resources\Api\InstallationResource
     * @apiResourceModel \App\Models\Installation
     */
    public function createFromOrder(CreateInstallationFromOrderRequest $request): InstallationResource
    {
        $this->authorize('createFromOrder', Installation::class);

        $validated = $request->validated();
        
        $installation = $this->installationService->createFromOrder(
            $validated['order_id'],
            $validated['order_item_ids'],
            $validated,
            $request->user()->id
        );

        return new InstallationResource($installation->load(['items', 'order']));
    }

    /**
     * 查看安裝單詳情
     * 
     * @urlParam installation integer required 安裝單ID。 Example: 1
     * @queryParam include 包含關聯資源。可選值：items,order,installer,creator。Example: items,order
     * 
     * @apiResource \App\Http\Resources\Api\InstallationResource
     * @apiResourceModel \App\Models\Installation
     */
    public function show(Request $request, Installation $installation): InstallationResource
    {
        // 授權檢查已由 __construct 中的 authorizeResource 處理

        // 只有在 include 參數有值時才載入關聯資源
        $includeParam = $request->input('include', '');
        if (!empty($includeParam)) {
            $installation->loadMissing(explode(',', $includeParam));
        } else {
            // 預設載入 items，因為詳情頁通常需要顯示項目
            $installation->loadMissing(['items']);
        }

        return new InstallationResource($installation);
    }

    /**
     * 更新安裝單
     * 
     * @urlParam installation integer required 安裝單ID。 Example: 1
     * @bodyParam installer_user_id integer 分配的安裝師傅ID。Example: 2
     * @bodyParam customer_name string 客戶姓名。Example: 王小明
     * @bodyParam customer_phone string nullable 客戶電話。Example: 0912345678
     * @bodyParam installation_address string 安裝地址。Example: 台北市信義區信義路五段7號
     * @bodyParam status string 狀態。可選值：pending, scheduled, in_progress, completed, cancelled。Example: scheduled
     * @bodyParam scheduled_date string 預計安裝日期（格式：Y-m-d）。Example: 2025-06-25
     * @bodyParam actual_start_time string 實際開始時間（格式：Y-m-d H:i:s）。Example: 2025-06-25 09:00:00
     * @bodyParam actual_end_time string 實際結束時間（格式：Y-m-d H:i:s）。Example: 2025-06-25 11:00:00
     * @bodyParam notes string 備註。Example: 已完成安裝
     * @bodyParam items array 安裝項目陣列（可選）。Example: [{"id": 1, "product_name": "層架組合", "sku": "SHELF-001", "quantity": 2, "specifications": "牆面安裝，高度 150cm", "status": "completed", "notes": "已安裝完成"}]
     * @bodyParam items.*.id integer 安裝項目ID（編輯現有項目時提供）。Example: 1
     * @bodyParam items.*.product_name string required 商品名稱。Example: 層架組合
     * @bodyParam items.*.sku string required 商品編號。Example: SHELF-001
     * @bodyParam items.*.quantity integer required 數量。Example: 2
     * @bodyParam items.*.specifications string 安裝規格說明（可選）。Example: 牆面安裝，高度 150cm
     * @bodyParam items.*.status string 項目狀態。可選值：pending, completed。Example: completed
     * @bodyParam items.*.notes string 項目備註（可選）。Example: 已安裝完成
     * 
     * @apiResource \App\Http\Resources\Api\InstallationResource
     * @apiResourceModel \App\Models\Installation
     */
    public function update(UpdateInstallationRequest $request, Installation $installation): InstallationResource
    {
        // 授權檢查已由 __construct 中的 authorizeResource 處理

        $installation = $this->installationService->updateInstallation(
            $installation,
            $request->validated()
        );

        // 確保載入項目資料以便前端顯示
        $installation->loadMissing(['items']);

        return new InstallationResource($installation);
    }

    /**
     * 刪除安裝單
     * 
     * @urlParam installation integer required 安裝單ID。 Example: 1
     * @authenticated
     * @response 204
     */
    public function destroy(Installation $installation)
    {
        // 授權檢查已由 __construct 中的 authorizeResource 處理

        $installation->delete();

        return response()->noContent();
    }

    /**
     * 分配安裝師傅
     * 
     * @urlParam installation integer required 安裝單ID。 Example: 1
     * @bodyParam installer_user_id integer required 安裝師傅用戶ID。Example: 2
     * 
     * @apiResource \App\Http\Resources\Api\InstallationResource
     * @apiResourceModel \App\Models\Installation
     */
    public function assignInstaller(Request $request, Installation $installation): InstallationResource
    {
        $this->authorize('assignInstaller', $installation);

        $request->validate([
            'installer_user_id' => ['required', 'integer', 'exists:users,id']
        ]);

        $installation = $this->installationService->assignInstaller(
            $installation,
            $request->installer_user_id
        );

        return new InstallationResource($installation->load('installer'));
    }

    /**
     * 更新安裝單狀態
     * 
     * @urlParam installation integer required 安裝單ID。 Example: 1
     * @bodyParam status string required 新狀態。可選值：pending, scheduled, in_progress, completed, cancelled。Example: in_progress
     * @bodyParam reason string 取消原因（當狀態為cancelled時）。Example: 客戶要求取消
     * 
     * @apiResource \App\Http\Resources\Api\InstallationResource
     * @apiResourceModel \App\Models\Installation
     */
    public function updateStatus(Request $request, Installation $installation): InstallationResource
    {
        $this->authorize('updateStatus', $installation);

        $request->validate([
            'status' => ['required', 'string', 'in:pending,scheduled,in_progress,completed,cancelled'],
            'reason' => ['required_if:status,cancelled', 'string']
        ]);

        if ($request->status === 'cancelled') {
            $installation = $this->installationService->cancelInstallation(
                $installation,
                $request->reason
            );
        } else {
            $installation = $this->installationService->updateStatus(
                $installation,
                $request->status
            );
        }

        return new InstallationResource($installation);
    }

    /**
     * 獲取安裝師傅的行程
     * 
     * @summary 獲取安裝行程
     * @queryParam installer_user_id integer required 安裝師傅的用戶ID。Example: 1
     * @queryParam start_date string required 起始日期（格式：Y-m-d）。Example: 2025-06-01
     * @queryParam end_date string required 結束日期（格式：Y-m-d）。Example: 2025-06-30
     * 
     * @apiResourceCollection \App\Http\Resources\Api\InstallationResource
     * @apiResourceModel \App\Models\Installation
     */
    public function getSchedule(GetInstallationScheduleRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Installation::class);

        // 如果是安裝師傅角色，只能查看自己的行程
        if ($this->isInstallerRestrictedToOwn($request->user())) {
            if ($request->installer_user_id != $request->user()->id) {
                abort(403, '您只能查看自己的安裝行程');
            }
        }

        $installations = $this->installationService->getInstallerSchedule(
            $request->installer_user_id,
            new \DateTime($request->start_date),
            new \DateTime($request->end_date)
        );

        return InstallationResource::collection($installations);
    }
    

} 