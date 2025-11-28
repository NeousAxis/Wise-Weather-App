export interface WeatherData {
    current: {
        temperature: number;
        windSpeed: number;
        humidity: number;
        weatherCode: number;
        isDay: boolean;
        precipitation: number;
    };
    daily: {
        temperatureMax: number;
        temperatureMin: number;
        sunrise: string;
        sunset: string;
    };
    hourly: {
        time: string[];
        temperature: number[];
        weatherCode: number[];
        precipitationProbability: number[];
    };
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
    const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        current: 'temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m,precipitation',
        hourly: 'temperature_2m,weather_code,precipitation_probability',
        daily: 'temperature_2m_max,temperature_2m_min,sunrise,sunset',
        timezone: 'auto',
        forecast_days: '1',
        models: 'best_match'
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);

    if (!response.ok) {
        throw new Error('Failed to fetch weather data');
    }

    const data = await response.json();

    return {
        current: {
            temperature: data.current.temperature_2m,
            windSpeed: data.current.wind_speed_10m,
            humidity: data.current.relative_humidity_2m,
            weatherCode: data.current.weather_code,
            isDay: data.current.is_day === 1,
            precipitation: data.current.precipitation,
        },
        daily: {
            temperatureMax: data.daily.temperature_2m_max[0],
            temperatureMin: data.daily.temperature_2m_min[0],
            sunrise: data.daily.sunrise[0],
            sunset: data.daily.sunset[0],
        },
        hourly: {
            time: data.hourly.time,
            temperature: data.hourly.temperature_2m,
            weatherCode: data.hourly.weather_code,
            precipitationProbability: data.hourly.precipitation_probability,
        },
    };
}

export const weatherCodeToIcon = (code: number, isDay: boolean = true) => {
    // Simple mapping, can be expanded
    if (code === 0) return isDay ? 'Sun' : 'Moon';
    if (code >= 1 && code <= 3) return isDay ? 'CloudSun' : 'CloudMoon';
    if (code >= 45 && code <= 48) return 'CloudFog';
    if (code >= 51 && code <= 67) return 'CloudRain';
    if (code >= 71 && code <= 77) return 'CloudSnow';
    if (code >= 80 && code <= 82) return 'CloudRain';
    if (code >= 95 && code <= 99) return 'CloudLightning';
    return 'Cloud';
};
