import React, { createContext, useRef, useState } from 'react'

export type FavoritePlace = {
  key: string
  name: string
  address?: string
  coordinates?: [number, number]
}

const storageKey = 'favoritePlaces'

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
  toggleFavorite: (place: FavoritePlace) => void
} | null>(null)

export function SearchFavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState(readFavorites)
  const currentFavorites = useRef(favorites)

  function toggleFavorite(place: FavoritePlace) {
    const current = currentFavorites.current
    const next = current.some(({ key }) => key === place.key)
      ? current.filter(({ key }) => key !== place.key)
      : [...current, place]

    currentFavorites.current = next
    setFavorites(next)
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      // Keep the current session usable if browser storage is unavailable.
    }
  }

  return (
    <SearchFavoritesContext.Provider value={{ favorites, toggleFavorite }}>
      {children}
    </SearchFavoritesContext.Provider>
  )
}
