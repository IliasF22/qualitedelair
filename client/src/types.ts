export type SensorSnapshot = {
  ts: number;
  airQualityIndex: number;
  airQualityLabel: string;
  temperatureC: number;
  humidityPct: number;
  co2ppm: number;
  pm1: number;
  pm25: number;
  pm10: number;
  source: "mock" | "device";
};
