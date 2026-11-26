// SPDX-FileCopyrightText: 2024 Conveyal <support@conveyal.com>
//
// SPDX-License-Identifier: MIT

import { FormattedMessage, useIntl } from 'react-intl'
import React from 'react'

import Link from '@otp-react-redux/lib/components/util/link'

import { ArrowRouting, CompassNorthwest } from '../../icons/nav'

type Props = {
  sticky?: boolean
}

/**
 * Custom ViewSwitcher without route viewer link. It is the TRIP / NEARBY
 * "Navigation tab" of the Figma: an icon above a short label in each tab.
 */
const ViewSwitcher = ({ sticky }: Props) => {
  const intl = useIntl()
  return (
    <div
      aria-label={intl.formatMessage({
        id: 'components.ViewSwitcher.switcher'
      })}
      className="view-switcher"
      id="view-switcher"
      role="group"
      style={
        sticky
          ? {
              height: '100%',
              left: 0,
              position: 'absolute',
              width: '100%'
            }
          : {}
      }
    >
      <Link to="/" tracking>
        <ArrowRouting aria-hidden />
        {/* "Plan Trip" (BatchRoutingPanel.shortTitle) is too long for the
            44px tab, so the tab has its own short label. */}
        <FormattedMessage id="components.ViewSwitcher.trip" />
      </Link>
      <Link to="/nearby" tracking>
        <CompassNorthwest aria-hidden />
        <FormattedMessage id="components.ViewSwitcher.nearby" />
      </Link>
    </div>
  )
}

export default ViewSwitcher
