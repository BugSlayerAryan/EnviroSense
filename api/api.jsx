import { globalCache } from "@/lib/request-cache"

const DEFAULT_CITY = "New Delhi"

async function parseResponse(response) {
	const payload = await response.json()
	if (!response.ok) {
		throw new Error(payload?.error || "API request failed")
	}
	if (payload?.cityNotFound) {
		throw new Error("CITY_NOT_FOUND")
	}
	return payload
}

// Helper to create cache key
function getCacheKey(type, city, lat, lon) {
	if (lat !== undefined && lon !== undefined) {
		return `${type}:${lat},${lon}`
	}
	return `${type}:${city}`
}

export async function fetchWeatherData(city = DEFAULT_CITY, useCache = true) {
	const cacheKey = getCacheKey("weather", city)
	
	// Return cached data if available
	if (useCache) {
		const cached = globalCache.get(cacheKey)
		if (cached) return cached
	}

	const response = await fetch(`/api/live/weather?city=${encodeURIComponent(city)}`, {
		method: "GET",
		cache: "no-store",
	})
	const data = await parseResponse(response)
	
	// Cache the result
	if (useCache) {
		globalCache.set(cacheKey, data, 300000) // 5 minutes
	}
	
	return data
}

export async function fetchUvData(city = DEFAULT_CITY, useCache = true) {
	const cacheKey = getCacheKey("uv", city)
	
	if (useCache) {
		const cached = globalCache.get(cacheKey)
		if (cached) return cached
	}

	const response = await fetch(`/api/live/uv?city=${encodeURIComponent(city)}`, {
		method: "GET",
		cache: "no-store",
	})
	const data = await parseResponse(response)
	
	if (useCache) {
		globalCache.set(cacheKey, data, 300000)
	}
	
	return data
}

export async function fetchAqiData(city = DEFAULT_CITY, useCache = true) {
	const cacheKey = getCacheKey("aqi", city)
	
	if (useCache) {
		const cached = globalCache.get(cacheKey)
		if (cached) return cached
	}

	const response = await fetch(`/api/live/aqi?city=${encodeURIComponent(city)}`, {
		method: "GET",
		cache: "no-store",
	})
	const data = await parseResponse(response)
	
	if (useCache) {
		globalCache.set(cacheKey, data, 300000)
	}
	
	return data
}

export async function reverseGeocodeCity(lat, lon, useCache = true) {
	const cacheKey = getCacheKey("reverse", null, lat, lon)
	
	if (useCache) {
		const cached = globalCache.get(cacheKey)
		if (cached) return cached
	}

	const response = await fetch(`/api/live/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`, {
		method: "GET",
		cache: "no-store",
	})
	const data = await parseResponse(response)
	
	if (useCache) {
		globalCache.set(cacheKey, data, 300000)
	}
	
	return data
}

export { DEFAULT_CITY }
