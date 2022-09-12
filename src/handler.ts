import { Obj, Router } from 'itty-router'
import { error, json, missing, status } from 'itty-router-extras'

type RouteRequest = Request & { params: Obj }
type Stats = Record<number, Record<number, string[]>>

interface Env {
  R2_BUCKET: R2Bucket
  KV_STORAGE: KVNamespace
  EDIT_TOKEN: string
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
  .post('/api/:id/pdf/:course', async (request: RouteRequest, env: Env) => {
    const params = request.params
    const key = `pdf-${params?.id}-${params?.course}-${Date.now()}`

    await env.R2_BUCKET.put(key, request.body, {
      httpMetadata: request.headers,
    })

    return status(200)
  })
  .get('/api/:id/qr/:course/:slide', async ({ url, params }) => {
    const id = params?.id
    const course = params?.course
    const slide = params?.slide ? parseInt(params.slide) : -1
    const uri = new URL(url)

    // TODO We should generate QR Codes ourselves.
    const body = await fetch('https://qrcode.show/', {
      method: 'POST',
      body: `${uri.origin}/c/${id}/${course}/${slide}`,
      headers: { Accept: 'image/svg+xml' },
    })

    return new Response(body.body, {
      headers: { 'Content-Type': 'image/svg+xml' },
    })
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

    await incrementStats(env, id, course, slide)

    if (time == '-1') {
      return fetch(request) // TODO ghost ?
    }

    const url = info.urls ? info.urls[slide] ?? info.url : info.url

    return Response.redirect(url + (slide > 0 ? '#' + time : ''))
  })
  .all('*', () => missing())

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return router.handle(request, env)
  },
}

async function fetchStats(
  env: Env,
  id: string,
): Promise<Record<string, unknown>> {
  const rawData = await loadStats(env, id)
  const dates: Record<string, number> = {}
  const data = Object.entries(rawData).map(([key, values]) => {
    return {
      name: 'Cours ' + key,
      drilldown: key,
      y: Object.values(values).reduce((sum, val) => sum + val.length, 0),
    }
  })
  const drilldown = Object.entries(rawData).map(([courseKey, values]) => {
    return {
      name: 'Total',
      id: courseKey,
      data: Object.entries(values).map(([key, val]) => [
        'Slide ' + key,
        val.length,
      ]),
    }
  })
  let total = 0

  for (const values of Object.values(rawData)) {
    for (const visits of Object.values(values)) {
      for (const visit of visits) {
        const key = visit.substring(0, 10)

        ++total

        if (dates[key]) {
          ++dates[key]
        } else {
          dates[key] = 1
        }
      }
    }
  }

  return { data, drilldown, dates, total }
}

async function incrementStats(
  env: Env,
  id: string,
  course: number,
  slide: number,
): Promise<void> {
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
