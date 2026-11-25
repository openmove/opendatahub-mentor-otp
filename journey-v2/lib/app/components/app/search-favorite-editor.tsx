import getGeocoder from '@opentripplanner/geocoder'
import { ChevronLeft, MapMarkerAlt, Times } from '@styled-icons/fa-solid'
import { Star } from '@styled-icons/fa-regular/Star'
import React, { useEffect, useRef, useState } from 'react'
import { useIntl } from 'react-intl'
import { useSelector } from 'react-redux'
import styled from 'styled-components'

import {
  FavoritePlace,
  favoriteFromSearchFeature,
  SaveFavoriteResult,
  SearchFeature
} from '../../context/search-favorites-context'

const Editor = styled.form`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 100%;
  padding: 16px;
  font-family: 'Source Sans 3', 'Source Sans Pro', sans-serif;

  header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 0 -16px 8px;
    padding: 0 16px 16px;
    border-bottom: 1px solid #e1e2e4;
  }

  h2 {
    flex: 1;
    margin: 0;
    font-size: 24px;
    line-height: 28px;
    font-weight: 600;
  }

  header button {
    width: 44px;
    height: 44px;
    border: 1px solid #e1e2e4;
    border-radius: 4px;
    background: #fff;
  }

  label {
    display: flex;
    align-items: center;
    gap: 16px;
    min-height: 44px;
    margin: 0;
    border-bottom: 1px solid #e1e2e4;
  }

  input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    font-weight: 400;
  }

  button:focus-visible,
  input:focus-visible {
    outline: 2px solid #4e702d;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    border: 1px solid #e1e2e4;
  }

  li button {
    width: 100%;
    padding: 8px;
    border: 0;
    background: #fff;
    text-align: left;
  }

  li button:hover,
  li button:focus-visible {
    background: #ebf0e8;
  }
`

const CurrentLocation = styled.button`
  align-self: flex-start;
  margin: 8px 0 16px;
  padding: 0;
  border: 0;
  color: #4e702d;
  background: transparent;
  text-decoration: underline;
`

const Submit = styled.button`
  min-height: 48px;
  margin-top: auto;
  border: 0;
  border-radius: 4px;
  background: #000;
  color: #fff;

  &:disabled {
    background: #393939;
  }
`

type Props = {
  place?: FavoritePlace
  onBack: () => void
  onClose: () => void
  onSave: (place: FavoritePlace, previousKey?: string) => SaveFavoriteResult
}

export default function SearchFavoriteEditor({ place, onBack, onClose, onSave }: Props) {
  const intl = useIntl()
  const geocoderConfig = useSelector((state: any) => state.otp.config.geocoder)
  const [name, setName] = useState(place?.name ?? '')
  const [location, setLocation] = useState(place)
  const [address, setAddress] = useState(place?.address ?? place?.name ?? '')
  const [results, setResults] = useState<FavoritePlace[]>([])
  const [locationPending, setLocationPending] = useState(false)
  const [error, setError] = useState('')
  const back = useRef<HTMLButtonElement>(null)
  const message = (key: string) => intl.formatMessage({ id: `components.SearchFavorites.${key}` })

  useEffect(() => {
    back.current?.focus()
  }, [])

  useEffect(() => {
    const text = address.trim()
    if (location || text.length < 2 || !geocoderConfig) return
    const request = new AbortController()
    const timeout = window.setTimeout(async () => {
      try {
        const { features = [] } = await getGeocoder(geocoderConfig)
          .autocomplete({ text, options: { signal: request.signal } })
        if (!request.signal.aborted) {
          const matches = (features as SearchFeature[]).flatMap((feature) => {
            const title = feature.properties.name || feature.properties.label
            const result = title && favoriteFromSearchFeature(feature, title)
            return result ? [result] : []
          })
          setResults(matches)
        }
      } catch {
        if (!request.signal.aborted) setError('searchError')
      }
    }, 250)

    return () => {
      window.clearTimeout(timeout)
      request.abort()
    }
  }, [address, geocoderConfig, location])

  function select(result: FavoritePlace) {
    setLocation(result)
    setAddress(result.address || result.name)
    setResults([])
    setError('')
    setName((current) => current || result.name)
  }

  function useCurrentLocation() {
    setError('')
    if (!navigator.geolocation) {
      setError('locationError')
      return
    }
    setResults([])
    setLocationPending(true)
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const { longitude, latitude } = coords
      const coordinates: [number, number] = [longitude, latitude]
      let label = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
      try {
        const result = await getGeocoder(geocoderConfig).reverse({ point: coords })
        label = result.name || label
      } catch {
        // Coordinates can still be saved when reverse geocoding is unavailable.
      }
      select({ key: JSON.stringify(['current-location', coordinates]), address: label, name: label, coordinates })
      setLocationPending(false)
    }, () => {
      setError('locationError')
      setLocationPending(false)
    }, { timeout: 10000 })
  }

  return (
    <Editor id="app-menu" aria-labelledby="favorite-editor-title" onSubmit={(event) => {
      event.preventDefault()
      if (location && name.trim()) {
        const result = onSave({ ...location, name: name.trim() }, place?.key)
        if (result !== 'saved') setError(result)
      }
    }}>
      <header>
        <button ref={back} type="button" aria-label={message('backToFavorites')} onClick={onBack}>
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h2 id="favorite-editor-title">{message(place ? 'edit' : 'addTitle')}</h2>
        <button type="button" aria-label={message('close')} onClick={onClose}>
          <Times size={22} aria-hidden="true" />
        </button>
      </header>
      <label>
        <Star size={24} aria-hidden="true" />
        <input aria-label={message('name')} placeholder={message('name')} value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        <MapMarkerAlt size={24} aria-hidden="true" />
        <input aria-label={message('address')} placeholder={message('address')} value={address} disabled={locationPending} onChange={(event) => {
          setAddress(event.target.value)
          setLocation(undefined)
          setResults([])
          setError('')
        }} />
      </label>
      {results.length > 0 && (
        <ul aria-label={message('address')}>
          {results.map((result, index) => (
            <li key={`${result.key}-${index}`}>
              <button type="button" disabled={locationPending} onClick={() => select(result)}>
                {result.address || result.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <CurrentLocation type="button" disabled={locationPending} onClick={useCurrentLocation}>
        {message('currentLocation')}
      </CurrentLocation>
      {error && <p role="alert">{message(error)}</p>}
      <Submit type="submit" disabled={!location || !name.trim() || locationPending}>{message('confirm')}</Submit>
    </Editor>
  )
}
