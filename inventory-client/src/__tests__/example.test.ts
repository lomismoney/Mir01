/**
 * 示例測試文件
 * 
 * 用於驗證測試環境配置是否正確
 */

describe('測試環境驗證', () => {
  it('應該能夠運行基本測試', () => {
    expect(true).toBe(true)
  })
  
  it('應該能夠進行數學運算', () => {
    const sum = 1 + 2
    expect(sum).toBe(3)
  })
  
  it('應該能夠處理字符串', () => {
    const message = 'Hello World'
    expect(message).toContain('World')
  })
  
  it('應該能夠處理陣列', () => {
    const fruits = ['蘋果', '香蕉', '橘子']
    expect(fruits).toHaveLength(3)
    expect(fruits).toContain('蘋果')
  })
  
  it('應該能夠處理對象', () => {
    const user = {
      id: 1,
      name: '測試用戶',
      email: 'test@example.com'
    }
    
    expect(user.id).toBe(1)
    expect(user.name).toBe('測試用戶')
    expect(user.email).toMatch(/@/)
  })
  
  it('應該能夠測試異步函數', async () => {
    const start = Date.now()
    
    await new Promise(resolve => setTimeout(resolve, 10))
    
    const end = Date.now()
    
    // 調整時間容差，考慮到 CI 環境可能較慢
    expect(end - start).toBeGreaterThanOrEqual(5)
    expect(end - start).toBeLessThan(200) // 增加容差到 200ms
  })
}) 