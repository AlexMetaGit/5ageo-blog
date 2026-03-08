import { NextResponse } from 'next/server'
import { access, readdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { validateApiAuth } from '@/lib/api-auth'
import { validateFrontmatter, createValidationError } from '@/lib/validation'

const blogDir = path.join(process.cwd(), 'data/blog')

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

// GET - 获取所有文章列表
export async function GET() {
  try {
    const files = await readdir(blogDir)
    const postCandidates = files.filter((file) => file.endsWith('.mdx') || file.endsWith('.md'))
    const posts = (
      await Promise.all(
        postCandidates.map(async (file) => {
        const filePath = path.join(blogDir, file)
        const content = await readFile(filePath, 'utf-8')
        const { data } = matter(content)
        const slug = file.replace(/\.mdx?$/, '')

        return {
          slug,
          title: data.title || '无标题',
          date: data.date || '',
          tags: data.tags || [],
          draft: data.draft || false,
          summary: data.summary || '',
        }
      })
      )
    )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ posts })
  } catch (error) {
    return NextResponse.json({ error: '获取文章列表失败' }, { status: 500 })
  }
}

// POST - 创建新文章
export async function POST(request: Request) {
  // 验证身份
  const authError = validateApiAuth(request)
  if (authError) {
    return authError
  }

  try {
    const body = await request.json()
    const { title, date, tags, draft, summary, content, layout, authors, images } = body

    // 验证frontmatter
    const frontmatter = {
      title,
      date: date || new Date().toISOString().split('T')[0],
      tags: tags || [],
      draft: draft || false,
      summary: summary || '',
      layout: layout || 'PostLayout',
      authors: authors || ['default'],
      images: images || [],
      content,
    }

    const validation = validateFrontmatter(frontmatter)
    if (!validation.valid) {
      return createValidationError(validation.error || '验证失败')
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '')

    const fileContent = matter.stringify(content || '', frontmatter)
    const filePath = path.join(blogDir, `${slug}.mdx`)

    // 检查文件是否已存在
    if (await fileExists(filePath)) {
      return NextResponse.json({ error: '文章已存在' }, { status: 400 })
    }

    await writeFile(filePath, fileContent, 'utf-8')

    return NextResponse.json({
      success: true,
      slug,
      message: '文章创建成功',
    })
  } catch (error) {
    console.error('创建文章失败:', error)
    return NextResponse.json({ error: '创建文章失败' }, { status: 500 })
  }
}
