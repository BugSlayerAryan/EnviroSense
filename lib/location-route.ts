const DYNAMIC_ROUTE_PREFIXES = ["/airqualit", "/weather", "/uv-index"] as const

const DEFAULT_COUNTRY = "IN"

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

function decodeSegment(segment: string) {
  return decodeURIComponent(segment).replace(/-/g, " ").trim()
}

function slugifySegment(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function splitCityCountry(input: string) {
  const [cityPart, countryPart] = input.split(",").map((part) => part.trim())

  return {
    city: cityPart || "new delhi",
    country: countryPart || DEFAULT_COUNTRY,
  }
}

function normalizeCountrySlug(country: string) {
  const normalizedCountry = country.trim().toLowerCase()
  if (normalizedCountry === "in" || normalizedCountry === "india") {
    return "india"
  }

  if (/^[a-z]{2}$/i.test(country)) {
    return country.toLowerCase()
  }

  return slugifySegment(toTitleCase(country))
}

function formatCountryLabel(countrySegment: string) {
  const cleaned = decodeSegment(countrySegment)
  const normalizedCountry = cleaned.toLowerCase()
  if (normalizedCountry === "in" || normalizedCountry === "india") {
    return "India"
  }

  if (/^[a-z]{2}$/i.test(cleaned)) {
    return cleaned.toUpperCase()
  }

  return toTitleCase(cleaned)
}

export function cityFromRouteSegments(countrySegment: string, citySegment: string) {
  const country = formatCountryLabel(countrySegment)
  const city = toTitleCase(decodeSegment(citySegment))
  return `${city}, ${country}`
}

export function canonicalCountrySegment(countrySegment: string) {
  return normalizeCountrySlug(formatCountryLabel(countrySegment))
}

export function buildDashboardRoute(cityInput: string) {
  const { city, country } = splitCityCountry(cityInput)
  const countrySlug = normalizeCountrySlug(country)
  const citySlug = slugifySegment(city)

  return `/${countrySlug}/${citySlug}`
}

export function buildCityRoute(basePath: "/airqualit" | "/weather" | "/uv-index", cityInput: string) {
  const { city, country } = splitCityCountry(cityInput)
  const countrySlug = normalizeCountrySlug(country)
  const citySlug = slugifySegment(city)

  return `${basePath}/${countrySlug}/${citySlug}`
}

export function extractDashboardCityFromPathname(pathname: string) {
  const match = pathname.match(/^\/([^/]+)\/([^/]+)$/)
  if (!match) return null
  const [, country, city] = match
  if (["airqualit", "weather", "uv-index", "maps", "alert", "savecity", "city-not-found"].includes(country)) {
    return null
  }
  return cityFromRouteSegments(country, city)
}

export function extractCityFromPathname(pathname: string) {
  const match = pathname.match(/^\/(airqualit|weather|uv-index)\/([^/]+)\/([^/]+)/)
  if (!match) return null
  const [, , country, city] = match
  return cityFromRouteSegments(country, city)
}

export function isDynamicCityRoute(pathname: string) {
  return DYNAMIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export function isDashboardRoute(pathname: string) {
  return extractDashboardCityFromPathname(pathname) !== null
}
