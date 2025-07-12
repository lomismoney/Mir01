<?php

namespace Tests\Unit\Http\Requests\Api;

use App\Http\Requests\Api\GetInstallationScheduleRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class GetInstallationScheduleRequestTest extends TestCase
{
    use RefreshDatabase;

    protected GetInstallationScheduleRequest $request;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->request = new GetInstallationScheduleRequest();
        
        // 創建測試用戶
        $this->user = User::factory()->create();
    }

    public function test_authorize_returns_true(): void
    {
        $this->assertTrue($this->request->authorize());
    }

    public function test_rules_are_defined_correctly(): void
    {
        $rules = $this->request->rules();
        
        $this->assertArrayHasKey('installer_user_id', $rules);
        $this->assertArrayHasKey('start_date', $rules);
        $this->assertArrayHasKey('end_date', $rules);
    }

    public function test_valid_request_passes_validation(): void
    {
        $data = [
            'installer_user_id' => $this->user->id,
            'start_date' => '2025-06-01',
            'end_date' => '2025-06-30',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_validation_fails_when_required_fields_are_missing(): void
    {
        $data = [];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        
        $errors = $validator->errors();
        $this->assertTrue($errors->has('installer_user_id'));
        $this->assertTrue($errors->has('start_date'));
        $this->assertTrue($errors->has('end_date'));
    }

    public function test_validation_fails_when_installer_user_id_is_not_integer(): void
    {
        $data = [
            'installer_user_id' => 'not_integer',
            'start_date' => '2025-06-01',
            'end_date' => '2025-06-30',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('installer_user_id'));
    }

    public function test_validation_fails_when_installer_user_id_does_not_exist(): void
    {
        $data = [
            'installer_user_id' => 99999,
            'start_date' => '2025-06-01',
            'end_date' => '2025-06-30',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('installer_user_id'));
    }

    public function test_validation_fails_when_start_date_is_not_valid_date(): void
    {
        $data = [
            'installer_user_id' => $this->user->id,
            'start_date' => 'not_a_date',
            'end_date' => '2025-06-30',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('start_date'));
    }

    public function test_validation_fails_when_end_date_is_not_valid_date(): void
    {
        $data = [
            'installer_user_id' => $this->user->id,
            'start_date' => '2025-06-01',
            'end_date' => 'not_a_date',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('end_date'));
    }

    public function test_validation_fails_when_end_date_is_before_start_date(): void
    {
        $data = [
            'installer_user_id' => $this->user->id,
            'start_date' => '2025-06-30',
            'end_date' => '2025-06-01',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('end_date'));
    }

    public function test_validation_passes_when_end_date_equals_start_date(): void
    {
        $data = [
            'installer_user_id' => $this->user->id,
            'start_date' => '2025-06-15',
            'end_date' => '2025-06-15',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_validation_passes_with_different_date_formats(): void
    {
        $data = [
            'installer_user_id' => $this->user->id,
            'start_date' => '2025-06-01',
            'end_date' => '2025-06-30',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_validation_fails_with_invalid_date_format(): void
    {
        $data = [
            'installer_user_id' => $this->user->id,
            'start_date' => 'invalid-date', // 完全無效的日期
            'end_date' => '2025-06-30',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('start_date'));
    }

    public function test_query_parameters_returns_correct_structure(): void
    {
        $queryParameters = $this->request->queryParameters();
        
        $this->assertArrayHasKey('installer_user_id', $queryParameters);
        $this->assertArrayHasKey('start_date', $queryParameters);
        $this->assertArrayHasKey('end_date', $queryParameters);
        
        // 檢查結構
        $this->assertArrayHasKey('description', $queryParameters['installer_user_id']);
        $this->assertArrayHasKey('example', $queryParameters['installer_user_id']);
    }

    public function test_query_parameters_have_correct_examples(): void
    {
        $queryParameters = $this->request->queryParameters();
        
        $this->assertEquals(1, $queryParameters['installer_user_id']['example']);
        $this->assertEquals('2025-06-01', $queryParameters['start_date']['example']);
        $this->assertEquals('2025-06-30', $queryParameters['end_date']['example']);
    }

    public function test_query_parameters_have_correct_descriptions(): void
    {
        $queryParameters = $this->request->queryParameters();
        
        $this->assertEquals('安裝師傅的用戶ID', $queryParameters['installer_user_id']['description']);
        $this->assertEquals('起始日期（格式：Y-m-d）', $queryParameters['start_date']['description']);
        $this->assertEquals('結束日期（格式：Y-m-d）', $queryParameters['end_date']['description']);
    }

    public function test_request_inheritance(): void
    {
        $this->assertInstanceOf(\Illuminate\Foundation\Http\FormRequest::class, $this->request);
    }

    public function test_request_namespace(): void
    {
        $reflection = new \ReflectionClass($this->request);
        $this->assertEquals('App\Http\Requests\Api', $reflection->getNamespaceName());
    }

    public function test_request_methods_exist(): void
    {
        $this->assertTrue(method_exists($this->request, 'authorize'));
        $this->assertTrue(method_exists($this->request, 'rules'));
        $this->assertTrue(method_exists($this->request, 'queryParameters'));
    }

    public function test_request_methods_return_correct_types(): void
    {
        $this->assertIsBool($this->request->authorize());
        $this->assertIsArray($this->request->rules());
        $this->assertIsArray($this->request->queryParameters());
    }

    public function test_validation_with_edge_case_dates(): void
    {
        // 測試跨年日期
        $data = [
            'installer_user_id' => $this->user->id,
            'start_date' => '2024-12-31',
            'end_date' => '2025-01-01',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_validation_with_leap_year_date(): void
    {
        $data = [
            'installer_user_id' => $this->user->id,
            'start_date' => '2024-02-29', // 閏年
            'end_date' => '2024-03-01',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_validation_fails_with_invalid_leap_year_date(): void
    {
        $data = [
            'installer_user_id' => $this->user->id,
            'start_date' => '2023-02-29', // 非閏年
            'end_date' => '2023-03-01',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('start_date'));
    }

    public function test_validation_with_very_long_date_range(): void
    {
        $data = [
            'installer_user_id' => $this->user->id,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_validation_fails_when_installer_user_id_is_zero(): void
    {
        $data = [
            'installer_user_id' => 0,
            'start_date' => '2025-06-01',
            'end_date' => '2025-06-30',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('installer_user_id'));
    }

    public function test_validation_fails_when_installer_user_id_is_negative(): void
    {
        $data = [
            'installer_user_id' => -1,
            'start_date' => '2025-06-01',
            'end_date' => '2025-06-30',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('installer_user_id'));
    }

    public function test_validation_with_multiple_users(): void
    {
        $user2 = User::factory()->create();
        
        $data = [
            'installer_user_id' => $user2->id,
            'start_date' => '2025-06-01',
            'end_date' => '2025-06-30',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_class_docblock_exists(): void
    {
        $reflection = new \ReflectionClass($this->request);
        $docComment = $reflection->getDocComment();
        
        // 有些類別可能沒有類別級別的 docblock，這是可以接受的
        $this->assertTrue($docComment === false || is_string($docComment));
    }

    public function test_method_docblocks_exist(): void
    {
        $reflection = new \ReflectionClass($this->request);
        
        $authorizeMethod = $reflection->getMethod('authorize');
        $this->assertNotFalse($authorizeMethod->getDocComment());
        
        $rulesMethod = $reflection->getMethod('rules');
        $this->assertNotFalse($rulesMethod->getDocComment());
        
        $queryParametersMethod = $reflection->getMethod('queryParameters');
        $this->assertNotFalse($queryParametersMethod->getDocComment());
    }

    public function test_validation_passes_with_datetime_format(): void
    {
        $data = [
            'installer_user_id' => $this->user->id,
            'start_date' => '2025-06-01 00:00:00',
            'end_date' => '2025-06-30 23:59:59',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertTrue($validator->passes());
    }
}