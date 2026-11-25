import { ChevronLeft } from '@styled-icons/fa-solid/ChevronLeft'
import { Star as EmptyStar } from '@styled-icons/fa-regular/Star'
import { Star } from '@styled-icons/fa-solid/Star'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useIntl } from 'react-intl'
import styled from 'styled-components'

import { FavoritePlace, MAX_FAVORITES, SearchFavoritesContext } from '../../context/search-favorites-context'
import SearchFavoriteEditor from './search-favorite-editor'

const Panel = styled.section`
  padding: 16px;
  font-family: 'Source Sans 3', 'Source Sans Pro', sans-serif;

  header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e1e2e4;
  }

  h2 {
    margin: 0;
    font-size: 24px;
    line-height: 28px;
    font-weight: 600;
  }

  ul {
    margin: 0 0 16px;
    padding: 0;
    list-style: none;
  }

  li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 8px;
    align-items: start;
    margin-bottom: 8px;
    padding: 8px;
    border: 1px solid #e1e2e4;
    border-radius: 4px;
    overflow-wrap: anywhere;
  }

  p {
    margin: 0;
  }

  button:focus-visible {
    outline: 2px solid #4e702d;
    outline-offset: 2px;
  }
`

const Back = styled.button`
  width: 40px;
  height: 40px;
  border: 1px solid #e1e2e4;
  border-radius: 4px;
  background: #fff;
`

const Unstar = styled.button`
  padding: 0 4px;
  border: 0;
  background: transparent;
  color: #e5a500;
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  grid-column: 2;

  button {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    border: 0;
    background: transparent;
    color: #4e702d;
    text-decoration: underline;
  }

`

const Add = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 8px;
  border: 1px solid #000;
  border-radius: 4px;
  background: #fff;
  color: #000;

  &:disabled {
    border-color: #e1e2e4;
    color: #666;
  }
`

export default function SearchFavoritesPanel({ onBack, onClose }: {
  onBack: () => void
  onClose: () => void
}) {
  const intl = useIntl()
  const favorites = useContext(SearchFavoritesContext)
  const back = useRef<HTMLButtonElement>(null)
  const [editor, setEditor] = useState<FavoritePlace | 'add' | null>(null)

  useEffect(() => {
    back.current?.focus()
  }, [editor])

  const message = (key: string) => intl.formatMessage({ id: `components.SearchFavorites.${key}` })

  if (editor && favorites) {
    return (
      <SearchFavoriteEditor
        place={editor === 'add' ? undefined : editor}
        onBack={() => setEditor(null)}
        onClose={onClose}
        onSave={(place, previousKey) => {
          const saved = favorites.saveFavorite(place, previousKey)
          if (saved === 'saved') setEditor(null)
          return saved
        }}
      />
    )
  }

  const limitReached = (favorites?.favorites.length ?? 0) >= MAX_FAVORITES

  return (
    <Panel id="app-menu" aria-labelledby="search-favorites-title">
      <header>
        <Back ref={back} type="button" aria-label={message('back')} onClick={onBack}>
          <ChevronLeft size={16} aria-hidden="true" />
        </Back>
        <h2 id="search-favorites-title">{message('title')}</h2>
      </header>
      {favorites?.favorites.length ? (
        <ul>
          {favorites.favorites.map((place) => {
            const remove = () => {
              favorites.removeFavorite(place.key)
              back.current?.focus()
            }
            const removeLabel = intl.formatMessage(
              { id: 'components.SearchFavorites.removePlace' },
              { name: place.name }
            )

            return (
              <li key={place.key}>
                <Unstar type="button" aria-label={removeLabel} onClick={remove}>
                  <Star size={16} aria-hidden="true" />
                </Unstar>
                <div>
                  <strong>{place.name}</strong>
                  {place.address && <p>{place.address}</p>}
                </div>
                <Actions>
                  <button type="button" aria-label={removeLabel} onClick={remove}>
                    {message('remove')}
                  </button>
                  <button type="button" onClick={() => setEditor(place)}>{message('edit')}</button>
                </Actions>
              </li>
            )
          })}
        </ul>
      ) : (
        <p>{message('empty')}</p>
      )}
      {limitReached && <p>{message('limit')}</p>}
      <Add type="button" disabled={limitReached} onClick={() => setEditor('add')}>
        <EmptyStar size={16} aria-hidden="true" />
        {message('add')}
      </Add>
    </Panel>
  )
}
