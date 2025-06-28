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
use Illuminate\Http\JsonResponse;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;

/**

 * 
 * 管理安裝單的相關 API
 */
class InstallationController extends Controller
{
    /**
     * @var InstallationService
     */
    private InstallationService $installationService;

    /**
     * 建構子
     */
    public function __construct(InstallationService $installationService)
    {
        $this->installationService = $installationService;
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








     * 

     *   "data": [{
     *     "id": 1,
     *     "installation_number": "I-202506-0001",
     *     "customer_name": "王小明",
     *     "status": "pending",
     *     "scheduled_date": "2025-06-25"
     *   }],
     *   "meta": {
     *     "current_page": 1,
     *     "total": 10
     *   }
     * }
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Installation::class);

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














     * 

     *   "data": {
     *     "id": 1,
     *     "installation_number": "I-202506-0001",
     *     "customer_name": "王小明",
     *     "status": "pending"
     *   }
     * }
     */
    public function store(StoreInstallationRequest $request)
    {
        $this->authorize('create', Installation::class);

        $installation = $this->installationService->createInstallation(
            $request->validated(),
            $request->user()->id
        );

        return new InstallationResource($installation->load(['items']));
    }

    /**
     * 從訂單建立安裝單
     * 









     * 

     *   "data": {
     *     "id": 1,
     *     "installation_number": "I-202506-0001",
     *     "order_id": 1,
     *     "customer_name": "王小明",
     *     "status": "pending"
     *   }
     * }
     */
    public function createFromOrder(CreateInstallationFromOrderRequest $request)
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


     * 

     *   "data": {
     *     "id": 1,
     *     "installation_number": "I-202506-0001",
     *     "customer_name": "王小明",
     *     "status": "pending",
     *     "items": [{
     *       "id": 1,
     *       "product_name": "辦公桌",
     *       "quantity": 2
     *     }]
     *   }
     * }
     */
    public function show(Request $request, Installation $installation)
    {
        $this->authorize('view', $installation);

        // 只有在 include 參數有值時才載入關聯資源
        $includeParam = $request->input('include', '');
        if (!empty($includeParam)) {
            $installation->loadMissing(explode(',', $includeParam));
        }

        return new InstallationResource($installation);
    }

    /**
     * 更新安裝單
     * 


















     * 

     *   "data": {
     *     "id": 1,
     *     "installation_number": "I-202506-0001",
     *     "status": "scheduled"
     *   }
     * }
     */
    public function update(UpdateInstallationRequest $request, Installation $installation)
    {
        $this->authorize('update', $installation);

        $installation = $this->installationService->updateInstallation(
            $installation,
            $request->validated()
        );

        return new InstallationResource($installation);
    }

    /**
     * 刪除安裝單
     * 


     */
    public function destroy(Installation $installation)
    {
        $this->authorize('delete', $installation);

        $installation->delete();

        return response()->noContent();
    }

    /**
     * 分配安裝師傅
     * 


     * 

     *   "data": {
     *     "id": 1,
     *     "installer_user_id": 2,
     *     "status": "scheduled"
     *   }
     * }
     */
    public function assignInstaller(Request $request, Installation $installation)
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



     * 

     *   "data": {
     *     "id": 1,
     *     "status": "in_progress",
     *     "actual_start_time": "2025-06-25 09:00:00"
     *   }
     * }
     */
    public function updateStatus(Request $request, Installation $installation)
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



     * 

     *   "data": [{
     *     "id": 1,
     *     "installation_number": "I-202506-0001",
     *     "scheduled_date": "2025-06-25",
     *     "customer_name": "王小明"
     *   }]
     * }
     */
    public function getSchedule(GetInstallationScheduleRequest $request)
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