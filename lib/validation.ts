import path from 'path'

import { NextResponse } from 'next/server'

/**
 * 验证slug格式
 * 只允许字母、数字、连字符、中文字符
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || slug.length === 0) {
    return { valid: false, error: 'slug不能为空' }
  }

  if (slug.length > 200) {
    return { valid: false, error: 'slug长度不能超过200个字符' }
  }

  // 检查是否包含路径遍历尝试
  if (slug.includes('..') || slug.includes('/') || slug.includes('\\')) {
    return { valid: false, error: 'slug包含非法字符' }
  }

  return { valid: true }
}

/**
 * 验证frontmatter必填字段
 */
export function validateFrontmatter(
  frontmatter: Record<string, unknown>,
): { valid: boolean; error?: string } {
  if (
    !frontmatter.title ||
    typeof frontmatter.title !== 'string' ||
    frontmatter.title.trim() === ''
  ) {
    return { valid: false, error: 'title字段是必填的' }
  }

  if (frontmatter.title.length > 500) {
    return { valid: false, error: 'title长度不能超过500个字符' }
  }

  if (!frontmatter.date || typeof frontmatter.date !== 'string') {
    return { valid: false, error: 'date字段是必填的' }
  }

  // 验证日期格式（简单的ISO格式检查）
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(frontmatter.date)) {
    return { valid: false, error: 'date格式无效，应为YYYY-MM-DD' }
  }

  // 验证tags（如果存在）
  if (frontmatter.tags) {
    if (!Array.isArray(frontmatter.tags)) {
      return { valid: false, error: 'tags必须是数组' }
    }

    if (
      frontmatter.tags.some(
        (tag: unknown) => typeof tag !== 'string' || tag.length > 100,
      )
    ) {
      return { valid: false, error: 'tags中的每个元素必须是长度不超过100的字符串' }
    }
  }

  // 验证summary（如果存在）
  if (frontmatter.summary && typeof frontmatter.summary === 'string') {
    if (frontmatter.summary.length > 500) {
      return { valid: false, error: 'summary长度不能超过500个字符' }
    }
  }

  // 验证content长度
  if (frontmatter.content && typeof frontmatter.content === 'string') {
    if (frontmatter.content.length > 1000000) {
      return { valid: false, error: 'content长度不能超过1MB' }
    }
  }

  return { valid: true }
}

/**
 * 验证文件路径（防止路径遍历）
 */
export function validateFilePath(
  filePath: string,
  allowedDir: string,
): { valid: boolean; error?: string } {
  // 规范化路径
  const normalizedPath = path.normalize(filePath)
  const normalizedAllowedDir = path.normalize(allowedDir)

  // 检查是否在允许的目录内
  const resolvedPath = path.join(normalizedAllowedDir, normalizedPath)
  const relativePathStr = path.relative(normalizedAllowedDir, resolvedPath)

  // 检查是否包含 .. （尝试遍历到父目录）
  if (relativePathStr.startsWith('..') || normalizedPath.includes('..')) {
    return { valid: false, error: '文件路径不允许访问' }
  }

  return { valid: true }
}

/**
 * 创建验证错误响应
 */
export function createValidationError(error: string): NextResponse {
  return NextResponse.json({ error: `验证失败: ${error}` }, { status: 400 })
}
