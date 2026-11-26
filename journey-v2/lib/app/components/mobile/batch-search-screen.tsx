// SPDX-FileCopyrightText: 2024 Conveyal <support@conveyal.com>
//
// SPDX-License-Identifier: MIT

import { connect } from 'react-redux'
import { injectIntl, IntlShape } from 'react-intl'
import React, { Component } from 'react'

import * as uiActions from '@otp-react-redux/lib/actions/ui'
import { MobileScreens } from '@otp-react-redux/lib/actions/ui-constants'
import BatchSettings from '@otp-react-redux/lib/components/form/batch-settings'
import LocationField from '@otp-react-redux/lib/components/form/connected-location-field'
import MobileContainer from '@otp-react-redux/lib/components/mobile/container'
import SwitchButton from '@otp-react-redux/lib/components/form/switch-button'

import { ChevronDoubleDown, ChevronDoubleUp } from '../../icons/nav'
import DefaultMap from '../map/default-map'
import MobileNavigationBar from './navigation-bar'

const { SET_FROM_LOCATION, SET_TO_LOCATION } = MobileScreens

interface Props {
  intl: IntlShape
  map: React.ReactElement
  setMobileScreen: (screen: number) => void
}

/**
 * Copy of the vendor mobile batch search screen, with the chevron of the
 * Figma bottom panel added. The chevron collapses the panel to the origin and
 * destination fields (and expands it back). It is local state on purpose: going
 * back to the welcome screen would not work, because the vendor MobileMain
 * moves from the welcome screen to this one as soon as both locations are set.
 */
class BatchSearchScreen extends Component<Props> {
  state = {
    expanded: true,
    planTripClicked: false
  }

  _fromFieldClicked = () => this.props.setMobileScreen(SET_FROM_LOCATION)

  _toFieldClicked = () => this.props.setMobileScreen(SET_TO_LOCATION)

  handlePlanTripClick = () => {
    this.setState({ planTripClicked: true })
  }

  toggleExpanded = () => {
    // The map column changes height but the window does not, so the map
    // doesn't notice. A resize event makes it redraw to the new size.
    this.setState({ expanded: !this.state.expanded }, () =>
      window.dispatchEvent(new Event('resize'))
    )
  }

  render() {
    const { intl } = this.props
    const { expanded, planTripClicked } = this.state
    const Chevron = expanded ? ChevronDoubleDown : ChevronDoubleUp
    return (
      <MobileContainer>
        <MobileNavigationBar
          headerText={intl.formatMessage({
            id: 'components.BatchSearchScreen.header'
          })}
        />
        <main tabIndex={-1}>
          <div className="batch-search-settings mobile-padding">
            <button
              aria-expanded={expanded}
              className="panel-chevron"
              onClick={this.toggleExpanded}
              type="button"
            >
              <Chevron aria-hidden />
            </button>
            <LocationField
              inputPlaceholder={intl.formatMessage({
                id: 'components.LocationSearch.setOrigin'
              })}
              isRequired
              locationType="from"
              onTextInputClick={this._fromFieldClicked}
              selfValidate={planTripClicked}
              showClearButton={false}
            />
            <LocationField
              inputPlaceholder={intl.formatMessage({
                id: 'components.LocationSearch.setDestination'
              })}
              isRequired
              locationType="to"
              onTextInputClick={this._toFieldClicked}
              selfValidate={planTripClicked}
              showClearButton={false}
            />
            {expanded && (
              <>
                <div className="switch-button-container-mobile">
                  <SwitchButton />
                </div>
                <BatchSettings onPlanTripClick={this.handlePlanTripClick} />
              </>
            )}
          </div>
          <div className="batch-search-map">
            <DefaultMap />
          </div>
        </main>
      </MobileContainer>
    )
  }
}

// connect to the redux store

const mapDispatchToProps = {
  setMobileScreen: uiActions.setMobileScreen
}

export default connect(null, mapDispatchToProps)(injectIntl(BatchSearchScreen))
