import { Hono, Context, Next } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { nanoid } from 'nanoid'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'
import { csrf } from 'hono/csrf'

type Env = {
  TASKS: KVNamespace
  COMMENTS: KVNamespace
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', cors())
app.use('/api/v1/*', async (c, next) => {
  try {
    const jwtMiddleware = jwt({
      secret: c.env.JWT_SECRET,
    })
    await jwtMiddleware(c, next)
  } catch (error) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})
app.use('/api/v1/*', csrf())

// Custom error handling
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

// Custom rate limiting middleware
const rateLimiter = async (c: Context, next: Next) => {
  const ip = c.req.header('CF-Connecting-IP')
  const rateLimitKey = `rate_limit:${ip}`
  const limit = 100
  const window = 60
  let count = await c.env.TASKS.get(rateLimitKey)
  count = count ? parseInt(count) : 0
  if (count >= limit) {
    return c.json({ error: 'Too many requests' }, 429)
  }
  await c.env.TASKS.put(rateLimitKey, (count + 1).toString(), {
    expirationTtl: window,
  })
  await next()
}

// Apply rate limiting to the API routes
app.use('/api/v1/*', rateLimiter)

// Schemas
const taskSchema = z.object({
  title: z.string().min(1).max(100),
  status: z.enum(['todo', 'in-progress', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  labels: z.array(z.string()).default([]),
})

const commentSchema = z.object({
  content: z.string().min(1).max(500),
})

// Task routes
app.post('/api/v1/tasks', zValidator('json', taskSchema), async (c) => {
  const { title, status, priority, labels } = c.req.valid('json')
  const taskId = nanoid()
  const task = {
    id: taskId,
    title,
    status,
    priority,
    labels,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    links: {
      self: `${c.req.url}/${taskId}`,
      comments: `${c.req.url}/${taskId}/comments`,
    },
  }
  await c.env.TASKS.put(task.id, JSON.stringify(task), {
    metadata: task,
  })
  return c.json(task, 201)
})

app.get('/api/v1/tasks', async (c) => {
  const { page = '1', limit = '10', status, priority } = c.req.query()
  const pageNumber = parseInt(page)
  const limitNumber = parseInt(limit)
  const offset = (pageNumber - 1) * limitNumber
  const { keys } = await c.env.TASKS.list({
    limit: limitNumber,
    cursor: offset > 0 ? offset.toString() : undefined,
  })
  const tasks = await Promise.all(
    keys.map(async (key) => {
      const task = await c.env.TASKS.get(key.name, 'json')
      return {
        ...(task as {
          id: string
          title: string
          status: string
          priority: string
          labels: string[]
          createdAt: number
          updatedAt: number
        }),
        links: {
          self: `${c.req.path}/${(task as { id: string }).id}`,
          comments: `${c.req.path}/${(task as { id: string }).id}/comments`,
        },
      }
    })
  )
  const filteredTasks = tasks.filter((task) => {
    if (status && task.status !== status) return false
    if (priority && task.priority !== priority) return false
    return true
  })
  const response = {
    tasks: filteredTasks,
    metadata: {
      total: filteredTasks.length,
      page: pageNumber,
      limit: limitNumber,
    },
    links: {
      self: c.req.url,
      next: `${c.req.url}?page=${pageNumber + 1}&limit=${limitNumber}`,
      prev: pageNumber > 1 ? `${c.req.url}?page=${pageNumber - 1}&limit=${limitNumber}` : null,
    },
  }
  return c.json(response)
})

app.get('/api/v1/tasks/:id', async (c) => {
  const taskId = c.req.param('id')
  const task = await c.env.TASKS.get(taskId)
  if (!task) {
    return c.notFound()
  }
  const parsedTask = JSON.parse(task)
  const response = {
    ...parsedTask,
    links: {
      self: c.req.url,
      comments: `${c.req.url}/comments`,
    },
  }
  return c.json(response)
})

app.put('/api/v1/tasks/:id', zValidator('json', taskSchema.partial()), async (c) => {
  const taskId = c.req.param('id')
  const updatedFields = c.req.valid('json')
  const task = await c.env.TASKS.get(taskId)
  if (!task) {
    return c.notFound()
  }
  const updatedTask = {
    ...JSON.parse(task),
    ...updatedFields,
    updatedAt: Date.now(),
    links: {
      self: c.req.url,
      comments: `${c.req.url}/comments`,
    },
  }
  await c.env.TASKS.put(taskId, JSON.stringify(updatedTask))
  return c.json(updatedTask)
})

app.delete('/api/v1/tasks/:id', async (c) => {
  const taskId = c.req.param('id')
  await c.env.TASKS.delete(taskId)
  return c.json({ message: 'Task deleted successfully' })
})

// Comment routes
app.post('/api/v1/tasks/:id/comments', zValidator('json', commentSchema), async (c) => {
  const taskId = c.req.param('id')
  const { content } = c.req.valid('json')
  const task = await c.env.TASKS.get(taskId)
  if (!task) {
    return c.notFound()
  }
  const commentId = nanoid()
  const comment = {
    id: commentId,
    taskId,
    content,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    links: {
      self: `${c.req.url}/${commentId}`,
      task: c.req.url.replace(`/comments`, ''),
    },
  }
  await c.env.COMMENTS.put(`${taskId}:${commentId}`, JSON.stringify(comment))
  return c.json(comment, 201)
})

app.get('/api/v1/tasks/:id/comments', async (c) => {
  const taskId = c.req.param('id')
  const { keys } = await c.env.COMMENTS.list({
    prefix: `${taskId}:`,
  })
  const comments = await Promise.all(
    keys.map(async (key) => {
      const comment = await c.env.COMMENTS.get(key.name, 'json')
      return {
        ...(comment as {
          id: string
          taskId: string
          content: string
          createdAt: number
          updatedAt: number
        }),
        links: {
          self: `${c.req.url}/${(comment as { id: string }).id}`,
          task: c.req.url.replace(`/comments`, ''),
        },
      }
    })
  )
  const response = {
    comments,
    metadata: {
      total: comments.length,
    },
    links: {
      self: c.req.url,
      task: c.req.url.replace(`/comments`, ''),
    },
  }
  return c.json(response)
})

app.put('/api/v1/tasks/:id/comments/:commentId', zValidator('json', commentSchema.partial()), async (c) => {
  const taskId = c.req.param('id')
  const commentId = c.req.param('commentId')
  const updatedFields = c.req.valid('json')
  const comment = await c.env.COMMENTS.get(`${taskId}:${commentId}`, 'json')
  if (!comment) {
    return c.notFound()
  }
  const updatedComment = {
    ...comment,
    ...updatedFields,
    updatedAt: Date.now(),
    links: {
      self: c.req.url,
      task: c.req.url.replace(`/comments/${commentId}`, ''),
    },
  }
  await c.env.COMMENTS.put(`${taskId}:${commentId}`, JSON.stringify(updatedComment))
  return c.json(updatedComment)
})

app.delete('/api/v1/tasks/:id/comments/:commentId', async (c) => {
  const taskId = c.req.param('id')
  const commentId = c.req.param('commentId')
  await c.env.COMMENTS.delete(`${taskId}:${commentId}`)
  return c.json({ message: 'Comment deleted successfully' })
})

export default app