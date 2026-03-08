import { NextResponse } from 'next/server'
import { access, readFile, unlink, writeFile } from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { validateApiAuth } from '@/lib/api-auth'
import { validateSlug, validateFrontmatter, createValidationError } from '@/lib/validation'

const blogDir = path.join(process.cwd(), 'data/blog')

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

// GET - 获取单篇文章
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    // 验证slug
    const slugValidation = validateSlug(slug)
    if (!slugValidation.valid) {
      return createValidationError(slugValidation.error || '验证失败')
    }

    const filePath = path.join(blogDir, `${slug}.mdx`)

    if (!(await fileExists(filePath))) {
      // 尝试 .md 文件
      const mdPath = path.join(blogDir, `${slug}.md`)
      if (!(await fileExists(mdPath))) {
        return NextResponse.json({ error: '文章不存在' }, { status: 404 })
      }
    }

    const filePathToUse =
      (await fileExists(filePath)) ? filePath : path.join(blogDir, `${slug}.md`)
    const content = await readFile(filePathToUse, 'utf-8')
    const { data, content: body } = matter(content)

    return NextResponse.json({
      post: {
        slug,
        frontmatter: data,
        content: body,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: '获取文章失败' }, { status: 500 })
  }
}

// PUT - 更新文章
export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  // 验证身份
  const authError = validateApiAuth(request)
  if (authError) {
    return authError
  }

  try {
    const { slug } = await params

    // 验证slug
    const slugValidation = validateSlug(slug)
    if (!slugValidation.valid) {
      return createValidationError(slugValidation.error || '验证失败')
    }

    const body = await request.json()
    const { title, date, tags, draft, summary, content, layout, authors, images } = body

    // 验证frontmatter
    const frontmatter = {
      title,
      date,
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

    const fileContent = matter.stringify(content || '', frontmatter)
    const filePath = path.join(blogDir, `${slug}.mdx`)

    await writeFile(filePath, fileContent, 'utf-8')

    return NextResponse.json({
      success: true,
      message: '文章更新成功',
    })
  } catch (error) {
    console.error('更新文章失败:', error)
    return NextResponse.json({ error: '更新文章失败' }, { status: 500 })
  }
}

// DELETE - 删除文章
export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  // 验证身份
  const authError = validateApiAuth(request)
  if (authError) {
    return authError
  }

  try {
    const { slug } = await params

    // 验证slug
    const slugValidation = validateSlug(slug)
    if (!slugValidation.valid) {
      return createValidationError(slugValidation.error || '验证失败')
    }

    const filePath = path.join(blogDir, `${slug}.mdx`)
    const mdPath = path.join(blogDir, `${slug}.md`)

    if (await fileExists(filePath)) {
      await unlink(filePath)
    } else if (await fileExists(mdPath)) {
      await unlink(mdPath)
    } else {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: '文章删除成功',
    })
  } catch (error) {
    return NextResponse.json({ error: '删除文章失败' }, { status: 500 })
  }
}
