import { Star as EmptyStar } from '@styled-icons/fa-regular/Star'
import { Star as FilledStar } from '@styled-icons/fa-solid/Star'
import React, { useContext } from 'react'
import { useIntl } from 'react-intl'
import styled from 'styled-components'

import { FavoritePlace, MAX_FAVORITES, SearchFavoritesContext } from '../../context/search-favorites-context'

const FavoriteButton = styled.button`
  align-self: center;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin: 0 4px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #000;

  &[aria-pressed='true'] {
    color: #e5a500;
  }

  &[aria-disabled='true'] {
    color: #666;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid #4e702d;
    outline-offset: -2px;
  }
`

export default function SearchFavoriteButton({ place }: { place: FavoritePlace }) {
  const favorites = useContext(SearchFavoritesContext)
  const intl = useIntl()
  if (!favorites) return null

  const saved = favorites.favorites.some(({ key }) => key === place.key)
  const limitReached = !saved && favorites.favorites.length >= MAX_FAVORITES
  const limitMessage = limitReached
    ? intl.formatMessage({ id: 'components.SearchFavorites.limit' })
    : undefined
  const Icon = saved ? FilledStar : EmptyStar

  return (
    <FavoriteButton
      type="button"
      data-location-option-action
      aria-pressed={saved}
      aria-disabled={limitReached}
      title={limitMessage}
      aria-label={limitMessage ?? intl.formatMessage({
        id: saved ? 'components.SearchFavorites.removePlace' : 'components.SearchFavorites.toggle'
      }, { name: place.name })}
      onClick={() => {
        if (!limitReached) favorites.toggleFavorite(place)
      }}
    >
      <Icon size={16} aria-hidden="true" />
    </FavoriteButton>
  )
}
