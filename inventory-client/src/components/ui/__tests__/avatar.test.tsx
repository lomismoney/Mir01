import React from 'react';
import { render, screen } from '@testing-library/react';
import { Avatar, AvatarImage, AvatarFallback } from '../avatar';

describe('Avatar 組件測試', () => {
  it('應該正確渲染 Avatar 組件', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass('relative', 'flex', 'size-8', 'shrink-0', 'overflow-hidden', 'rounded-full');
  });

  it('應該渲染 AvatarImage 和 AvatarFallback', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarImage 
          src="https://github.com/shadcn.png" 
          alt="頭像"
        />
        <AvatarFallback data-testid="avatar-fallback">CN</AvatarFallback>
      </Avatar>
    );
    
    // 檢查容器存在
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toBeInTheDocument();
    
    // 檢查 fallback 存在（因為圖片可能不會載入）
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toBeInTheDocument();
  });

  it('應該渲染 AvatarFallback', () => {
    render(
      <Avatar>
        <AvatarFallback data-testid="avatar-fallback">JD</AvatarFallback>
      </Avatar>
    );
    
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent('JD');
    expect(fallback).toHaveClass('flex', 'size-full', 'items-center', 'justify-center', 'rounded-full');
  });

  it('應該支援自定義 className', () => {
    render(
      <Avatar className="custom-avatar-class" data-testid="avatar">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveClass('custom-avatar-class');
  });

  it('應該包含正確的 data attributes', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarImage 
          src="test-image.jpg" 
          alt="測試圖片"
        />
        <AvatarFallback data-testid="avatar-fallback">JD</AvatarFallback>
      </Avatar>
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveAttribute('data-slot', 'avatar');
    
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toHaveAttribute('data-slot', 'avatar-fallback');
  });
}); 