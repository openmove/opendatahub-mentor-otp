import { Plus } from '@styled-icons/fa-solid'
import { FormattedMessage, useIntl } from 'react-intl'
import React from 'react'

import BatchSettings from '@otp-react-redux/lib/components/form/batch-settings'
import SwitchButton from '@otp-react-redux/lib/components/form/switch-button'
import TripCalendar from './trip-calendar'
import TripSortMenu from './trip-sort-menu'

export default function TripFormControls({ onPlanTripClick }: { onPlanTripClick: () => void }) {
  const intl = useIntl()

  return (
    <div className="trip-form-controls">
      <div className="trip-form-actions">
        <SwitchButton />
        <button type="button" className="trip-form-control" disabled>
          <Plus size={12} aria-hidden />
          <FormattedMessage id="components.DesktopTrip.addStop" />
        </button>
      </div>
      <div
        className="trip-form-settings"
        style={{
          '--trip-form-search-label': JSON.stringify(
            intl.formatMessage({ id: 'components.DesktopTrip.search' })
          )
        } as React.CSSProperties}
      >
        <TripCalendar />
        <div className="trip-form-batch">
          <BatchSettings onPlanTripClick={onPlanTripClick} />
        </div>
        <TripSortMenu />
        <label className="trip-form-direct">
          <FormattedMessage id="components.DesktopTrip.direct" />
          <input type="checkbox" role="switch" disabled />
        </label>
      </div>
    </div>
  )
}
