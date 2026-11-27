// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: MIT

import coreUtils from '@opentripplanner/core-utils'
import { SortAmountDown, Taxi } from '@styled-icons/fa-solid'
import { useIntl } from 'react-intl'
import { useDispatch, useSelector } from 'react-redux'
import React, { useEffect, useState } from 'react'

import { clearActiveSearch } from '@otp-react-redux/lib/actions/form'
import {
  setActiveItinerary,
  setActiveLeg
} from '@otp-react-redux/lib/actions/narrative'
import { showMobileSearchScreen } from '@otp-react-redux/lib/actions/ui'
import ItineraryBody from '@otp-react-redux/lib/components/narrative/line-itin/connected-itinerary-body'
import FormattedDuration from '@otp-react-redux/lib/components/util/formatted-duration'
import {
  getActiveItineraries,
  getActiveItinerary,
  getActiveSearch,
  sortItineraries
} from '@otp-react-redux/lib/util/state'

import OpenMoveModeIcon from '../../icons/openmove-mode-icon'
import NextFlightSuggestion from './next-flight-suggestion'

const messages = {
  arrival: 'Arrival {time}',
  back: 'Back to search',
  calories: '{count} kcal',
  carbon: 'CO₂ {count} kg',
  departure: 'Departure {time}',
  details: 'Detailed view',
  duration: 'Travel time',
  edit: 'Edit trip',
  leaveNow: 'Leave now',
  modes: 'Filter by transport',
  options: 'Trip options',
  sort: 'Sort routes',
  sortArrival: 'Arrival time',
  sortBest: 'Recommended',
  sortDeparture: 'Departure time',
  sortDuration: 'Travel time',
  stops: '{count, plural, one {# stop} other {# stops}}',
  verify: 'Verify this option'
}

const sortLabels = {
  BEST: 'sortBest',
  DEPARTURETIME: 'sortDeparture',
  ARRIVALTIME: 'sortArrival',
  DURATION: 'sortDuration'
}

function formatResult(intl, name, values) {
  return intl.formatMessage(
    {
      defaultMessage: messages[name],
      id: `components.TripSearchResults.${name}`
    },
    values
  )
}

function getMode(leg) {
  if (leg.rideHailing || leg.mode === 'TAXI' || leg.mode === 'CAR_HAIL')
    return 'taxi'
  return leg.mode?.toLowerCase()
}

function getMainMode(itinerary) {
  const mainLeg = itinerary.legs.reduce((longest, leg) => {
    if (!longest || (leg.duration || 0) > (longest.duration || 0)) return leg
    return longest
  }, null)
  return getMode(mainLeg || {})
}

function getModes(itinerary) {
  const modes = [...new Set(itinerary.legs.map(getMode).filter(Boolean))]
  return modes.length > 1 ? modes.filter((mode) => mode !== 'walk') : modes
}

function ModeIcon({ mode }) {
  return mode === 'taxi' ? (
    <Taxi aria-hidden="true" size={20} />
  ) : (
    <OpenMoveModeIcon aria-hidden="true" height={20} mode={mode} width={20} />
  )
}

function formatCarbon(intl, itinerary, config) {
  const emissions = coreUtils.itinerary.calculateEmissions(
    itinerary,
    config?.carbonIntensity,
    'kilogram'
  )
  return formatResult(intl, 'carbon', {
    count: intl.formatNumber(emissions, { maximumFractionDigits: 1 })
  })
}

export function TripResultsMapSummary() {
  const intl = useIntl()
  const search = useSelector(getActiveSearch)
  const itinerary = useSelector(getActiveItinerary)
  const config = useSelector((state) => state.otp.config.co2)
  if (!itinerary || search?.pending > 0) return null

  return (
    <div className="trip-results-map-summary">
      <ModeIcon mode={getMainMode(itinerary)} />
      <span>
        {formatResult(intl, 'duration')}{' '}
        <FormattedDuration
          duration={itinerary.duration}
          includeSeconds={false}
        />
      </span>
      <span>{formatCarbon(intl, itinerary, config)}</span>
    </div>
  )
}

export default function TripSearchResults({ mobile = false }) {
  const dispatch = useDispatch()
  const intl = useIntl()
  const search = useSelector(getActiveSearch)
  const itineraries = useSelector(getActiveItineraries)
  const config = useSelector((state) => state.otp.config)
  const [filters, setFilters] = useState([])
  const [sort, setSort] = useState('BEST')
  const [detailedIndex, setDetailedIndex] = useState(null)
  const { from, to, date, time, departArrive } = search.query || {}
  const timeZone = config.homeTimezone
  const modes = [...new Set(itineraries.flatMap(getModes))]
  const visible = itineraries.filter(
    (itinerary) =>
      !filters.length ||
      getModes(itinerary).some((mode) => filters.includes(mode))
  )
  visible.sort((a, b) => sortItineraries(sort, 'ASC', a, b, config))
  const selected = visible.find(
    (itinerary) => itinerary.index === search.activeItinerary
  )
  const selectedIndex = selected?.index ?? visible[0]?.index
  const detailed = visible.find(
    (itinerary) => itinerary.index === detailedIndex
  )

  useEffect(() => {
    if (
      selectedIndex !== undefined &&
      selectedIndex !== search.activeItinerary
    ) {
      dispatch(setActiveItinerary({ index: selectedIndex }))
    }
  }, [dispatch, search.activeItinerary, selectedIndex])

  const select = (index) => {
    if (index !== search.activeItinerary) {
      dispatch(setActiveLeg({ index: null, leg: null }))
      dispatch(setActiveItinerary({ index }))
    }
  }
  const closeDetails = () => {
    dispatch(setActiveLeg({ index: null, leg: null }))
    setDetailedIndex(null)
  }
  const edit = () =>
    dispatch(mobile ? showMobileSearchScreen() : clearActiveSearch())
  const text = (id, values) => formatResult(intl, id, values)
  const queryTime = date && time && Date.parse(`${date}T${time}Z`)
  const schedule =
    departArrive !== 'NOW' && Number.isFinite(queryTime)
      ? intl.formatDate(queryTime, {
          day: 'numeric',
          month: 'short',
          timeZone: 'UTC'
        }) +
        ', ' +
        intl.formatTime(queryTime, { timeZone: 'UTC' })
      : text('leaveNow')

  return (
    <section aria-label={text('options')} className="trip-search-results">
      <div className="trip-results-heading">
        <button
          aria-label={text(detailed ? 'options' : 'back')}
          onClick={detailed ? closeDetails : edit}
          type="button"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div>
          <div className="trip-results-route">
            {from?.name} → {to?.name}
          </div>
          <button className="trip-results-edit" onClick={edit} type="button">
            {schedule} <span aria-hidden="true">✎</span>
            <span className="sr-only"> {text('edit')}</span>
          </button>
        </div>
        {!detailed && (
          <label className="trip-results-sort">
            <SortAmountDown aria-hidden="true" size={18} />
            <select
              aria-label={text('sort')}
              onChange={(event) => setSort(event.target.value)}
              value={sort}
            >
              {Object.entries(sortLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {text(label)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {detailed ? (
        <ItineraryBody
          itinerary={detailed}
          setActiveLeg={(index, leg) => dispatch(setActiveLeg({ index, leg }))}
        />
      ) : (
        <>
          <div
            aria-label={text('modes')}
            className="trip-results-modes"
            role="group"
          >
            {modes.map((mode) => {
              const label =
                config.modes?.modeButtons?.find((button) => button.key === mode)
                  ?.label || mode
              return (
                <button
                  aria-pressed={filters.includes(mode)}
                  key={mode}
                  onClick={() =>
                    setFilters((current) =>
                      current.includes(mode)
                        ? current.filter((value) => value !== mode)
                        : [...current, mode]
                    )
                  }
                  type="button"
                >
                  <ModeIcon mode={mode} />
                  {intl.formatMessage({
                    defaultMessage: label,
                    id: `components.ModeSelector.labels.${mode}`
                  })}
                </button>
              )
            })}
          </div>
          <NextFlightSuggestion />
          <ul className="trip-results-list">
            {visible.map((itinerary) => {
              const { index, legs, duration, startTime, endTime } = itinerary
              const stops = legs.reduce(
                (sum, leg) => sum + (leg.intermediateStops?.length || 0),
                0
              )
              const { caloriesBurned } =
                coreUtils.itinerary.calculatePhysicalActivity(itinerary)
              return (
                <li
                  className={
                    index === selectedIndex ? 'is-selected' : undefined
                  }
                  key={index}
                >
                  <button
                    aria-pressed={index === selectedIndex}
                    className="trip-results-option"
                    onClick={() => select(index)}
                    type="button"
                  >
                    <ModeIcon mode={getMainMode(itinerary)} />
                    <span className="trip-results-option-body">
                      <span className="trip-results-option-column">
                        <strong>
                          {text('departure', {
                            time: intl.formatTime(startTime, { timeZone })
                          })}
                        </strong>
                        <strong>
                          {text('arrival', {
                            time: intl.formatTime(endTime, { timeZone })
                          })}
                        </strong>
                        <span>
                          {text('duration')}{' '}
                          <FormattedDuration
                            duration={duration}
                            includeSeconds={false}
                          />
                        </span>
                      </span>
                      <span className="trip-results-option-column">
                        {stops > 0 && (
                          <span>{text('stops', { count: stops })}</span>
                        )}
                        {caloriesBurned > 0 && (
                          <span>
                            {text('calories', {
                              count: Math.round(caloriesBurned)
                            })}
                          </span>
                        )}
                        <span>{formatCarbon(intl, itinerary, config.co2)}</span>
                      </span>
                    </span>
                  </button>
                  <button
                    className="trip-results-details"
                    onClick={() => {
                      select(index)
                      setDetailedIndex(index)
                    }}
                    type="button"
                  >
                    {text('details')}
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="trip-results-footer">
            <button disabled type="button">
              {text('verify')}
            </button>
          </div>
        </>
      )}
    </section>
  )
}
