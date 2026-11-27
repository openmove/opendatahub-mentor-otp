// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: MIT

import copyToClipboard from 'copy-to-clipboard'
import coreUtils from '@opentripplanner/core-utils'
import hash from 'object-hash'
import { useIntl } from 'react-intl'
import React, { useEffect, useRef, useState } from 'react'
import { Download, Redo, ShareAlt, Taxi } from '@styled-icons/fa-solid'

import FormattedDuration from '@otp-react-redux/lib/components/util/formatted-duration'
import AccessLegSteps from '@opentripplanner/itinerary-body/lib/AccessLegBody/access-leg-steps'
import { combineQueryParams } from '@otp-react-redux/lib/util/api'

import OpenMoveModeIcon from '../../icons/openmove-mode-icon'

const labels = {
  book: 'Book via app',
  close: 'Back to options',
  copied: 'Link copied',
  copyFailed: 'Could not copy the link',
  delay: 'Delay +{minutes} min',
  directions: 'Directions',
  download: 'Download PDF',
  go: 'Let’s go together',
  onTime: 'On time',
  option: 'Option',
  restart: 'Restart',
  share: 'Share link',
  stops: 'View stops ({count})',
  tickets: 'Tickets info'
}

export function getTripOptionKey(itinerary) {
  return hash(
    itinerary.legs.map((leg) => ({
      from: leg.from?.stop?.gtfsId || leg.from?.name,
      mode: leg.mode,
      route: leg.route?.gtfsId || leg.route?.shortName,
      start: leg.transitLeg
        ? leg.startTime - (leg.departureDelay || 0) * 1000
        : undefined,
      to: leg.to?.stop?.gtfsId || leg.to?.name
    }))
  )
}

function safeWebUrl(value) {
  if (typeof value !== 'string') return undefined
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined
  } catch {
    return undefined
  }
}

function LegItem({ leg, text, time, intl }) {
  const mode = leg.mode.toLowerCase()
  const isTaxi =
    Boolean(leg.rideHailingEstimate) || ['taxi', 'car_hail'].includes(mode)
  const line = [
    leg.route?.shortName,
    leg.route?.shortName ? null : leg.route?.longName
  ].find((name) => name && name !== 'undefined')
  const minutes = Math.ceil((leg.departureDelay || 0) / 60)
  const booking = safeWebUrl(
    leg.pickupBookingInfo?.bookingUrl || leg.dropOffBookingInfo?.bookingUrl
  )
  const tickets = safeWebUrl(leg.ticketUrl || leg.route?.ticketUrl)
  const stops = leg.intermediateStops || []

  return (
    <li className="trip-detail-leg">
      <div className="trip-detail-leg-time">
        {time(leg.startTime)} – {time(leg.endTime)}
      </div>
      <strong>{leg.from?.name}</strong>
      <div className="trip-detail-service">
        {isTaxi ? (
          <Taxi aria-hidden="true" size={16} />
        ) : (
          <OpenMoveModeIcon
            aria-hidden="true"
            height={16}
            mode={mode}
            width={16}
          />
        )}
        <span>
          {intl.formatMessage({
            defaultMessage: isTaxi ? 'Taxi' : leg.mode,
            id: `common.modes.${
              isTaxi ? 'taxi' : mode === 'bicycle' ? 'bike' : mode
            }`
          })}
          {line && ` · ${line}`}
        </span>
      </div>
      {leg.realTime && minutes >= 0 && (
        <span className={minutes ? 'trip-detail-delay' : 'trip-detail-on-time'}>
          {minutes ? text('delay', { minutes }) : text('onTime')}
        </span>
      )}
      {(booking || tickets) && (
        <a href={booking || tickets} rel="noopener noreferrer" target="_blank">
          {text(booking ? 'book' : 'tickets')}
        </a>
      )}
      {leg.steps?.length > 0 && (
        <details>
          <summary>{text('directions')}</summary>
          <AccessLegSteps steps={leg.steps} />
        </details>
      )}
      {stops.length > 0 && (
        <details>
          <summary>{text('stops', { count: stops.length })}</summary>
          <ol>
            {stops.map((stop, index) => (
              <li key={index}>{stop.name}</li>
            ))}
          </ol>
        </details>
      )}
    </li>
  )
}

export default function TripDetail({
  carbon,
  itinerary,
  schedule,
  route,
  timeZone,
  mobile,
  onClose,
  onRestart,
  formatResult
}) {
  const intl = useIntl()
  const [shareStatus, setShareStatus] = useState(null)
  const content = useRef(null)
  useEffect(() => {
    content.current?.scrollIntoView({ block: 'start' })
  }, [])
  const text = (name, values) =>
    intl.formatMessage(
      {
        defaultMessage: labels[name],
        id: `components.TripDetail.${name}`
      },
      values
    )
  const time = (value) =>
    Number.isFinite(value) ? intl.formatTime(value, { timeZone }) : '–'
  const share = () => {
    const url = new URL(window.location.href)
    const params = coreUtils.query.getUrlParams()
    const query = combineQueryParams({
      ...params,
      sessionId: undefined,
      ui_activeItinerary: undefined,
      ui_itineraryView: undefined,
      ui_tripOption: `${params.ui_activeSearch || ''}:${getTripOptionKey(
        itinerary
      )}`
    })
    const path = url.hash.split('?')[0] || '#/'
    url.hash = `${path}?${query}`
    setShareStatus(copyToClipboard(url.href) ? 'copied' : 'copyFailed')
  }
  const print = () => {
    const closed = [...content.current.querySelectorAll('details:not([open])')]
    closed.forEach((detail) => {
      detail.open = true
    })
    try {
      window.print()
    } finally {
      closed.forEach((detail) => {
        detail.open = false
      })
    }
  }

  const finalStop = itinerary.legs[itinerary.legs.length - 1]?.to?.name
  const stops = itinerary.legs.reduce(
    (count, leg) => count + (leg.intermediateStops?.length || 0),
    0
  )
  const { caloriesBurned } =
    coreUtils.itinerary.calculatePhysicalActivity(itinerary)
  return (
    <section aria-label={text('option')} className="trip-detail" ref={content}>
      <div className="trip-detail-header">
        <h2>{text('option')}</h2>
        <button aria-label={text('close')} onClick={onClose} type="button">
          {mobile ? '‹' : '×'}
        </button>
      </div>
      <div className="trip-detail-summary">
        <strong>{route}</strong>
        <span>{schedule}</span>
        <span>
          {formatResult('departure', { time: time(itinerary.startTime) })}
        </span>
        <span>
          {formatResult('arrival', { time: time(itinerary.endTime) })}
        </span>
        <span>
          {formatResult('duration')}{' '}
          <FormattedDuration
            duration={itinerary.duration}
            includeSeconds={false}
          />
        </span>
        {stops > 0 && <span>{formatResult('stops', { count: stops })}</span>}
        {caloriesBurned > 0 && (
          <span>
            {formatResult('calories', { count: Math.round(caloriesBurned) })}
          </span>
        )}
        <span>{carbon}</span>
      </div>
      <ol className="trip-detail-timeline">
        {itinerary.legs.map((leg, index) => (
          <LegItem intl={intl} key={index} leg={leg} text={text} time={time} />
        ))}
        {finalStop && (
          <li className="trip-detail-leg">
            <div className="trip-detail-leg-time">
              {time(itinerary.endTime)}
            </div>
            <strong>{finalStop}</strong>
          </li>
        )}
      </ol>
      <div className="trip-detail-actions">
        <button onClick={print} type="button">
          <Download aria-hidden="true" size={15} /> {text('download')}
        </button>
        <button onClick={share} type="button">
          <ShareAlt aria-hidden="true" size={15} /> {text('share')}
        </button>
        <button onClick={onRestart} type="button">
          <Redo aria-hidden="true" size={15} /> {text('restart')}
        </button>
      </div>
      <span className="trip-detail-share-status" role="status">
        {shareStatus && text(shareStatus)}
      </span>
      <div className="trip-results-footer trip-detail-footer">
        <button disabled type="button">
          {text('go')}
        </button>
      </div>
    </section>
  )
}
