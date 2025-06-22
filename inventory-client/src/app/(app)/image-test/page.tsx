import Image from 'next/image';

export default function ImageTestPage() {
  // 使用 127.0.0.1 替代 localhost
  const imageUrl = "http://127.0.0.1:8000/storage/1/product-8-1750501080.jpg";

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Next.js Image 元件壓力測試</h1>
      <p className="mb-2">圖片 URL: {imageUrl}</p>
      <div className="relative w-96 h-96 border-4 border-red-500">
        <Image
          src={imageUrl}
          alt="測試圖片"
          fill
          style={{ objectFit: 'contain' }}
          // 確保 unoptimized 屬性被移除或設為 false
          // unoptimized={true} 
        />
      </div>
    </div>
  );
} 