import { parse } from 'cookie'
import { Obj, Router } from 'itty-router'
import { error, json, missing, status } from 'itty-router-extras'

type RouteRequest = Request & { params: Obj }
type Stats = {
  [course: number]: { [slide: number]: string[] }
}

interface Env {
  R2_BUCKET: R2Bucket
  KV_STORAGE: KVNamespace
  EDIT_TOKEN: string
  R2_BUCKET_DOMAIN: string
}

interface VideoData {
  url: string
  times: string[]
  urls: Record<number, string>
}

const router = Router()

router
  .get('/api/:id/stats', async (request, env: Env) => {
    const stats = await fetchStats(env, request.params?.id ?? '')

    return Object.keys(stats).length > 0 ? json(stats) : missing()
  })
  .get('/api/:id/edit', async (request: RouteRequest, env: Env) => {
    if (request.headers.get('X-Token') !== env.EDIT_TOKEN) {
      return error(403, 'Invalid token')
    }

    return json(await loadCourses(env, request.params?.id))
  })
  .post('/api/:id/edit', async (request: RouteRequest, env: Env) => {
    if (request.headers.get('X-Token') !== env.EDIT_TOKEN) {
      return error(403, 'Invalid token')
    }

    await saveCourses(env, request.params?.id, await request.json())

    return status(200)
  })
  .post('/api/:id/pdf/:course/raw', async (request: RouteRequest, env: Env) => {
    const params = request.params
    const key = `pdf-${params?.id}-${params?.course}-${Date.now()}.pdf`

    await env.R2_BUCKET.put(key, request.body, {
      httpMetadata: request.headers,
    })

    return status(200)
  })
  .post('/api/:id/pdf/:course', async (request: RouteRequest, env: Env) => {
    const key = `qr-${request.params?.id}-${request.params?.course}.pdf`

    await env.R2_BUCKET.put(key, request.body, {
      httpMetadata: request.headers,
    })

    return status(200)
  })
  .get('/c/:id/:course/:slide', async (request: RouteRequest, env: Env) => {
    const params = request.params
    const id = params?.id ?? ''
    const course = params?.course ? parseInt(params.course) : -1
    const slide = params?.slide ? parseInt(params.slide) : -1

    if (isNaN(course) || course < 1 || isNaN(slide) || slide < 1) {
      return fetch(request)
    }

    const courses: Record<string, VideoData> = await loadCourses(env, id)
    const info = courses[course - 1]

    if (!info) {
      return fetch(request)
    }

    const time = info.times[slide - 1]

    if (!time) {
      return fetch(request)
    }

    await addCount(env, id, course, slide)

    if (time == '-1') {
      return fetch(request) // TODO ghost ?
    }

    const redirectUrl = info.urls ? info.urls[slide] ?? info.url : info.url
    const urlHash = slide > 0 ? '#' + time : ''

    const headers = new Headers({ Location: redirectUrl + urlHash })

    await handleSession(request, env, id, headers)

    return new Response(null, { status: 302, headers })
  })
  .all('*', () => missing())

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return router.handle(request, env)
  },
}

async function fetchStats(env: Env, id: string) {
  const basePdfUrl = `https://${env.R2_BUCKET_DOMAIN}/qr-${id}-{id}.pdf`
  const rawData = await loadStats(env, id)
  const dates: Record<string, number> = {}
  let total = 0

  const data = Object.entries(rawData).map(([courseId, values]) => {
    const count = Object.entries(values)
      .filter(([slideId]) => slideId !== '1')
      .reduce((sum, [, dates]) => sum + dates.length, 0)

    total += count

    return { name: 'Cours ' + courseId, drilldown: courseId, y: count }
  })
  const drilldown = Object.entries(rawData).map(([courseId, values]) => {
    const data = Object.entries(values)
      .filter(([slideId]) => slideId !== '1')
      .map(([key, dates]) => {
        return { name: 'Slide ' + key, y: dates.length, id: key }
      })

    return { name: 'Total', id: courseId, data }
  })

  for (const values of Object.values(rawData)) {
    for (const visits of Object.values(values)) {
      for (const visit of visits) {
        const key = visit.substring(0, 10)

        if (dates[key]) {
          ++dates[key]
        } else {
          dates[key] = 1
        }
      }
    }
  }

  return { data, drilldown, dates, total, basePdfUrl }
}

async function handleSession(
  request: Request,
  env: Env,
  id: string,
  headers: Headers,
) {
  const sessions = await loadSessions(env, id)
  const cookies = parse(request.headers.get('Cookie') || '')
  let sessionId = cookies['session_uid']

  if (!sessionId) {
    sessionId = Math.random().toString(16).substring(2)
    const cookieHeader = `session_uid=${sessionId}; Max-Age=15552000; Path=/; Secure` // 6 months
    headers.set('Set-Cookie', cookieHeader)
  }

  if (sessions.includes(sessionId)) {
    return
  }

  sessions.push(sessionId)

  await env.KV_STORAGE.put('sessions-' + id, JSON.stringify(sessions))
}

async function addCount(env: Env, id: string, course: number, slide: number) {
  const stats = await loadStats(env, id)
  const date = formatDate(new Date())
  const slides = stats[course]

  if (!slides) {
    stats[course] = { [slide]: [date] }
    await saveStats(env, id, stats)
    return
  }

  const dates = slides[slide]

  if (!dates) {
    stats[course][slide] = [date]
    await saveStats(env, id, stats)
    return
  }

  stats[course][slide].push(date)
  await saveStats(env, id, stats)
}

async function loadStats(env: Env, id: string): Promise<Stats> {
  return (await env.KV_STORAGE.get('stats-' + id, 'json')) || {}
}

async function loadSessions(env: Env, id: string): Promise<string[]> {
  return (await env.KV_STORAGE.get('sessions-' + id, 'json')) || []
}

function saveStats(env: Env, id: string, stats: Stats): Promise<void> {
  return env.KV_STORAGE.put('stats-' + id, JSON.stringify(stats))
}

async function loadCourses(
  env: Env,
  id: string,
): Promise<Record<string, VideoData>> {
  return (await env.KV_STORAGE.get('courses-' + id, 'json')) || {}
}

function saveCourses(
  env: Env,
  id: string,
  courses: Record<string, VideoData>,
): Promise<void> {
  return env.KV_STORAGE.put('courses-' + id, JSON.stringify(courses))
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
