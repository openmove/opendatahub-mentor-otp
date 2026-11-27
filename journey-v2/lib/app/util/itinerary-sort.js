export * from '@otp-react-redux/lib/util/state'

import { sortOptions as vendorSortOptions } from '@otp-react-redux/lib/components/util/sortOptions'
import {
  createNoItinerariesErr as vendorNoItinerariesError,
  getActiveFieldTripRequest,
  getActiveItineraries,
  sortItinerariesInPlaceIfNeeded as vendorSort
} from '@otp-react-redux/lib/util/state'

export const tripSortOptions = [
  { value: 'DURATION', messageId: 'components.DesktopTrip.fastest' },
  { value: 'TRANSFERS', messageId: 'components.DesktopTrip.fewestTransfers' },
  { value: 'WALKTIME', messageId: 'components.DesktopTrip.leastWalking' }
]

export function sortOptions(intl, enabledOptions) {
  const options = vendorSortOptions(intl, enabledOptions)
  if (!enabledOptions || enabledOptions.includes('TRANSFERS')) {
    options.push({
      value: 'TRANSFERS',
      text: intl.formatMessage({ id: 'components.DesktopTrip.fewestTransfers' })
    })
  }
  return options
}

function compareMetric(first, second, direction) {
  if (!Number.isFinite(first)) return Number.isFinite(second) ? 1 : 0
  if (!Number.isFinite(second)) return -1
  return direction === 'ASC' ? first - second : second - first
}

export function usesSingleVehicle(itinerary) {
  let vehicle = null
  let previousLeg = null

  for (const leg of itinerary.legs || []) {
    if (leg.mode !== 'WALK') {
      if (vehicle) {
        const previousTrip = previousLeg?.trip?.gtfsId || previousLeg?.trip?.id
        const currentTrip = leg.trip?.gtfsId || leg.trip?.id
        const staysOnVehicle = previousLeg?.transitLeg && leg.transitLeg &&
          (leg.interlineWithPreviousLeg || (previousTrip && previousTrip === currentTrip))
        if (!staysOnVehicle) return false
      } else {
        vehicle = leg
      }
    }
    previousLeg = leg
  }

  return Boolean(vehicle)
}

function filtersSingleVehicle(state) {
  return state.otp.filter.singleVehicleOnly && !getActiveFieldTripRequest(state)
}

export function createNoItinerariesErr(state, errors, pending) {
  const result = vendorNoItinerariesError(state, errors, pending)
  if (pending || !filtersSingleVehicle(state)) return result

  const itineraries = getActiveItineraries(state)
  if (itineraries?.length && !itineraries.some(usesSingleVehicle)) {
    return { ...result, NO_SINGLE_VEHICLE_ROUTE: new Set() }
  }
  return result
}

export function sortItinerariesInPlaceIfNeeded(itineraries, state) {
  if (filtersSingleVehicle(state)) {
    const matching = itineraries.filter(usesSingleVehicle)
    itineraries.splice(0, itineraries.length, ...matching)
  }

  const { direction, type } = state.otp.filter.sort
  if (type !== 'TRANSFERS' && type !== 'WALKTIME') return vendorSort(itineraries, state)
  if (getActiveFieldTripRequest(state)) return itineraries

  const metric = type === 'TRANSFERS' ? 'transfers' : 'walkTime'
  return itineraries.sort((first, second) =>
    compareMetric(first[metric], second[metric], direction) ||
    compareMetric(first.duration, second.duration, 'ASC')
  )
}
