import React, { createContext, useRef, useState } from 'react'

export type FavoritePlace = {
  key: string
  name: string
  address?: string
  coordinates?: [number, number]
  stopId?: string
}

export type SearchFeature = {
  geometry?: { type: string; coordinates: [number, number] }
  properties: {
    gid?: string
    id?: string | number
    label?: string
    name?: string
    layer?: string
    source?: string
    addendum?: { stop?: { gtfsId?: string } }
  }
}

export function favoriteFromSearchFeature(feature: SearchFeature, title: string): FavoritePlace | null {
  const { addendum, gid, id, label, layer, source } = feature.properties
  const coordinates = feature.geometry?.type === 'Point' ? feature.geometry.coordinates : undefined
  if (!gid && id == null && !coordinates) return null

  const key = gid
    ? JSON.stringify([gid])
    : JSON.stringify([source, layer, id ?? [coordinates, label ?? title]])
  const stopId = layer === 'stops' &&
    (addendum?.stop?.gtfsId || (source === 'otp' && id))
  return { key, name: title, address: label, coordinates, stopId: stopId ? String(stopId) : undefined }
}

const storageKey = 'favoritePlaces'
export const MAX_FAVORITES = 5
export type SaveFavoriteResult = 'saved' | 'duplicate' | 'limit'

function readFavorites(): FavoritePlace[] {
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) || '[]')
    return Array.isArray(saved)
      ? saved.filter((place) => typeof place?.key === 'string')
      : []
  } catch {
    return []
  }
}

export const SearchFavoritesContext = createContext<{
  favorites: FavoritePlace[]
  mapPlace: FavoritePlace | null
  setMapPlace: (place: FavoritePlace | null) => void
  saveFavorite: (place: FavoritePlace, previousKey?: string) => SaveFavoriteResult
  removeFavorite: (key: string) => void
  toggleFavorite: (place: FavoritePlace) => void
} | null>(null)

export function SearchFavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState(readFavorites)
  const [mapPlace, setMapPlace] = useState<FavoritePlace | null>(null)
  const currentFavorites = useRef(favorites)

  function saveFavorites(next: FavoritePlace[]) {
    currentFavorites.current = next
    setFavorites(next)
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      // Keep the current session usable if browser storage is unavailable.
    }
  }

  function removeFavorite(key: string) {
    saveFavorites(currentFavorites.current.filter((place) => place.key !== key))
  }

  function saveFavorite(place: FavoritePlace, previousKey?: string): SaveFavoriteResult {
    const current = currentFavorites.current
    if (current.some(({ key }) => key === place.key && key !== previousKey)) return 'duplicate'
    if (!previousKey && current.length >= MAX_FAVORITES) return 'limit'

    saveFavorites(previousKey
      ? current.map((entry) => entry.key === previousKey ? place : entry)
      : [...current, place])
    return 'saved'
  }

  function toggleFavorite(place: FavoritePlace) {
    if (currentFavorites.current.some(({ key }) => key === place.key)) {
      removeFavorite(place.key)
    } else {
      saveFavorite(place)
    }
  }

  return (
    <SearchFavoritesContext.Provider value={{ favorites, mapPlace, setMapPlace, removeFavorite, saveFavorite, toggleFavorite }}>
      {children}
    </SearchFavoritesContext.Provider>
  )
}
