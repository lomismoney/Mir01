<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Store;
use App\Models\User;
use App\Models\Inventory;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\InventoryTransfer;
use Illuminate\Foundation\Testing\RefreshDatabase;

class StoreModelTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function store_has_many_users()
    {
        $store = Store::factory()->create();
        $users = User::factory()->count(2)->create();
        
        $store->users()->attach($users->pluck('id'));

        $this->assertCount(2, $store->users);
        $this->assertInstanceOf(User::class, $store->users->first());
    }

    /** @test */
    public function store_has_many_inventories()
    {
        $store = Store::factory()->create();
        $inventories = Inventory::factory()->count(3)->create(['store_id' => $store->id]);

        $this->assertCount(3, $store->inventories);
        $this->assertInstanceOf(Inventory::class, $store->inventories->first());
    }

    /** @test */
    public function store_has_many_purchases()
    {
        $store = Store::factory()->create();
        $purchases = Purchase::factory()->count(2)->create(['store_id' => $store->id]);

        $this->assertCount(2, $store->purchases);
        $this->assertInstanceOf(Purchase::class, $store->purchases->first());
    }

    /** @test */
    public function store_has_many_sales()
    {
        $store = Store::factory()->create();
        $sales = Sale::factory()->count(2)->create(['store_id' => $store->id]);

        $this->assertCount(2, $store->sales);
        $this->assertInstanceOf(Sale::class, $store->sales->first());
    }

    /** @test */
    public function store_has_many_transfers_out()
    {
        $store = Store::factory()->create();
        $toStore = Store::factory()->create();
        $transfersOut = InventoryTransfer::factory()->count(2)->create([
            'from_store_id' => $store->id,
            'to_store_id' => $toStore->id
        ]);

        $this->assertCount(2, $store->transfersOut);
        $this->assertInstanceOf(InventoryTransfer::class, $store->transfersOut->first());
    }

    /** @test */
    public function store_has_many_transfers_in()
    {
        $store = Store::factory()->create();
        $fromStore = Store::factory()->create();
        $transfersIn = InventoryTransfer::factory()->count(2)->create([
            'from_store_id' => $fromStore->id,
            'to_store_id' => $store->id
        ]);

        $this->assertCount(2, $store->transfersIn);
        $this->assertInstanceOf(InventoryTransfer::class, $store->transfersIn->first());
    }

    /** @test */
    public function store_has_guarded_property_set()
    {
        $store = new Store();
        $this->assertEquals([], $store->getGuarded());
    }

    /** @test */
    public function store_can_be_created_with_mass_assignment()
    {
        $data = [
            'name' => 'Test Store',
            'address' => '台北市信義區信義路五段7號',
        ];

        $store = Store::create($data);

        $this->assertDatabaseHas('stores', [
            'name' => 'Test Store',
            'address' => '台北市信義區信義路五段7號',
        ]);
    }

    /** @test */
    public function store_users_relation_uses_pivot_table()
    {
        $store = Store::factory()->create();
        $user = User::factory()->create();

        $store->users()->attach($user->id);

        $this->assertDatabaseHas('store_user', [
            'store_id' => $store->id,
            'user_id' => $user->id,
        ]);
    }

    /** @test */
    public function store_can_attach_and_detach_users()
    {
        $store = Store::factory()->create();
        $user = User::factory()->create();
        
        $store->users()->attach($user->id);
        $this->assertCount(1, $store->users);
        
        $store->users()->detach($user->id);
        $this->assertCount(0, $store->fresh()->users);
    }

    /** @test */
    public function store_uses_has_factory_trait()
    {
        $this->assertTrue(in_array('Illuminate\Database\Eloquent\Factories\HasFactory', class_uses(Store::class)));
    }

    /** @test */
    public function store_transfers_out_and_in_are_different_relations()
    {
        $storeA = Store::factory()->create();
        $storeB = Store::factory()->create();
        
        $transferAtoB = InventoryTransfer::factory()->create([
            'from_store_id' => $storeA->id,
            'to_store_id' => $storeB->id
        ]);

        // 檢查 storeA 的轉出記錄
        $this->assertCount(1, $storeA->transfersOut);
        $this->assertCount(0, $storeA->transfersIn);
        
        // 檢查 storeB 的轉入記錄
        $this->assertCount(0, $storeB->transfersOut);
        $this->assertCount(1, $storeB->transfersIn);
    }

    /** @test */
    public function store_timestamps_are_tracked_in_user_pivot_table()
    {
        $store = Store::factory()->create();
        $user = User::factory()->create();

        $store->users()->attach($user->id);

        $this->assertDatabaseHas('store_user', [
            'store_id' => $store->id,
            'user_id' => $user->id,
        ]);

        // 檢查樞紐表是否有時間戳記欄位
        $pivot = $store->users()->first()->pivot;
        $this->assertNotNull($pivot->created_at);
        $this->assertNotNull($pivot->updated_at);
    }
} 