<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $viewer;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->admin = User::factory()->create();
        $this->admin->assignRole(User::ROLE_ADMIN);
        
        $this->viewer = User::factory()->create();
        $this->viewer->assignRole(User::ROLE_VIEWER);
    }

    // =================================================================
    // Authorization Tests
    // =================================================================

    /** @test */
    public function unauthenticated_user_cannot_access_any_user_endpoints(): void
    {
        $this->getJson('/api/users')->assertUnauthorized();
        $this->postJson('/api/users')->assertUnauthorized();
        $this->getJson('/api/users/1')->assertUnauthorized();
        $this->putJson('/api/users/1')->assertUnauthorized();
        $this->deleteJson('/api/users/1')->assertUnauthorized();
    }

    /** @test */
    public function viewer_user_is_forbidden_from_accessing_user_endpoints(): void
    {
        $anotherUser = User::factory()->create();

        $this->actingAs($this->viewer);

        $this->getJson('/api/users')->assertForbidden();
        $this->postJson('/api/users', [])->assertForbidden();
        $this->getJson("/api/users/{$anotherUser->id}")->assertForbidden();
        $this->putJson("/api/users/{$anotherUser->id}", [])->assertForbidden();
        $this->deleteJson("/api/users/{$anotherUser->id}")->assertForbidden();
    }

    // =================================================================
    // CRUD Tests for Admin
    // =================================================================

    /** @test */
    public function admin_can_get_users_list_with_pagination_and_filtering(): void
    {
        User::factory()->count(20)->create();
        User::factory()->create(['name' => 'SearchMe', 'username' => 'find_me']);

        $this->actingAs($this->admin);
        
        // Test basic index
        $this->getJson('/api/users')
            ->assertOk()
            ->assertJsonStructure(['data', 'links', 'meta'])
            ->assertJsonCount(15, 'data'); // Default pagination

        // Test name filter
        $this->getJson('/api/users?filter[name]=SearchMe')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'SearchMe');

        // Test username filter
        $this->getJson('/api/users?filter[username]=find_me')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.username', 'find_me');
        
        // Test global search filter
        $this->getJson('/api/users?filter[search]=SearchMe')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    /** @test */
    public function admin_can_create_user(): void
    {
        $userData = [
            'name' => 'New User',
            'username' => 'newuser',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => [User::ROLE_VIEWER],
        ];

        $this->actingAs($this->admin);
        
        $response = $this->postJson('/api/users', $userData);
        
        $response->assertStatus(201)
                 ->assertJsonFragment(['name' => 'New User']);

        $this->assertDatabaseHas('users', ['username' => 'newuser']);
        
        $createdUser = User::where('username', 'newuser')->first();
        $this->assertTrue(Hash::check('password123', $createdUser->password));
        $this->assertTrue($createdUser->hasRole(User::ROLE_VIEWER));
    }

    /** @test */
    public function user_creation_requires_valid_data(): void
    {
        $this->actingAs($this->admin);

        // Missing required fields
        $this->postJson('/api/users', [])
             ->assertStatus(422)
             ->assertJsonValidationErrors(['name', 'username', 'password']);
        
        // Password confirmation mismatch
        $this->postJson('/api/users', [
            'name' => 'Test User',
            'username' => 'testuser',
            'password' => 'password123',
            'password_confirmation' => 'wrongpassword',
            'roles' => [User::ROLE_VIEWER],
        ])->assertStatus(422)->assertJsonValidationErrors(['password']);

        // Username already taken
        $this->postJson('/api/users', [
            'name' => 'Another User',
            'username' => $this->viewer->username,
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => [User::ROLE_VIEWER],
        ])->assertStatus(422)->assertJsonValidationErrors(['username']);
    }

    /** @test */
    public function admin_can_show_user(): void
    {
        $this->actingAs($this->admin);
        
        $this->getJson("/api/users/{$this->viewer->id}")
             ->assertOk()
             ->assertJsonFragment(['id' => $this->viewer->id]);
    }
    
    /** @test */
    public function show_returns_404_for_non_existent_user(): void
    {
        $this->actingAs($this->admin);
        $this->getJson('/api/users/9999')->assertNotFound();
    }

    /** @test */
    public function admin_can_update_user(): void
    {
        $userToUpdate = User::factory()->create();

        $updateData = [
            'name' => 'Updated Name',
            'roles' => ['admin'],
        ];

        $this->actingAs($this->admin);

        $this->putJson("/api/users/{$userToUpdate->id}", $updateData)
             ->assertOk()
             ->assertJsonFragment(['name' => 'Updated Name'])
             ->assertJsonPath('data.roles', ['admin']);
        
        $this->assertDatabaseHas('users', ['id' => $userToUpdate->id, 'name' => 'Updated Name']);
        $userToUpdate->refresh();
        $this->assertTrue($userToUpdate->hasRole('admin'));
    }
    
    /** @test */
    public function admin_can_update_user_password(): void
    {
        $userToUpdate = User::factory()->create();
        $oldPassword = $userToUpdate->password;

        $updateData = [
            'password' => 'new-secret-password',
            'password_confirmation' => 'new-secret-password',
        ];

        $this->actingAs($this->admin);

        $this->putJson("/api/users/{$userToUpdate->id}", $updateData)->assertOk();
        
        $userToUpdate->refresh();
        $this->assertFalse(Hash::check($oldPassword, $userToUpdate->password));
        $this->assertTrue(Hash::check('new-secret-password', $userToUpdate->password));
    }

    /** @test */
    public function user_update_validates_data(): void
    {
        $userToUpdate = User::factory()->create();
        $anotherUser = User::factory()->create();
        
        $this->actingAs($this->admin);

        // Username must be unique
        $this->putJson("/api/users/{$userToUpdate->id}", ['username' => $anotherUser->username])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['username']);
            
        // Can use own username
        $this->putJson("/api/users/{$userToUpdate->id}", ['username' => $userToUpdate->username])
            ->assertOk();
    }

    /** @test */
    public function admin_can_delete_user(): void
    {
        $userToDelete = User::factory()->create();
        
        $this->actingAs($this->admin);
        
        $this->deleteJson("/api/users/{$userToDelete->id}")->assertNoContent();
        
        $this->assertDatabaseMissing('users', ['id' => $userToDelete->id]);
    }

    /** @test */
    public function admin_cannot_delete_own_account(): void
    {
        $this->actingAs($this->admin);
        
        $this->deleteJson("/api/users/{$this->admin->id}")
             ->assertForbidden();
             
        $this->assertDatabaseHas('users', ['id' => $this->admin->id]);
    }

    /** @test */
    public function delete_returns_404_for_non_existent_user(): void
    {
        $this->actingAs($this->admin);
        $this->deleteJson('/api/users/9999')->assertNotFound();
    }
} 