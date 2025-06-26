<?php

namespace Tests\Feature\Api;

use App\Models\Installation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * 測試安裝管理 API 的角色權限一致性
 * 
 * 確保不同端點的權限檢查邏輯保持一致
 */
class InstallationControllerRoleConsistencyTest extends TestCase
{
    use RefreshDatabase;

    private User $installer;
    private User $admin;
    private User $staff;
    private User $viewer;
    private Installation $ownInstallation;
    private Installation $otherInstallation;

    protected function setUp(): void
    {
        parent::setUp();

        // 運行角色遷移來創建角色
        $this->artisan('roles:migrate');

        // 創建測試用戶並分配角色
        $this->installer = User::factory()->installer()->create();
        $this->admin = User::factory()->admin()->create();
        $this->staff = User::factory()->staff()->create();
        $this->viewer = User::factory()->viewer()->create();

        // 創建測試安裝單
        $this->ownInstallation = Installation::factory()->create([
            'installer_user_id' => $this->installer->id
        ]);
        $this->otherInstallation = Installation::factory()->create([
            'installer_user_id' => User::factory()->installer()->create()->id
        ]);
    }

    /**
     * 測試純 installer 角色只能看到自己的安裝單（index 方法）
     */
    public function test_pure_installer_can_only_see_own_installations_in_index()
    {
        $this->actingAs($this->installer);

        $response = $this->getJson('/api/installations');
        $response->assertOk();

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($this->ownInstallation->id, $data[0]['id']);
    }

    /**
     * 測試純 installer 角色只能查看自己的行程（getSchedule 方法）
     */
    public function test_pure_installer_can_only_see_own_schedule()
    {
        $this->actingAs($this->installer);

        // 嘗試查看自己的行程 - 應該成功
        $response = $this->getJson('/api/installations/schedule?' . http_build_query([
            'installer_user_id' => $this->installer->id,
            'start_date' => now()->format('Y-m-d'),
            'end_date' => now()->addMonth()->format('Y-m-d')
        ]));
        $response->assertOk();

        // 嘗試查看他人的行程 - 應該被拒絕
        $response = $this->getJson('/api/installations/schedule?' . http_build_query([
            'installer_user_id' => $this->otherInstallation->installer_user_id,
            'start_date' => now()->format('Y-m-d'),
            'end_date' => now()->addMonth()->format('Y-m-d')
        ]));
        $response->assertForbidden();
    }

    /**
     * 測試 viewer 角色可以看到所有安裝單
     */
    public function test_viewer_can_see_all_installations()
    {
        $this->actingAs($this->viewer);

        $response = $this->getJson('/api/installations');
        $response->assertOk();

        $data = $response->json('data');
        // 應該能看到所有安裝單
        $this->assertGreaterThanOrEqual(2, count($data));
    }

    /**
     * 測試 admin 角色可以看到所有安裝單
     */
    public function test_admin_can_see_all_installations()
    {
        $this->actingAs($this->admin);

        $response = $this->getJson('/api/installations');
        $response->assertOk();

        $data = $response->json('data');
        // 應該能看到所有安裝單
        $this->assertGreaterThanOrEqual(2, count($data));
    }

    /**
     * 測試 staff 角色可以看到所有安裝單
     */
    public function test_staff_can_see_all_installations()
    {
        $this->actingAs($this->staff);

        $response = $this->getJson('/api/installations');
        $response->assertOk();

        $data = $response->json('data');
        // 應該能看到所有安裝單
        $this->assertGreaterThanOrEqual(2, count($data));
    }

    /**
     * 測試權限邏輯的一致性：相同的角色在不同端點應有相同的訪問權限
     */
    public function test_permission_consistency_across_endpoints()
    {
        $testCases = [
            [
                'user' => $this->installer,
                'canSeeAllInIndex' => false,
                'canSeeOthersSchedule' => false,
                'description' => 'installer 角色'
            ],
            [
                'user' => $this->admin,
                'canSeeAllInIndex' => true,
                'canSeeOthersSchedule' => true,
                'description' => 'admin 角色'
            ],
            [
                'user' => $this->staff,
                'canSeeAllInIndex' => true,
                'canSeeOthersSchedule' => true,
                'description' => 'staff 角色'
            ],
            [
                'user' => $this->viewer,
                'canSeeAllInIndex' => true,
                'canSeeOthersSchedule' => true,
                'description' => 'viewer 角色'
            ],
        ];

        foreach ($testCases as $testCase) {
            $this->actingAs($testCase['user']);

            // 測試 index 端點
            $response = $this->getJson('/api/installations');
            $response->assertOk();
            
            $data = $response->json('data');
            if ($testCase['canSeeAllInIndex']) {
                $this->assertGreaterThanOrEqual(2, count($data), 
                    "{$testCase['description']} 應該能在 index 看到所有安裝單");
            } else {
                $this->assertLessThanOrEqual(1, count($data), 
                    "{$testCase['description']} 應該只能在 index 看到自己的安裝單");
            }

            // 測試 getSchedule 端點（嘗試查看他人的行程）
            $response = $this->getJson('/api/installations/schedule?' . http_build_query([
                'installer_user_id' => $this->otherInstallation->installer_user_id,
                'start_date' => now()->format('Y-m-d'),
                'end_date' => now()->addMonth()->format('Y-m-d')
            ]));

            if ($testCase['canSeeOthersSchedule']) {
                $response->assertOk("{$testCase['description']} 應該能查看他人的行程");
            } else {
                $response->assertForbidden("{$testCase['description']} 不應該能查看他人的行程");
            }
        }
    }
} 