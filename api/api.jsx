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

export async function fetchWeatherData(city = DEFAULT_CITY) {
	const response = await fetch(`/api/live/weather?city=${encodeURIComponent(city)}`, {
		method: "GET",
		cache: "no-store",
	})
	return parseResponse(response)
}

export async function fetchUvData(city = DEFAULT_CITY) {
	const response = await fetch(`/api/live/uv?city=${encodeURIComponent(city)}`, {
		method: "GET",
		cache: "no-store",
	})
	return parseResponse(response)
}

export async function fetchAqiData(city = DEFAULT_CITY) {
	const response = await fetch(`/api/live/aqi?city=${encodeURIComponent(city)}`, {
		method: "GET",
		cache: "no-store",
	})
	return parseResponse(response)
}

export async function reverseGeocodeCity(lat, lon) {
	const response = await fetch(`/api/live/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`, {
		method: "GET",
		cache: "no-store",
	})
	return parseResponse(response)
}

export { DEFAULT_CITY }
