<?php

namespace Tests\Unit\Data\Transformers;

use Tests\TestCase;
use App\Data\Transformers\MoneyTransformer;
use Spatie\LaravelData\Support\DataProperty;
use Spatie\LaravelData\Support\Transformation\TransformationContext;
use Mockery;
use PHPUnit\Framework\Attributes\Test;

class MoneyTransformerTest extends TestCase
{
    private MoneyTransformer $transformer;
    private $mockProperty;
    private $mockContext;

    protected function setUp(): void
    {
        parent::setUp();
        $this->transformer = new MoneyTransformer();
        $this->mockProperty = Mockery::mock(DataProperty::class);
        $this->mockContext = Mockery::mock(TransformationContext::class);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    #[Test]
    public function it_transforms_cents_to_dollars()
    {
        $result = $this->transformer->transform($this->mockProperty, 10000, $this->mockContext);
        
        $this->assertEquals(100, $result);
    }

    #[Test]
    public function it_rounds_down_when_less_than_half()
    {
        $result = $this->transformer->transform($this->mockProperty, 10049, $this->mockContext);
        
        $this->assertEquals(100, $result);
    }

    #[Test]
    public function it_rounds_up_when_half_or_more()
    {
        $result = $this->transformer->transform($this->mockProperty, 10050, $this->mockContext);
        
        $this->assertEquals(101, $result);
    }

    #[Test]
    public function it_handles_zero_value()
    {
        $result = $this->transformer->transform($this->mockProperty, 0, $this->mockContext);
        
        $this->assertEquals(0, $result);
    }

    #[Test]
    public function it_handles_negative_values()
    {
        $result = $this->transformer->transform($this->mockProperty, -10000, $this->mockContext);
        
        $this->assertEquals(-100, $result);
    }

    #[Test]
    public function it_handles_small_values()
    {
        $result = $this->transformer->transform($this->mockProperty, 49, $this->mockContext);
        
        $this->assertEquals(0, $result);
        
        $result = $this->transformer->transform($this->mockProperty, 50, $this->mockContext);
        
        $this->assertEquals(1, $result);
    }

    #[Test]
    public function it_handles_large_values()
    {
        $result = $this->transformer->transform($this->mockProperty, 999999999, $this->mockContext);
        
        $this->assertEquals(10000000, $result);
    }

    #[Test]
    public function it_always_returns_integer()
    {
        $testCases = [10000, 15050, 99, 0, -5000];
        
        foreach ($testCases as $value) {
            $result = $this->transformer->transform($this->mockProperty, $value, $this->mockContext);
            $this->assertIsInt($result);
        }
    }

    #[Test]
    public function it_implements_transformer_interface()
    {
        $this->assertInstanceOf('Spatie\LaravelData\Transformers\Transformer', $this->transformer);
    }
} 