// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: MIT

import { FormattedMessage } from 'react-intl'
import React from 'react'

import Bus from '../../icons/popup/Bus'

export default function TripSearchLoading() {
  return (
    <div className="trip-search-loading" role="status">
      <div aria-hidden="true" className="trip-search-loading-icon">
        <Bus height={32} width={32} />
      </div>
      <FormattedMessage
        defaultMessage="We're looking for the best options..."
        id="components.TripSearchLoading.message"
      />
    </div>
  )
}
