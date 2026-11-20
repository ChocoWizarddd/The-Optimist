import { useCallback, useEffect, useMemo, useState } from 'react';
import { getLocale, translateText as tx } from '../utils/i18n';
import {
  Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow,
  CloudSun, Droplets, LocateFixed, MapPin, RefreshCw, Search, Sunrise,
  Sunset, Thermometer, Wind,
} from 'lucide-react';

const DEFAULT_LOCATION = {
  id: 'new-delhi-india', name: 'New Delhi', admin1: 'Delhi', country: 'India',
  latitude: 28.6139, longitude: 77.209,
};

function weatherLabel(code) {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if ([45, 48].includes(code)) return 'Fog';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Weather conditions';
}

function WeatherIcon({ code, size = 24 }) {
  const common = { size, strokeWidth: 1.7 };
  if (code === 0 || code === 1 || code === 2) return <CloudSun {...common} />;
  if ([45, 48].includes(code)) return <CloudFog {...common} />;
  if ([51, 53, 55, 56, 57].includes(code)) return <CloudDrizzle {...common} />;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return <CloudRain {...common} />;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow {...common} />;
  if ([95, 96, 99].includes(code)) return <CloudLightning {...common} />;
  return <Cloud {...common} />;
}

function formatDay(date, options = { weekday: 'short', day: 'numeric', month: 'short' }, language = 'en') {
  return new Intl.DateTimeFormat(getLocale(language), { ...options, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}

function formatHour(localDateTime) {
  const hour = Number(localDateTime.slice(11, 13));
  return `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;
}

function formatClock(localDateTime) {
  const hour = Number(localDateTime.slice(11, 13));
  const minute = localDateTime.slice(14, 16);
  return `${hour % 12 || 12}:${minute} ${hour < 12 ? 'AM' : 'PM'}`;
}

function getLocationName(location) {
  return [location.name, location.admin1, location.country]
    .filter((value, index, all) => value && all.indexOf(value) === index)
    .join(', ');
}

export default function WeatherPage({ language = 'en' }) {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  const loadWeather = useCallback(async (place, quiet = false, signal) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const params = new URLSearchParams({
        latitude: String(place.latitude),
        longitude: String(place.longitude),
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
        hourly: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_probability_max,precipitation_sum,wind_speed_10m_max',
        forecast_days: '7',
        timezone: 'auto',
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
      if (!response.ok) throw new Error(`Forecast service returned ${response.status}. Please try again.`);
      const body = await response.json();
      if (!body.current || !body.daily || !body.hourly) throw new Error('The forecast service returned incomplete weather data.');
      setWeather(body);
      setSelectedDate((previous) => body.daily.time.includes(previous) ? previous : body.daily.time[0]);
      setUpdatedAt(new Date());
    } catch (cause) {
      if (cause.name !== 'AbortError') setError(cause.message || 'Weather could not be loaded. Check your connection and try again.');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadWeather(location, false, controller.signal);
    return () => controller.abort();
  }, [location, loadWeather]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setMatches([]);
      setSearching(false);
      setSearchError('');
      return undefined;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError('');
      try {
        const params = new URLSearchParams({ name: term, count: '10', language: 'en', format: 'json' });
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Location search is temporarily unavailable.');
        const body = await response.json();
        setMatches((body.results || []).map((item) => ({
          id: item.id,
          name: item.name,
          admin1: item.admin1,
          country: item.country,
          latitude: item.latitude,
          longitude: item.longitude,
        })));
      } catch (cause) {
        if (cause.name !== 'AbortError') setSearchError(cause.message || 'Could not search locations.');
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const selectedDayIndex = weather?.daily.time.indexOf(selectedDate) ?? -1;
  const hourlyRows = useMemo(() => {
    if (!weather || !selectedDate) return [];
    return weather.hourly.time.reduce((rows, time, index) => {
      if (time.slice(0, 10) === selectedDate) rows.push({
        time,
        temperature: weather.hourly.temperature_2m[index],
        feelsLike: weather.hourly.apparent_temperature[index],
        humidity: weather.hourly.relative_humidity_2m[index],
        rainChance: weather.hourly.precipitation_probability[index],
        rain: weather.hourly.precipitation[index],
        code: weather.hourly.weather_code[index],
        wind: weather.hourly.wind_speed_10m[index],
        windDirection: weather.hourly.wind_direction_10m[index],
        uv: weather.hourly.uv_index[index],
      });
      return rows;
    }, []);
  }, [weather, selectedDate]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Location access is not available in this browser. Search for a city instead.');
      return;
    }
    setError('');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setWeather(null);
      setLocation({
        id: `coordinates-${coords.latitude.toFixed(2)}-${coords.longitude.toFixed(2)}`,
        name: 'My location',
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      setQuery('');
      setMatches([]);
    }, (cause) => {
      setError(cause.code === 1 ? 'Location permission was denied. Search for a city instead.' : 'Your location could not be determined. Search for a city instead.');
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  };

  const chooseLocation = (place) => {
    setWeather(null);
    setLocation(place);
    setQuery('');
    setMatches([]);
    setSearchError('');
  };

  const current = weather?.current;
  const daily = weather?.daily;
  const activeDay = selectedDayIndex >= 0 && daily ? selectedDayIndex : 0;

  return (
    <div className="weather-page" data-reveal="up">
      <div className="weather-toolbar panel">
        <div className="weather-search-wrap">
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tx('Search any city, region or country', language)}
            aria-label={tx('Search weather by city, region, or country', language)}
            autoComplete="off"
          />
          {searching && <span className="weather-search-status">{tx('Searching', language).toUpperCase()}</span>}
          {query.trim().length >= 2 && !searching && (
            <div className="weather-search-results" role="listbox" aria-label={tx('Location search results', language)}>
              {matches.map((place) => (
                <button key={`${place.id}-${place.latitude}`} onClick={() => chooseLocation(place)} role="option" aria-selected="false">
                  <MapPin size={15} />
                  <span><b>{place.name}</b><small>{[place.admin1, place.country].filter(Boolean).join(', ')}</small></span>
                </button>
              ))}
              {!matches.length && <p>{searchError || tx('No matching places found. Try a longer city or region name.', language)}</p>}
            </div>
          )}
        </div>
        <div className="weather-toolbar-actions">
          <button className="weather-tool-btn" onClick={useMyLocation}><LocateFixed size={15} /> <span>{tx('My location', language)}</span></button>
          <button className="weather-tool-btn" onClick={() => loadWeather(location, true)} disabled={refreshing || loading} aria-label={tx('Refresh forecast', language)} title={tx('Refresh forecast', language)}>
            <RefreshCw size={15} className={refreshing ? 'weather-spin' : ''} /> <span>{tx('Refresh', language)}</span>
          </button>
        </div>
      </div>

      {searchError && !matches.length && query.trim().length >= 2 && <div className="weather-inline-error">{searchError}</div>}
      {error && <div className="weather-error"><b>{tx('Weather unavailable', language).toUpperCase()}</b><span>{error}</span><button className="small-btn" onClick={() => loadWeather(location)}>{tx('Try again', language)}</button></div>}

      {loading && !weather ? (
        <div className="weather-loading panel" role="status"><span className="weather-loader" /><div><b>{tx('Loading forecast', language)}</b><small>{tx('Fetching current conditions and seven-day outlook for', language)} {getLocationName(location)}.</small></div></div>
      ) : weather && current && daily ? (
        <>
          <section className="weather-current panel">
            <div className="weather-current-main">
              <div className="weather-location"><MapPin size={15} /><span>{getLocationName(location)}</span><i>{tx('local time', language).toUpperCase()} · {weather.timezone_abbreviation || weather.timezone}</i></div>
              <div className="weather-current-reading">
                <WeatherIcon code={current.weather_code} size={48} />
                <b>{Math.round(current.temperature_2m)}°</b>
                <div><strong>{tx(weatherLabel(current.weather_code), language)}</strong><span>{tx('Feels like', language)} {Math.round(current.apparent_temperature)}°C</span></div>
              </div>
              <small className="weather-observed">{tx('Observed', language)} {formatClock(current.time)} {tx('local time', language)} · {tx('Forecast refreshed', language)} {updatedAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
            </div>
            <div className="weather-current-stats">
              <div><Droplets size={16} /><small>{tx('Humidity', language).toUpperCase()}</small><b>{current.relative_humidity_2m}%</b></div>
              <div><Wind size={16} /><small>{tx('Wind', language).toUpperCase()}</small><b>{Math.round(current.wind_speed_10m)} km/h</b></div>
              <div><CloudRain size={16} /><small>{tx('Precipitation', language).toUpperCase()}</small><b>{Number(current.precipitation).toFixed(1)} mm</b></div>
              <div><Thermometer size={16} /><small>{tx('Coordinates', language).toUpperCase()}</small><b>{location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°</b></div>
            </div>
          </section>

          <div className="weather-section-title"><div><span>{tx('7 day outlook', language).toUpperCase()}</span><b>{tx('Daily forecast', language)}</b></div><small>{tx('Tap a day to inspect its hourly details', language)}</small></div>
          <section className="weather-days" aria-label={tx('Seven day forecast', language)}>
            {daily.time.map((date, index) => (
              <button key={date} className={`weather-day panel ${date === selectedDate ? 'weather-day--active' : ''}`} onClick={() => setSelectedDate(date)} aria-pressed={date === selectedDate}>
                <b>{index === 0 ? tx('Today', language) : formatDay(date, { weekday: 'short' }, language)}</b>
                <small>{formatDay(date, { day: 'numeric', month: 'short' }, language)}</small>
                <WeatherIcon code={daily.weather_code[index]} size={24} />
                <span>{tx(weatherLabel(daily.weather_code[index]), language)}</span>
                <div className="weather-day-temps"><strong>{Math.round(daily.temperature_2m_max[index])}°</strong><i>{Math.round(daily.temperature_2m_min[index])}°</i></div>
                <small className="weather-day-rain"><CloudRain size={12} /> {daily.precipitation_probability_max[index] ?? 0}%</small>
              </button>
            ))}
          </section>

          <section className="weather-detail panel">
            <div className="weather-detail-head">
              <div><span>{tx('Hourly conditions', language).toUpperCase()}</span><h3>{formatDay(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' }, language)}</h3></div>
              <div className="weather-sun-times">
                <span><Sunrise size={15} /> {tx('Sunrise', language)} <b>{formatClock(daily.sunrise[activeDay])}</b></span>
                <span><Sunset size={15} /> {tx('Sunset', language)} <b>{formatClock(daily.sunset[activeDay])}</b></span>
              </div>
            </div>
            <div className="weather-hourly-scroll" aria-label={tx('Hourly forecast for selected day', language)}>
              {hourlyRows.map((hour) => (
                <article className="weather-hour" key={hour.time}>
                  <b>{formatHour(hour.time)}</b>
                  <WeatherIcon code={hour.code} size={21} />
                  <strong>{Math.round(hour.temperature)}°</strong>
                  <small>{tx('Feels like', language)} {Math.round(hour.feelsLike)}°</small>
                  <span><Droplets size={12} />{hour.rainChance ?? 0}%</span>
                  <span><Wind size={12} />{Math.round(hour.wind)} km/h</span>
                  <small>RH {hour.humidity}% · UV {Math.round(hour.uv ?? 0)}</small>
                </article>
              ))}
            </div>
            {!hourlyRows.length && <p className="weather-empty">{tx('Hourly details are not available for this date.', language)}</p>}
          </section>
          <div className="weather-attribution">Weather forecast and location search by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · Times are local to the selected location · Forecast values are model estimates.</div>
        </>
      ) : null}
    </div>
  );
}
