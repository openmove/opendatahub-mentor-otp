// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: MIT

import {
  getActiveItineraries,
  getActiveSearch
} from '@otp-react-redux/lib/util/state'
import { useIntl } from 'react-intl'
import { useMap } from 'react-map-gl'
import { useSelector } from 'react-redux'
import MobileContainer from '@otp-react-redux/lib/components/mobile/container'
import React, { useEffect, useState } from 'react'
import VendorBatchResultsScreen from '@otp-react-redux/lib/components/mobile/batch-results-screen'

import { ChevronDoubleDown, ChevronDoubleUp } from '../../icons/nav'
import DefaultMap from '../map/default-map'
import TripSearchLoading from '../app/trip-search-loading'
import TripSearchResults, {
  TripResultsMapSummary
} from '../app/trip-search-results'

function MobileTripSearchPanel({
  pending,
  searchId
}: {
  pending: boolean
  searchId: string
}) {
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
          {!pending && <TripResultsMapSummary />}
        </div>
        <div className="mobile-trip-search-loading-panel">
          <button
            aria-controls="mobile-trip-search-progress"
            aria-expanded={expanded}
            aria-label={intl.formatMessage({
              defaultMessage: 'Trip options',
              id: 'components.TripSearchResults.options'
            })}
            className="panel-chevron"
            onClick={() => setExpanded(!expanded)}
            type="button"
          >
            <Chevron aria-hidden />
          </button>
          <div hidden={!expanded} id="mobile-trip-search-progress">
            {pending ? (
              <TripSearchLoading />
            ) : (
              <TripSearchResults key={searchId} mobile />
            )}
          </div>
        </div>
      </main>
    </MobileContainer>
  )
}

export default function BatchResultsScreen() {
  const activeSearch = useSelector(getActiveSearch)
  const itineraries = useSelector(getActiveItineraries)
  const searchId = useSelector((state: any) => state.otp.activeSearchId)
  return activeSearch &&
    (activeSearch.pending > 0 || itineraries.length > 0) ? (
    <MobileTripSearchPanel
      pending={activeSearch.pending > 0}
      searchId={searchId}
    />
  ) : (
    <VendorBatchResultsScreen />
  )
}
