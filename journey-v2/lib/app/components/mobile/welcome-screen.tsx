// SPDX-FileCopyrightText: 2024 Conveyal <support@conveyal.com>
//
// SPDX-License-Identifier: MIT

import { connect } from 'react-redux'
import { useIntl } from 'react-intl'
import React, { useCallback } from 'react'

import * as mapActions from '@otp-react-redux/lib/actions/map'
import * as uiActions from '@otp-react-redux/lib/actions/ui'
import { MobileScreens } from '@otp-react-redux/lib/actions/ui-constants'
import LocationField from '@otp-react-redux/lib/components/form/connected-location-field'
import MobileContainer from '@otp-react-redux/lib/components/mobile/container'
import MobileNavigationBar from '@otp-react-redux/lib/components/mobile/navigation-bar'

import { ChevronDoubleUp } from '../../icons/nav'
import DefaultMap from '../map/default-map'

interface Props {
  setMobileScreen: (screen: number) => void
}

/**
 * Copy of the vendor mobile welcome screen, with the chevron of the Figma
 * bottom panel added. This is the collapsed panel: the chevron opens the
 * expanded one, which is the search form.
 */
const MobileWelcomeScreen = ({ setMobileScreen }: Props) => {
  const intl = useIntl()

  const toFieldClicked = useCallback(
    () => setMobileScreen(MobileScreens.SET_INITIAL_LOCATION),
    [setMobileScreen]
  )

  const expandClicked = useCallback(
    () => setMobileScreen(MobileScreens.SEARCH_FORM),
    [setMobileScreen]
  )

  return (
    <MobileContainer>
      <MobileNavigationBar
        headerText={intl.formatMessage({
          id: 'components.BatchSearchScreen.header'
        })}
      />
      <main tabIndex={-1}>
        <div className="welcome-location mobile-padding">
          <button
            aria-expanded={false}
            className="panel-chevron"
            onClick={expandClicked}
            type="button"
          >
            <ChevronDoubleUp aria-hidden />
          </button>
          <LocationField
            inputPlaceholder={intl.formatMessage({
              id: 'components.WelcomeScreen.prompt'
            })}
            locationType="to"
            onTextInputClick={toFieldClicked}
            showClearButton={false}
          />
        </div>
        <div className="welcome-map">
          <DefaultMap />
        </div>
      </main>
    </MobileContainer>
  )
}

// connect to the redux store

const mapDispatchToProps = {
  setLocationToCurrent: mapActions.setLocationToCurrent,
  setMobileScreen: uiActions.setMobileScreen
}

export default connect(null, mapDispatchToProps)(MobileWelcomeScreen)
