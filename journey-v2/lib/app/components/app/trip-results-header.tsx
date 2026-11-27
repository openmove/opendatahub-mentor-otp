import React from 'react'

import NarrativeItinerariesHeader from '@otp-react-redux/lib/components/narrative/narrative-itineraries-header'
import SingleVehicleToggle from './single-vehicle-toggle'

export default function TripResultsHeader(props: React.ComponentProps<typeof NarrativeItinerariesHeader>) {
  return (
    <>
      <NarrativeItinerariesHeader {...props} />
      {!props.itineraryIsExpanded && !props.pending && (
        <div className="mobile-trip-results-filter">
          <SingleVehicleToggle />
        </div>
      )}
    </>
  )
}
