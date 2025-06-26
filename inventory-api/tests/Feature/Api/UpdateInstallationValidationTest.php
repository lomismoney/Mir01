<?php

namespace Tests\Feature\Api;

use App\Models\Installation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UpdateInstallationValidationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 測試當資料庫中已有 actual_start_time，
     * 只更新 actual_end_time 時的驗證邏輯
     */
    public function test_actual_end_time_validation_with_existing_start_time()
    {
        // 建立測試用戶
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        Sanctum::actingAs($user);

        // 建立一個已經有 actual_start_time 的安裝單
        $installation = Installation::factory()->create([
            'actual_start_time' => '2025-01-10 09:00:00',
            'actual_end_time' => null,
            'status' => 'in_progress'
        ]);

        // 測試 1：結束時間晚於開始時間（應該成功）
        $response = $this->putJson("/api/installations/{$installation->id}", [
            'actual_end_time' => '2025-01-10 11:00:00'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('installations', [
            'id' => $installation->id,
            'actual_end_time' => '2025-01-10 11:00:00'
        ]);

        // 測試 2：結束時間早於開始時間（應該失敗）
        $response = $this->putJson("/api/installations/{$installation->id}", [
            'actual_end_time' => '2025-01-10 08:00:00'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['actual_end_time']);
        $response->assertJson([
            'errors' => [
                'actual_end_time' => [
                    '結束時間必須晚於開始時間（2025-01-10 09:00:00）'
                ]
            ]
        ]);
    }

    /**
     * 測試同時更新 actual_start_time 和 actual_end_time
     */
    public function test_update_both_start_and_end_time()
    {
        // 建立測試用戶
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        Sanctum::actingAs($user);

        // 建立一個安裝單
        $installation = Installation::factory()->create([
            'actual_start_time' => '2025-01-10 09:00:00',
            'actual_end_time' => '2025-01-10 11:00:00',
            'status' => 'completed'
        ]);

        // 測試：使用請求中的 actual_start_time 來驗證 actual_end_time
        $response = $this->putJson("/api/installations/{$installation->id}", [
            'actual_start_time' => '2025-01-10 14:00:00',
            'actual_end_time' => '2025-01-10 16:00:00'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('installations', [
            'id' => $installation->id,
            'actual_start_time' => '2025-01-10 14:00:00',
            'actual_end_time' => '2025-01-10 16:00:00'
        ]);

        // 測試：請求中的結束時間早於請求中的開始時間（應該失敗）
        $response = $this->putJson("/api/installations/{$installation->id}", [
            'actual_start_time' => '2025-01-10 14:00:00',
            'actual_end_time' => '2025-01-10 13:00:00'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['actual_end_time']);
    }

    /**
     * 測試當沒有 actual_start_time 時更新 actual_end_time
     */
    public function test_update_end_time_without_start_time()
    {
        // 建立測試用戶
        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        Sanctum::actingAs($user);

        // 建立一個沒有 actual_start_time 的安裝單
        $installation = Installation::factory()->create([
            'actual_start_time' => null,
            'actual_end_time' => null,
            'status' => 'pending'
        ]);

        // 測試：在沒有開始時間的情況下設定結束時間（應該成功，因為沒有比較基準）
        $response = $this->putJson("/api/installations/{$installation->id}", [
            'actual_end_time' => '2025-01-10 11:00:00'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('installations', [
            'id' => $installation->id,
            'actual_end_time' => '2025-01-10 11:00:00'
        ]);
    }
} 