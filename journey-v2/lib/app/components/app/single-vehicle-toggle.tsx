import React from 'react'
import { FormattedMessage } from 'react-intl'
import { useDispatch, useSelector } from 'react-redux'
import type { AnyAction } from 'redux'
import type { ThunkDispatch } from 'redux-thunk'

import {
  setActiveItinerary,
  setVisibleItinerary,
  updateItineraryFilter
} from '@otp-react-redux/lib/actions/narrative'
import { getActiveFieldTripRequest, getActiveItineraries, getActiveSearch } from '@otp-react-redux/lib/util/state'
import type { AppReduxState } from '@otp-react-redux/lib/util/state-types'

import { usesSingleVehicle } from '../../util/itinerary-sort'

type FilterState = AppReduxState & { otp: { filter: { singleVehicleOnly?: boolean } } }

export default function SingleVehicleToggle() {
  const dispatch = useDispatch<ThunkDispatch<AppReduxState, unknown, AnyAction>>()
  const filter = useSelector((state: FilterState) => state.otp.filter)
  const activeSearch = useSelector(getActiveSearch)
  const itineraries = useSelector(getActiveItineraries)
  const fieldTrip = useSelector(getActiveFieldTripRequest)

  function toggle(checked: boolean) {
    if (checked && activeSearch) {
      const active = itineraries?.[activeSearch.activeItinerary]
      const visible = itineraries?.[activeSearch.visibleItinerary]
      if (active && !usesSingleVehicle(active)) {
        dispatch(setActiveItinerary({ index: -1 }))
      } else if (visible && !usesSingleVehicle(visible)) {
        dispatch(setVisibleItinerary({ index: null }))
      }
    }

    dispatch(updateItineraryFilter({ ...filter, singleVehicleOnly: checked }))
  }

  return (
    <label className="trip-form-direct">
      <FormattedMessage id="components.DesktopTrip.direct" />
      <input
        type="checkbox"
        role="switch"
        checked={Boolean(filter.singleVehicleOnly) && !fieldTrip}
        disabled={Boolean(fieldTrip)}
        onChange={(event) => toggle(event.target.checked)}
      />
    </label>
  )
}
