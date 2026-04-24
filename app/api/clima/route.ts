import { NextRequest, NextResponse } from "next/server"

interface WeatherResponse {
  main: { temp: number }
  weather: { description: string }[]
  rain?: { "1h"?: number; "3h"?: number }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  const apiKey = process.env.OPENWEATHERMAP_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "OPENWEATHERMAP_API_KEY not configured" }, { status: 500 })
  }

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon query params required" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`,
      { next: { revalidate: 1800 } } // cache 30min
    )

    if (!res.ok) {
      return NextResponse.json({ error: "OpenWeatherMap API error" }, { status: res.status })
    }

    const data = (await res.json()) as WeatherResponse

    return NextResponse.json({
      temperatura: Math.round(data.main.temp * 10) / 10,
      condicao: data.weather[0]?.description ?? "",
      chuva: !!(data.rain?.["1h"] || data.rain?.["3h"]),
      descricao: `${Math.round(data.main.temp)}°C, ${data.weather[0]?.description ?? ""}${data.rain ? ", com chuva" : ""}`,
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 500 })
  }
}
