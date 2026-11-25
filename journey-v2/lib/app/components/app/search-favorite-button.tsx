import { Star as EmptyStar } from '@styled-icons/fa-regular/Star'
import { Star as FilledStar } from '@styled-icons/fa-solid/Star'
import React, { useContext } from 'react'
import { useIntl } from 'react-intl'
import styled from 'styled-components'

import { SearchFavoritesContext } from '../../context/search-favorites-context'

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

  &:focus-visible {
    outline: 2px solid #4e702d;
    outline-offset: -2px;
  }
`

type SearchFeature = {
  geometry?: { type: string; coordinates: [number, number] }
  properties: {
    gid?: string
    id?: string | number
    label?: string
    layer?: string
    source?: string
  }
}

export default function SearchFavoriteButton({ feature, title }: {
  feature: SearchFeature
  title: string
}) {
  const favorites = useContext(SearchFavoritesContext)
  const intl = useIntl()
  const { gid, id, label, layer, source } = feature.properties
  const coordinates = feature.geometry?.type === 'Point' ? feature.geometry.coordinates : undefined
  const key = gid
    ? JSON.stringify([gid])
    : JSON.stringify([source, layer, id ?? [coordinates, label ?? title]])

  if (!favorites || (!gid && id == null && !coordinates)) return null

  const saved = favorites.favorites.some((place) => place.key === key)
  const Icon = saved ? FilledStar : EmptyStar

  return (
    <FavoriteButton
      type="button"
      data-location-option-action
      aria-pressed={saved}
      aria-label={intl.formatMessage({
        id: 'components.SearchFavorites.toggle',
        defaultMessage: 'Save {name} as a favorite'
      }, { name: title })}
      onClick={() => favorites.toggleFavorite({ key, name: title, address: label, coordinates })}
    >
      <Icon size={16} aria-hidden="true" />
    </FavoriteButton>
  )
}
