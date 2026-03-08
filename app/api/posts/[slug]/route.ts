import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const blogDir = path.join(process.cwd(), 'data/blog')

// GET - 获取单篇文章
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const filePath = path.join(blogDir, `${slug}.mdx`)

    if (!fs.existsSync(filePath)) {
      // 尝试 .md 文件
      const mdPath = path.join(blogDir, `${slug}.md`)
      if (!fs.existsSync(mdPath)) {
        return NextResponse.json({ error: '文章不存在' }, { status: 404 })
      }
    }

    const filePathToUse = fs.existsSync(filePath) ? filePath : path.join(blogDir, `${slug}.md`)
    const content = fs.readFileSync(filePathToUse, 'utf-8')
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
  try {
    const { slug } = await params
    const body = await request.json()
    const { title, date, tags, draft, summary, content, layout, authors, images } = body

    const frontmatter = {
      title,
      date,
      tags: tags || [],
      draft: draft || false,
      summary: summary || '',
      layout: layout || 'PostLayout',
      authors: authors || ['default'],
      images: images || [],
    }

    const fileContent = matter.stringify(content || '', frontmatter)
    const filePath = path.join(blogDir, `${slug}.mdx`)

    fs.writeFileSync(filePath, fileContent, 'utf-8')

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
  try {
    const { slug } = await params
    const filePath = path.join(blogDir, `${slug}.mdx`)
    const mdPath = path.join(blogDir, `${slug}.md`)

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    } else if (fs.existsSync(mdPath)) {
      fs.unlinkSync(mdPath)
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
