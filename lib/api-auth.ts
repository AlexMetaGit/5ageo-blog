import { NextResponse } from 'next/server'

/**
 * 验证API请求的身份
 * @param request - Next.js Request对象
 * @returns 如果验证失败返回NextResponse错误，否则返回null
 */
export function validateApiAuth(request: Request): NextResponse | null {
  const authHeader = request.headers.get('authorization')
  const token = process.env.ADMIN_API_TOKEN

  if (!token) {
    console.warn('ADMIN_API_TOKEN环境变量未设置')
    return NextResponse.json({ error: '服务器配置错误' }, { status: 500 })
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: '未授权：缺少身份验证令牌' }, { status: 401 })
  }

  const providedToken = authHeader.substring(7) // 移除 "Bearer " 前缀

  if (providedToken !== token) {
    return NextResponse.json({ error: '未授权：无效的令牌' }, { status: 401 })
  }

  return null // 验证通过
}
