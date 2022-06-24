import { Router } from 'itty-router'
import { error, json, status } from 'itty-router-extras'
import html from './html/home'
import autoPdf from './html/autopdf'
import edit from './html/edit'
import statsView from './html/stats'
import notFound from './html/404'
import notFoundError from './html/error'

declare const EDIT_TOKEN: string
declare const KV_STORAGE: KVNamespace

type Stats = Record<string, Record<string, string[]>>

interface VideoData {
  url: string
  times: string[]
  urls: Record<number, string>
}

const router = Router()

router
  .get('/', () => {
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  })
  .get('/stats', async () => {
    const stats = await fetchStats()

    return new Response(statsView.replace('{data}', JSON.stringify(stats)), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  })
  .get('/edit', () => {
    return new Response(edit, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  })
  .get('/pdf', () => {
    return new Response(autoPdf, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  })
  .get('/editor/load', async (request: Request) => {
    if (request.headers.get('X-Token') !== EDIT_TOKEN) {
      return error(403, 'Invalid token')
    }

    return json(await loadCourses())
  })
  .post('/editor/save', async (request: Request) => {
    if (request.headers.get('X-Token') !== EDIT_TOKEN) {
      return error(403, 'Invalid token')
    }

    await saveCourses(await request.json())

    return status(200)
  })
  .get('/qrcode/:course/:slide', async ({ url, params }) => {
    const course = params?.course
    const slide = params?.slide ? parseInt(params.slide) : -1
    const uri = new URL(url)

    // TODO We should generate QR Codes ourselves.
    const body = await fetch('https://qrcode.show/', {
      method: 'POST',
      body: `${uri.origin}/v/${course}/${slide}`,
      headers: {
        accept: 'image/svg+xml',
      },
    })

    return new Response(body.body, {
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    })
  })
  .get('/v/:course/:slide', async ({ params }) => {
    const course = params?.course ? parseInt(params.course) : -1
    const slide = params?.slide ? parseInt(params.slide) : -1

    if (isNaN(course) || course < 1 || isNaN(slide) || slide < 1) {
      return missing()
    }

    const courses: Record<string, VideoData> = await loadCourses()
    const info = courses[course - 1]

    if (!info) {
      return missing()
    }

    const time = info.times[slide - 1]

    if (!time) {
      return missing()
    }

    if (time == '-1') {
      return new Response(notFoundError, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    const url = info.urls ? info.urls[slide] ?? info.url : info.url

    return Response.redirect(url + (slide > 0 ? '#' + time : ''))
  })
  .all('*', missing)

export async function handleRequest(request: Request): Promise<Response> {
  return router.handle(request)
}

function missing(): Response {
  return new Response(notFound, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

async function fetchStats(): Promise<Record<string, unknown>> {
  const rawData: Stats = (await KV_STORAGE.get('stats', 'json')) || {}
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

  return { data, drilldown, dates }
}

async function loadCourses(): Promise<Record<string, VideoData>> {
  return (await KV_STORAGE.get('courses', 'json')) || {}
}

function saveCourses(courses: Record<string, VideoData>): Promise<void> {
  return KV_STORAGE.put('courses', JSON.stringify(courses))
}
