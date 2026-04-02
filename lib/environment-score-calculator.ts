export interface EnvironmentalData {
  aqi: number | null
  uv: number | null
  temperature: number | null
  humidity: number | null
  windSpeed: number | null
  pollutants?: {
    pm25?: number | null
    pm10?: number | null
    no2?: number | null
  }
}

export interface ScoreResult {
  totalScore: number
  category: "Excellent" | "Good" | "Moderate" | "Unhealthy" | "Very Unhealthy"
  categoryColor: "green" | "yellow" | "orange" | "red" | "purple"
  recommendation: string
  healthTips: string[]
  riskGroups: string[]
  scoreBreakdown: {
    aqi: number
    uv: number
    weather: number
  }
  trend: {
    change: number
    direction: "up" | "down"
  }
}

export function calculateEnvironmentScore(data: EnvironmentalData): ScoreResult {
  // Calculate component scores
  const aqiScore = calculateAqiScore(data.aqi)
  const uvScore = calculateUvScore(data.uv)
  const weatherScore = calculateWeatherScore(data.temperature, data.humidity, data.windSpeed)

  // Weighted total
  const totalScore = Math.round(aqiScore * 0.4 + uvScore * 0.3 + weatherScore * 0.3)

  // Determine category
  const category = getCategory(totalScore)
  const categoryColor = getCategoryColor(category)

  // Generate recommendations and health tips
  const recommendation = getRecommendation(totalScore, data)
  const healthTips = getHealthTips(totalScore, data)
  const riskGroups = getRiskGroups(totalScore, data)

  // Simulate trend (in production, this would compare with previous day data)
  const trend = {
    change: 5, // hardcoded for demo, should compare with 24h average
    direction: "up" as const,
  }

  return {
    totalScore,
    category,
    categoryColor,
    recommendation,
    healthTips,
    riskGroups,
    scoreBreakdown: {
      aqi: aqiScore,
      uv: uvScore,
      weather: weatherScore,
    },
    trend,
  }
}

function calculateAqiScore(aqi: number | null): number {
  if (aqi === null) return 50

  if (aqi <= 50) return 100 // Good
  if (aqi <= 100) return 80 // Moderate
  if (aqi <= 150) return 55 // Unhealthy for Sensitive Groups
  if (aqi <= 200) return 30 // Unhealthy
  if (aqi <= 300) return 15 // Very Unhealthy
  return 0 // Hazardous
}

function calculateUvScore(uv: number | null): number {
  if (uv === null) return 50

  if (uv <= 2.9) return 100 // Low
  if (uv <= 5.9) return 85 // Moderate
  if (uv <= 7.9) return 65 // High
  if (uv <= 10.9) return 40 // Very High
  return 20 // Extreme
}

function calculateWeatherScore(
  temperature: number | null,
  humidity: number | null,
  windSpeed: number | null
): number {
  let score = 50

  // Temperature contribution (ideal: 18-28°C)
  if (temperature !== null) {
    if (temperature >= 18 && temperature <= 28) {
      score += 20
    } else if (temperature >= 10 && temperature <= 35) {
      score += 10
    }
  }

  // Humidity contribution (ideal: 40-60%)
  if (humidity !== null) {
    if (humidity >= 40 && humidity <= 60) {
      score += 20
    } else if (humidity >= 30 && humidity <= 70) {
      score += 10
    }
  }

  // Wind contribution (lower is better for outdoor activities)
  if (windSpeed !== null) {
    if (windSpeed <= 5) {
      score += 10
    } else if (windSpeed <= 10) {
      score += 5
    }
  }

  return Math.min(100, score)
}

function getCategory(score: number): ScoreResult["category"] {
  if (score >= 80) return "Excellent"
  if (score >= 60) return "Good"
  if (score >= 40) return "Moderate"
  if (score >= 20) return "Unhealthy"
  return "Very Unhealthy"
}

function getCategoryColor(category: ScoreResult["category"]): ScoreResult["categoryColor"] {
  const colors: Record<ScoreResult["category"], ScoreResult["categoryColor"]> = {
    Excellent: "green",
    Good: "green",
    Moderate: "yellow",
    Unhealthy: "red",
    "Very Unhealthy": "purple",
  }
  return colors[category]
}

function getRecommendation(score: number, data: EnvironmentalData): string {
  if (score >= 80) {
    return "Environmental conditions are excellent for outdoor activities. All individuals can safely enjoy outdoor recreation."
  }
  if (score >= 60) {
    return "Environmental conditions are suitable for outdoor activities. Sensitive individuals should take basic precautions."
  }
  if (score >= 40) {
    return "Environmental conditions are moderate. Members of sensitive groups (children, elderly, asthma/heart condition patients) should limit outdoor activities."
  }
  if (score >= 20) {
    return "Environmental conditions are unhealthy. Everyone should limit outdoor activities. Sensitive groups should avoid extended outdoor exposure."
  }
  return "Environmental conditions are very unhealthy. All individuals should avoid outdoor activities and stay indoors."
}

function getHealthTips(score: number, data: EnvironmentalData): string[] {
  const tips: string[] = []

  if (score >= 80) {
    tips.push("Excellent day for outdoor activities, sports, and recreation")
    tips.push("No special precautions needed for any outdoor activities")
    tips.push("Enjoy outdoor time with family and friends")
  } else if (score >= 60) {
    tips.push("Safe for outdoor activities overall")
    if (data.aqi && data.aqi > 50) {
      tips.push("Sensitive individuals should consider wearing N95 masks for prolonged outdoor activity")
    }
    if (data.uv && data.uv > 5) {
      tips.push("Apply high SPF sunscreen (SPF 50+) due to elevated UV levels")
    }
    tips.push("Take breaks during outdoor activities and stay hydrated")
  } else if (score >= 40) {
    tips.push("Members of sensitive groups should limit outdoor activities")
    if (data.aqi && data.aqi > 100) {
      tips.push(
        "Individuals with asthma, heart conditions, or respiratory issues should wear N95 masks or avoid outdoor activity"
      )
    }
    if (data.uv && data.uv > 7) {
      tips.push("Use protective clothing and reapply sunscreen frequently if going outdoors")
    }
    tips.push("Children and elderly should limit outdoor exposure")
    tips.push("Drink plenty of water if spending time outdoors")
  } else if (score >= 20) {
    tips.push("Everyone should limit outdoor activities")
    if (data.aqi && data.aqi > 150) {
      tips.push(
        "Wear N95 masks if you must go outside. Consider using air purifiers indoors."
      )
    }
    tips.push("Sensitive groups should remain indoors")
    tips.push("If outdoors is unavoidable, limit physical exertion")
    tips.push("Keep car windows closed while driving; use recirculated air")
  } else {
    tips.push("Avoid all outdoor activities")
    tips.push("Remain indoors with windows and doors closed")
    tips.push("Use air purifiers or ensure good air circulation indoors")
    tips.push("Wear N95 masks if you must venture outside")
    tips.push("Seek medical attention if experiencing respiratory distress")
  }

  return tips
}

function getRiskGroups(score: number, data: EnvironmentalData): string[] {
  const groups: string[] = []

  if (score < 80) {
    groups.push("Children and elderly populations")
  }

  if (score < 60 && data.aqi && data.aqi > 50) {
    groups.push("Individuals with asthma or respiratory conditions")
    groups.push("People with heart disease")
    groups.push("Individuals with diabetes")
  }

  if (score < 60 && data.uv && data.uv > 6) {
    groups.push("Fair-skinned individuals")
    groups.push("People with sun sensitivity or photosensitive conditions")
  }

  if (score < 40) {
    groups.push("Athletes and outdoor workers")
    groups.push("Pregnant women")
  }

  return groups.length > 0
    ? groups
    : ["All groups can engage in normal outdoor activities"]
}

export function getAqiCategory(aqi: number | null): string {
  if (aqi === null) return "Unknown"
  if (aqi <= 50) return "Good"
  if (aqi <= 100) return "Moderate"
  if (aqi <= 150) return "Unhealthy for Sensitive Groups"
  if (aqi <= 200) return "Unhealthy"
  if (aqi <= 300) return "Very Unhealthy"
  return "Hazardous"
}

export function getUvCategory(uv: number | null): string {
  if (uv === null) return "Unknown"
  if (uv <= 2.9) return "Low"
  if (uv <= 5.9) return "Moderate"
  if (uv <= 7.9) return "High"
  if (uv <= 10.9) return "Very High"
  return "Extreme"
}
