<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Models\User;
use PHPUnit\Framework\Attributes\Test;

class SimpleUserModelTest extends TestCase
{
    #[Test]
    public function user_has_correct_fillable_attributes()
    {
        $expected = [
            'name',
            'username',
            'email',
            'password',
        ];
        
        $user = new User();
        $this->assertEquals($expected, $user->getFillable());
    }

    #[Test]
    public function user_has_correct_casts()
    {
        $user = new User();
        $expectedCasts = [
            'password' => 'hashed',
        ];
        
        foreach ($expectedCasts as $key => $expectedType) {
            $this->assertArrayHasKey($key, $user->getCasts());
            $this->assertEquals($expectedType, $user->getCasts()[$key]);
        }
    }

    #[Test]
    public function user_has_correct_hidden_attributes()
    {
        $expected = [
            'password',
            'remember_token',
        ];
        
        $user = new User();
        $this->assertEquals($expected, $user->getHidden());
    }

    #[Test]
    public function user_uses_has_factory_trait()
    {
        $this->assertTrue(in_array('Illuminate\Database\Eloquent\Factories\HasFactory', class_uses(User::class)));
    }

    #[Test]
    public function user_uses_has_api_tokens_trait()
    {
        $this->assertTrue(in_array('Laravel\Sanctum\HasApiTokens', class_uses(User::class)));
    }

    #[Test]
    public function user_uses_has_roles_trait()
    {
        $this->assertTrue(in_array('Spatie\Permission\Traits\HasRoles', class_uses(User::class)));
    }
}