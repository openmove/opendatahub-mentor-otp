import React, { useContext, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Popup, useMap } from 'react-map-gl'

import PointPopup from '@otp-react-redux/lib/components/map/point-popup'
import type { AppReduxState } from '@otp-react-redux/lib/util/state-types'

import { SearchFavoritesContext } from '../../context/search-favorites-context'

export default function FavoriteMapPopup() {
  const favorites = useContext(SearchFavoritesContext)
  const place = favorites?.mapPlace
  const setMapPlace = favorites?.setMapPlace
  const regularPopup = useSelector((state: AppReduxState) => state.otp.ui.mapPopupLocation)
  const { current: map } = useMap()

  useEffect(() => {
    if (regularPopup && place) setMapPlace?.(null)
  }, [regularPopup, place, setMapPlace])

  useEffect(() => {
    if (!regularPopup && place?.coordinates && map) {
      map.flyTo({ center: place.coordinates, zoom: Math.max(16, map.getZoom()) })
    }
  }, [map, place, regularPopup])

  if (regularPopup || !place?.coordinates) return <PointPopup />

  const [longitude, latitude] = place.coordinates
  return (
    <Popup
      key={place.key}
      longitude={longitude}
      latitude={latitude}
      closeOnClick
      onClose={() => setMapPlace?.(null)}
      maxWidth="260px"
    >
      <div className="poi-popup">
        <strong>{place.name}</strong>
        {place.address && place.address !== place.name && <div>{place.address}</div>}
      </div>
    </Popup>
  )
}
