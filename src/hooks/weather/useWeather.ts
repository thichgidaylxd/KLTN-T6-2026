import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { WeatherData, UseWeatherState } from "../../types/weather";
import { fetchWeather } from "../../services/weather/weatherService";

const DEFAULT_LAT = 16.0678;
const DEFAULT_LON = 108.2208;

const DEFAULT_WEATHER_DATA: WeatherData = {
  temp: 30,
  tempMin: 27,
  tempMax: 31,
  humidity: 62,
  windSpeed: 5,
  description: "Có mây (Partly Cloudy)",
  isRainy: false,
  isHighHumidity: false,
  icon: "01d",
  name: "Đà Nẵng",
  condition: "clouds"
};

export const useWeather = (enabled: boolean = true): UseWeatherState => {
  const weatherQuery = useQuery({
    queryKey: ["weather", "current-location"],
    queryFn: async () => {
      const getPosition = () =>
        new Promise<{ lat: number; lon: number }>((resolve) => {
          if (!navigator.geolocation) {
            resolve({ lat: DEFAULT_LAT, lon: DEFAULT_LON });
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) =>
              resolve({
                lat: position.coords.latitude,
                lon: position.coords.longitude,
              }),
            () => resolve({ lat: DEFAULT_LAT, lon: DEFAULT_LON }),
            { timeout: 10000, maximumAge: 0 },
          );
        });

      const { lat, lon } = await getPosition();
      const data = await fetchWeather(lat, lon);

      const normalized: WeatherData = {
        ...data,
        tempMin: data.tempMin ?? DEFAULT_WEATHER_DATA.tempMin,
        tempMax: data.tempMax ?? DEFAULT_WEATHER_DATA.tempMax,
      };

      return normalized;
    },
    enabled,
    staleTime: 0, // Luôn gọi API mới
    gcTime: 0,
    retry: 0,
  });

  const refetch = useCallback(() => {
    void weatherQuery.refetch();
  }, [weatherQuery]);

  return {
    data: weatherQuery.data ?? DEFAULT_WEATHER_DATA,
    loading: weatherQuery.isLoading || weatherQuery.isFetching,
    error: weatherQuery.error instanceof Error ? weatherQuery.error.message : null,
    refetch,
  };
};

export default useWeather;
