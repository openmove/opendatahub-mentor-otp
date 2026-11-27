export * from '@otp-react-redux/lib/util/state'

import { sortOptions as vendorSortOptions } from '@otp-react-redux/lib/components/util/sortOptions'
import {
  getActiveFieldTripRequest,
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

export function sortItinerariesInPlaceIfNeeded(itineraries, state) {
  const { direction, type } = state.otp.filter.sort
  if (type !== 'TRANSFERS' && type !== 'WALKTIME') return vendorSort(itineraries, state)
  if (getActiveFieldTripRequest(state)) return itineraries

  const metric = type === 'TRANSFERS' ? 'transfers' : 'walkTime'
  return itineraries.sort((first, second) =>
    compareMetric(first[metric], second[metric], direction) ||
    compareMetric(first.duration, second.duration, 'ASC')
  )
}
