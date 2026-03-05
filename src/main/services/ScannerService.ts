// ============================================================
//  src/main/services/ScannerService.ts
// ============================================================
import { Category, type SearchResult } from '../../shared/types';
import { encodeCuisineUrl }            from '../../shared/cuisineIcons';

function getKeys() {
  const { readKeys } = require('./ConfigStore');
  return readKeys();
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json() as Promise<T>;
}

function tmdbImage(path: string | null | undefined, size = 'w500'): string {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : '';
}

// ------------------------------------------------------------------
// 1. TMDB — Movies
// ------------------------------------------------------------------
async function searchMovies(query: string): Promise<SearchResult[]> {
  const key  = getKeys().tmdbApiKey;
  const isBearer = key.startsWith('eyJ');
  const url  = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&page=1${isBearer ? '' : `&api_key=${key}`}`;
  const data = await fetchJson<{ results: TmdbMovie[] }>(url, {
    headers: isBearer ? { Authorization: `Bearer ${key}` } : {},
  });
  return data.results.slice(0, 20).map((m) => ({
    externalId  : String(m.id),
    category    : Category.Movies,
    title       : m.title,
    heroImageUrl: tmdbImage(m.backdrop_path, 'w1280'),
    thumbnailUrl: tmdbImage(m.poster_path,   'w342'),
    releaseYear : m.release_date ? parseInt(m.release_date.slice(0, 4)) : null,
    rating      : m.vote_average ?? null,
  }));
}
interface TmdbMovie {
  id: number; title: string; backdrop_path: string | null;
  poster_path: string | null; release_date: string; vote_average: number;
}

// ------------------------------------------------------------------
// 2. TMDB — TV
// ------------------------------------------------------------------
async function searchTV(query: string): Promise<SearchResult[]> {
  const key  = getKeys().tmdbApiKey;
  const isBearer = key.startsWith('eyJ');
  const url  = `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}&page=1${isBearer ? '' : `&api_key=${key}`}`;
  const data = await fetchJson<{ results: TmdbTV[] }>(url, {
    headers: isBearer ? { Authorization: `Bearer ${key}` } : {},
  });
  return data.results.slice(0, 20).map((s) => ({
    externalId  : String(s.id),
    category    : Category.TV,
    title       : s.name,
    heroImageUrl: tmdbImage(s.backdrop_path, 'w1280'),
    thumbnailUrl: tmdbImage(s.poster_path,   'w342'),
    releaseYear : s.first_air_date ? parseInt(s.first_air_date.slice(0, 4)) : null,
    rating      : s.vote_average ?? null,
  }));
}
interface TmdbTV {
  id: number; name: string; backdrop_path: string | null;
  poster_path: string | null; first_air_date: string; vote_average: number;
}

// ------------------------------------------------------------------
// 3. AniList — Anime  (GraphQL, no API key required)
// bannerImage        → wide landscape hero (up to 1900×400)
// coverImage.extraLarge → portrait thumbnail (460×650)
// ------------------------------------------------------------------
const ANILIST_QUERY = `
  query ($search: String, $perPage: Int) {
    Page(perPage: $perPage) {
      media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
        id
        title {
          english
          romaji
          native
        }
        bannerImage
        coverImage {
          extraLarge
          large
          color
        }
        startDate {
          year
        }
        averageScore
        meanScore
        status
        episodes
        genres
      }
    }
  }
`;

async function searchAnime(query: string): Promise<SearchResult[]> {
  const res = await fetch('https://graphql.anilist.co', {
    method : 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept'      : 'application/json',
    },
    body: JSON.stringify({
      query    : ANILIST_QUERY,
      variables: { search: query, perPage: 20 },
    }),
  });

  if (!res.ok) throw new Error(`AniList API error ${res.status}`);

  const json = await res.json() as AniListResponse;
  const media = json?.data?.Page?.media ?? [];

  return media.map((a) => {
    // Prefer English title, fall back to romaji, then native
    const title = a.title.english ?? a.title.romaji ?? a.title.native ?? 'Unknown';

    // AniList scores are 0–100, normalise to 0–10
    const rawScore  = a.averageScore ?? a.meanScore ?? null;
    const rating    = rawScore != null ? rawScore / 10 : null;

    // bannerImage is the wide landscape — perfect for HeroItem
    // Falls back to cover if no banner exists
    const heroImageUrl = a.bannerImage ?? a.coverImage.extraLarge ?? a.coverImage.large ?? '';
    const thumbnailUrl = a.coverImage.extraLarge ?? a.coverImage.large ?? '';

    return {
      externalId  : String(a.id),
      category    : Category.Anime,
      title,
      heroImageUrl,
      thumbnailUrl,
      releaseYear : a.startDate?.year ?? null,
      rating,
    };
  });
}

// AniList GraphQL response types
interface AniListResponse {
  data: {
    Page: {
      media: AniListMedia[];
    };
  };
}
interface AniListMedia {
  id          : number;
  title       : {
    english: string | null;
    romaji : string | null;
    native : string | null;
  };
  bannerImage : string | null;
  coverImage  : {
    extraLarge: string | null;
    large     : string | null;
    color     : string | null;
  };
  startDate   : { year: number | null } | null;
  averageScore: number | null;
  meanScore   : number | null;
  status      : string | null;
  episodes    : number | null;
  genres      : string[];
}

// ------------------------------------------------------------------
// 4. IGDB — Games
// cover    → portrait thumbnail (t_cover_big)
// artworks → landscape banner for hero (t_1080p) — falls back to cover
// ------------------------------------------------------------------
async function searchGames(query: string): Promise<SearchResult[]> {
  const { igdbClientId, igdbAccessToken } = getKeys();
  const body = `search "${query}"; fields id,name,cover.url,artworks.url,first_release_date,rating; limit 20;`;

  const data = await fetchJson<IgdbGame[]>('https://api.igdb.com/v4/games', {
    method : 'POST',
    headers: {
      'Client-ID'    : igdbClientId,
      'Authorization': `Bearer ${igdbAccessToken}`,
      'Content-Type' : 'text/plain',
    },
    body,
  });

  return (data ?? []).map((g) => {
    const fixUrl = (u: string, size: string) =>
      u ? `https:${u.replace(/t_\w+/, size)}` : '';

    const coverUrl   = fixUrl(g.cover?.url    ?? '', 't_cover_big');
    // Use first artwork as hero (landscape banner); fall back to cover if none
    const artworkUrl = g.artworks?.[0]?.url
      ? fixUrl(g.artworks[0].url, 't_1080p')
      : coverUrl;

    return {
      externalId  : String(g.id),
      category    : Category.Games,
      title       : g.name,
      heroImageUrl: artworkUrl,   // wide landscape for HeroItem
      thumbnailUrl: coverUrl,     // portrait cover for CompactItem
      releaseYear : g.first_release_date
        ? new Date(g.first_release_date * 1000).getFullYear()
        : null,
      rating      : g.rating != null ? Math.round(g.rating) / 10 : null,
    };
  });
}
interface IgdbGame {
  id                : number;
  name              : string;
  cover            ?: { url: string };
  artworks         ?: { url: string }[];
  first_release_date?: number;
  rating           ?: number;
}

// ------------------------------------------------------------------
// 5. Google Places (New) — Restaurants
// Stores cuisine emoji via encodeCuisineUrl so NO photo API calls
// are needed after the initial search.
// ------------------------------------------------------------------
async function searchRestaurants(query: string): Promise<SearchResult[]> {
  const key = getKeys().googlePlacesKey;
  if (!key) throw new Error('Google Places API key not configured.');

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method : 'POST',
    headers: {
      'Content-Type'    : 'application/json',
      'X-Goog-Api-Key'  : key,
      // Only request fields we actually use — minimises billing
      'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.types',
    },
    body: JSON.stringify({
      textQuery     : query,
      languageCode  : 'en',
      maxResultCount: 20,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Places API ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json() as PlacesNewResponse;

  return (data.places ?? []).map((p) => {
    // Map Google place types → cuisine emoji prefix
    // e.g. ["sushi_restaurant","japanese_restaurant"] → "cuisine:sushi,japanese"
    const aliases = (p.types ?? [])
      .map((t) => t.replace('_restaurant', '').replace('_cafe', ''))
      .filter((t) => !['food', 'point_of_interest', 'establishment', 'store'].includes(t));

    const iconUrl = encodeCuisineUrl(aliases.length ? aliases : ['restaurant']);

    return {
      externalId  : p.id,
      category    : Category.Restaurants,
      title       : p.displayName.text,
      heroImageUrl: iconUrl,   // "cuisine:sushi,japanese"
      thumbnailUrl: iconUrl,
      releaseYear : null,
      rating      : p.rating ?? null,
    };
  });
}
interface PlacesNewResponse { places?: PlaceNew[]; }
interface PlaceNew {
  id         : string;
  displayName: { text: string; languageCode: string };
  rating    ?: number;
  types     ?: string[];
}

// ------------------------------------------------------------------
// PUBLIC ENTRY POINT
// ------------------------------------------------------------------
export async function scan(category: Category, query: string): Promise<SearchResult[]> {
  switch (category) {
    case Category.Movies     : return searchMovies(query);
    case Category.TV         : return searchTV(query);
    case Category.Anime      : return searchAnime(query);
    case Category.Games      : return searchGames(query);
    case Category.Restaurants: return searchRestaurants(query);
    default                  : return [];
  }
}