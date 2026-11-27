// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: MIT

import { getActiveSearch } from '@otp-react-redux/lib/util/state'
import { useIntl } from 'react-intl'
import { useMap } from 'react-map-gl'
import { useSelector } from 'react-redux'
import MobileContainer from '@otp-react-redux/lib/components/mobile/container'
import React, { useEffect, useState } from 'react'
import VendorBatchResultsScreen from '@otp-react-redux/lib/components/mobile/batch-results-screen'

import { ChevronDoubleDown, ChevronDoubleUp } from '../../icons/nav'
import DefaultMap from '../map/default-map'
import TripSearchLoading from '../app/trip-search-loading'

function MobileTripSearchLoading() {
  const [expanded, setExpanded] = useState(true)
  const { default: map } = useMap()
  const intl = useIntl()
  const Chevron = expanded ? ChevronDoubleDown : ChevronDoubleUp

  useEffect(() => {
    map?.resize()
  }, [expanded, map])

  return (
    <MobileContainer>
      <main className="mobile-trip-search-loading">
        <div className="batch-search-map">
          <DefaultMap />
        </div>
        <div className="mobile-trip-search-loading-panel">
          <button
            aria-controls="mobile-trip-search-progress"
            aria-expanded={expanded}
            aria-label={intl.formatMessage({
              defaultMessage: "We're looking for the best options...",
              id: 'components.TripSearchLoading.message'
            })}
            className="panel-chevron"
            onClick={() => setExpanded(!expanded)}
            type="button"
          >
            <Chevron aria-hidden />
          </button>
          <div hidden={!expanded} id="mobile-trip-search-progress">
            <TripSearchLoading />
          </div>
        </div>
      </main>
    </MobileContainer>
  )
}

export default function BatchResultsScreen() {
  const activeSearch = useSelector(getActiveSearch)
  return activeSearch?.pending > 0 ? (
    <MobileTripSearchLoading />
  ) : (
    <VendorBatchResultsScreen />
  )
}
