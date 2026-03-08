'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Post {
  slug: string
  title: string
  date: string
  tags: string[]
  draft: boolean
  summary: string
}

export default function AdminPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts')
      const data = await res.json()
      if (data.posts) {
        setPosts(data.posts)
      }
    } catch (err) {
      setError('加载文章列表失败')
    } finally {
      setLoading(false)
    }
  }

  const deletePost = async (slug: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return

    try {
      const res = await fetch(`/api/posts/${slug}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setPosts(posts.filter((p) => p.slug !== slug))
        alert('删除成功')
      } else {
        alert('删除失败: ' + data.error)
      }
    } catch (err) {
      alert('删除失败')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📝 5AGEO Blog 管理</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">管理博客文章和作者</p>
          </div>
          <Link
            href="/admin/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            ✨ 新建文章
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{posts.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">总文章数</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <div className="text-2xl font-bold text-green-600">
              {posts.filter((p) => !p.draft).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">已发布</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <div className="text-2xl font-bold text-yellow-600">
              {posts.filter((p) => p.draft).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">草稿</div>
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="py-8 text-center text-gray-600 dark:text-gray-400">加载中...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">{error}</div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.slug} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {post.title}
                      </h3>
                      {post.draft && (
                        <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                          草稿
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {post.date} · {post.tags.join(', ')}
                    </p>
                    {post.summary && (
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                        {post.summary}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/edit/${post.slug}`}
                      className="rounded px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-gray-700"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => deletePost(post.slug)}
                      className="rounded px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-700"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
