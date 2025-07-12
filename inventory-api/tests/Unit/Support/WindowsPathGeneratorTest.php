<?php

namespace Tests\Unit\Support;

use App\Support\WindowsPathGenerator;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;

class WindowsPathGeneratorTest extends TestCase
{
    use RefreshDatabase;

    protected WindowsPathGenerator $pathGenerator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->pathGenerator = new WindowsPathGenerator();
    }

    public function test_path_generator_can_be_instantiated(): void
    {
        $this->assertInstanceOf(WindowsPathGenerator::class, $this->pathGenerator);
    }

    public function test_path_generator_implements_path_generator_interface(): void
    {
        $this->assertInstanceOf(\Spatie\MediaLibrary\Support\PathGenerator\PathGenerator::class, $this->pathGenerator);
    }

    public function test_get_path_method_exists(): void
    {
        $this->assertTrue(method_exists($this->pathGenerator, 'getPath'));
    }

    public function test_get_path_for_conversions_method_exists(): void
    {
        $this->assertTrue(method_exists($this->pathGenerator, 'getPathForConversions'));
    }

    public function test_get_path_for_responsive_images_method_exists(): void
    {
        $this->assertTrue(method_exists($this->pathGenerator, 'getPathForResponsiveImages'));
    }

    public function test_get_path_returns_correct_format(): void
    {
        $media = Mockery::mock(Media::class);
        $media->shouldReceive('getAttribute')->with('id')->andReturn(123);
        
        $path = $this->pathGenerator->getPath($media);
        
        $this->assertEquals('123/', $path);
    }

    public function test_get_path_for_conversions_returns_correct_format(): void
    {
        $media = Mockery::mock(Media::class);
        $media->shouldReceive('getAttribute')->with('id')->andReturn(456);
        
        $path = $this->pathGenerator->getPathForConversions($media);
        
        $this->assertEquals('456/conversions/', $path);
    }

    public function test_get_path_for_responsive_images_returns_correct_format(): void
    {
        $media = Mockery::mock(Media::class);
        $media->shouldReceive('getAttribute')->with('id')->andReturn(789);
        
        $path = $this->pathGenerator->getPathForResponsiveImages($media);
        
        $this->assertEquals('789/responsive-images/', $path);
    }

    public function test_normalize_path_method_exists(): void
    {
        $reflection = new \ReflectionClass($this->pathGenerator);
        $method = $reflection->getMethod('normalizePath');
        
        $this->assertInstanceOf(\ReflectionMethod::class, $method);
    }

    public function test_normalize_path_replaces_backslashes(): void
    {
        $reflection = new \ReflectionClass($this->pathGenerator);
        $method = $reflection->getMethod('normalizePath');
        $method->setAccessible(true);
        
        $path = 'test\\path\\with\\backslashes';
        $result = $method->invoke($this->pathGenerator, $path);
        
        $this->assertEquals('test/path/with/backslashes/', $result);
    }

    public function test_normalize_path_replaces_directory_separators(): void
    {
        $reflection = new \ReflectionClass($this->pathGenerator);
        $method = $reflection->getMethod('normalizePath');
        $method->setAccessible(true);
        
        $path = 'test' . DIRECTORY_SEPARATOR . 'path' . DIRECTORY_SEPARATOR . 'with' . DIRECTORY_SEPARATOR . 'separators';
        $result = $method->invoke($this->pathGenerator, $path);
        
        $this->assertEquals('test/path/with/separators/', $result);
    }

    public function test_normalize_path_removes_duplicate_separators(): void
    {
        $reflection = new \ReflectionClass($this->pathGenerator);
        $method = $reflection->getMethod('normalizePath');
        $method->setAccessible(true);
        
        $path = 'test//path///with////duplicates';
        $result = $method->invoke($this->pathGenerator, $path);
        
        $this->assertEquals('test/path/with/duplicates/', $result);
    }

    public function test_normalize_path_ensures_trailing_slash(): void
    {
        $reflection = new \ReflectionClass($this->pathGenerator);
        $method = $reflection->getMethod('normalizePath');
        $method->setAccessible(true);
        
        $path = 'test/path/without/trailing/slash';
        $result = $method->invoke($this->pathGenerator, $path);
        
        $this->assertEquals('test/path/without/trailing/slash/', $result);
    }

    public function test_normalize_path_preserves_trailing_slash(): void
    {
        $reflection = new \ReflectionClass($this->pathGenerator);
        $method = $reflection->getMethod('normalizePath');
        $method->setAccessible(true);
        
        $path = 'test/path/with/trailing/slash/';
        $result = $method->invoke($this->pathGenerator, $path);
        
        $this->assertEquals('test/path/with/trailing/slash/', $result);
    }

    public function test_normalize_path_handles_empty_string(): void
    {
        $reflection = new \ReflectionClass($this->pathGenerator);
        $method = $reflection->getMethod('normalizePath');
        $method->setAccessible(true);
        
        $path = '';
        $result = $method->invoke($this->pathGenerator, $path);
        
        $this->assertEquals('/', $result);
    }

    public function test_normalize_path_handles_single_slash(): void
    {
        $reflection = new \ReflectionClass($this->pathGenerator);
        $method = $reflection->getMethod('normalizePath');
        $method->setAccessible(true);
        
        $path = '/';
        $result = $method->invoke($this->pathGenerator, $path);
        
        $this->assertEquals('/', $result);
    }

    public function test_normalize_path_handles_mixed_separators(): void
    {
        $reflection = new \ReflectionClass($this->pathGenerator);
        $method = $reflection->getMethod('normalizePath');
        $method->setAccessible(true);
        
        $path = 'test\\mixed/separators\\and/slashes';
        $result = $method->invoke($this->pathGenerator, $path);
        
        $this->assertEquals('test/mixed/separators/and/slashes/', $result);
    }

    public function test_get_path_with_different_media_ids(): void
    {
        $testCases = [1, 42, 999, 12345];
        
        foreach ($testCases as $mediaId) {
            $media = Mockery::mock(Media::class);
            $media->shouldReceive('getAttribute')->with('id')->andReturn($mediaId);
            
            $path = $this->pathGenerator->getPath($media);
            
            $this->assertEquals($mediaId . '/', $path);
        }
    }

    public function test_get_path_for_conversions_with_different_media_ids(): void
    {
        $testCases = [1, 42, 999, 12345];
        
        foreach ($testCases as $mediaId) {
            $media = Mockery::mock(Media::class);
            $media->shouldReceive('getAttribute')->with('id')->andReturn($mediaId);
            
            $path = $this->pathGenerator->getPathForConversions($media);
            
            $this->assertEquals($mediaId . '/conversions/', $path);
        }
    }

    public function test_get_path_for_responsive_images_with_different_media_ids(): void
    {
        $testCases = [1, 42, 999, 12345];
        
        foreach ($testCases as $mediaId) {
            $media = Mockery::mock(Media::class);
            $media->shouldReceive('getAttribute')->with('id')->andReturn($mediaId);
            
            $path = $this->pathGenerator->getPathForResponsiveImages($media);
            
            $this->assertEquals($mediaId . '/responsive-images/', $path);
        }
    }

    public function test_class_has_correct_namespace(): void
    {
        $reflection = new \ReflectionClass($this->pathGenerator);
        $this->assertEquals('App\Support', $reflection->getNamespaceName());
    }

    public function test_class_has_correct_docblock(): void
    {
        $reflection = new \ReflectionClass($this->pathGenerator);
        $docComment = $reflection->getDocComment();
        
        $this->assertStringContainsString('Windows 兼容的路徑生成器', $docComment);
        $this->assertStringContainsString('解決 Windows 環境下路徑分隔符混用的問題', $docComment);
    }

    public function test_methods_have_correct_docblocks(): void
    {
        $reflection = new \ReflectionClass($this->pathGenerator);
        
        // 測試 getPath 方法的 docblock
        $getPathMethod = $reflection->getMethod('getPath');
        $getPathDocComment = $getPathMethod->getDocComment();
        $this->assertStringContainsString('獲取媒體檔案的存儲路徑', $getPathDocComment);
        
        // 測試 getPathForConversions 方法的 docblock
        $getPathForConversionsMethod = $reflection->getMethod('getPathForConversions');
        $getPathForConversionsDocComment = $getPathForConversionsMethod->getDocComment();
        $this->assertStringContainsString('獲取轉換檔案的存儲路徑', $getPathForConversionsDocComment);
        
        // 測試 getPathForResponsiveImages 方法的 docblock
        $getPathForResponsiveImagesMethod = $reflection->getMethod('getPathForResponsiveImages');
        $getPathForResponsiveImagesDocComment = $getPathForResponsiveImagesMethod->getDocComment();
        $this->assertStringContainsString('獲取響應式圖片的存儲路徑', $getPathForResponsiveImagesDocComment);
    }

    public function test_methods_return_string(): void
    {
        $reflection = new \ReflectionClass($this->pathGenerator);
        
        $getPathMethod = $reflection->getMethod('getPath');
        $this->assertEquals('string', $getPathMethod->getReturnType()->getName());
        
        $getPathForConversionsMethod = $reflection->getMethod('getPathForConversions');
        $this->assertEquals('string', $getPathForConversionsMethod->getReturnType()->getName());
        
        $getPathForResponsiveImagesMethod = $reflection->getMethod('getPathForResponsiveImages');
        $this->assertEquals('string', $getPathForResponsiveImagesMethod->getReturnType()->getName());
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}