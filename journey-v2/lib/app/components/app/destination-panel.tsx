// SPDX-FileCopyrightText: 2024 Conveyal <support@conveyal.com>
//
// SPDX-License-Identifier: MIT

import { connect } from 'react-redux'
import { FormattedMessage, injectIntl, IntlShape } from 'react-intl'
import React, { Component } from 'react'
import { replace } from 'connected-react-router'

import {
  getActiveSearch,
  getShowUserSettings
} from '@otp-react-redux/lib/util/state'
import { getPersistenceMode } from '@otp-react-redux/lib/util/user'
import InvisibleA11yLabel from '@otp-react-redux/lib/components/util/invisible-a11y-label'
import LocationField from '@otp-react-redux/lib/components/form/connected-location-field'
import ViewerContainer from '../viewers/viewer-container'

import NarrativeItineraries from '@otp-react-redux/lib/components/narrative/narrative-itineraries'



import * as apiActions from '@otp-react-redux/lib/actions/api'
import * as mapActions from '@otp-react-redux/lib/actions/map'
import * as uiActions from '@otp-react-redux/lib/actions/ui'
import * as formActions from '@otp-react-redux/lib/actions/form'

import NextFlightSuggestion from './next-flight-suggestion'
import TripFormControls from './trip-form-controls'
import TripSearchLoading from './trip-search-loading'
import { PlanningContext } from '../../context/planning-context'

interface Props {
  routeTo: (url: string, arg2: any, arg3: any) => void
  query: any
  isViewingStop: boolean
  entityId: any
  activeSearch: any
  intl: IntlShape
  mobile?: boolean
  showUserSettings: boolean
}


/**
 * Main panel for the batch/trip comparison form.
 */
class DestinationPanel extends Component<Props> {
  state = {
    planTripClicked: false
  }
  // No real form submission is needed; avoid browser form semantics to prevent
  // "Form submission canceled because the form is not connected" warnings.
  
  handlePlanTripClick = () => {
    // Also flip global planning state so welcome overlay/nearby list hide.
    const ctx: any = (this as any).context
    if (ctx && typeof ctx.setIsPlanning === 'function') ctx.setIsPlanning(true)
    this.setState({ planTripClicked: true })
  }

  componentDidUpdate() {
    if((this.props.isViewingStop || this.props.entityId) && this.state.planTripClicked) {
      this.setState({ planTripClicked: false });
    }
  }

  render() {
    const { activeSearch, intl, mobile } = this.props
    const { planTripClicked } = this.state
    const planningCtx: any = (this as any).context || { isPlanning: false }
    const isPlanning = planningCtx.isPlanning

    const mapAction = mobile
      ? intl.formatMessage({
          id: 'common.searchForms.tap'
        })
      : intl.formatMessage({
          id: 'common.searchForms.click'
        })

    return (
      <ViewerContainer
        className="destination-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        <InvisibleA11yLabel>
          <h1>
            <FormattedMessage id="components.BatchSearchScreen.header" />
          </h1>
        </InvisibleA11yLabel>
        {activeSearch?.pending > 0 ? (
          <TripSearchLoading />
        ) : (
          <>
            <div className="form desktop-trip-form">
              <div className="desktop-trip-fields">
                <LocationField
                  inputPlaceholder={intl.formatMessage(
                    { id: 'common.searchForms.enterStartLocation' },
                    { mapAction }
                  )}
                  isRequired
                  locationType="from"
                  selfValidate={planTripClicked || isPlanning}
                  showClearButton={!mobile}
                />
                <LocationField
                  inputPlaceholder={intl.formatMessage(
                    { id: 'common.searchForms.enterDestination' },
                    { mapAction }
                  )}
                  isRequired
                  locationType="to"
                  selfValidate={planTripClicked || isPlanning}
                  showClearButton={!mobile}
                />
              </div>
              <TripFormControls onPlanTripClick={this.handlePlanTripClick} />
            </div>

            {activeSearch && (
              <div
                className="desktop-narrative-container"
                style={{
                  flexGrow: 1,
                  overflowY: 'hidden'
                }}
              >
                <NextFlightSuggestion />
                <NarrativeItineraries />
              </div>
            )}
          </>
        )}
      </ViewerContainer>
    )
  }
}

// connect to the redux store
const mapStateToProps = (state: any) => {
  // Show the place shortcuts for OTP-middleware users who have accepted the terms of use
  // and deployments using persistence to localStorage. Don't show shortcuts otherwise.
  const showUserSettings =
    getShowUserSettings(state) &&
    (state.user.loggedInUser?.hasConsentedToTerms ||
      getPersistenceMode(state.otp.config.persistence).isLocalStorage)
  const { entityId } = state.router.location.query

  return {
    isViewingStop: !!state.otp.ui.viewedStop,
    showUserSettings,
    query: state.otp.currentQuery,
    entityId: entityId && decodeURIComponent(entityId),
    activeSearch: getActiveSearch(state)
  }
}
const mapDispatchToProps = {
  routeTo: uiActions.routeTo,
  fetchNearby: apiActions.fetchNearby,
  setHighlightedLocation: uiActions.setHighlightedLocation,
  setQueryParam: formActions.setQueryParam,
  setLocation: mapActions.setLocation,
  setMainPanelContent: uiActions.setMainPanelContent,
  setViewedNearbyCoords: uiActions.setViewedNearbyCoords,
  viewNearby: uiActions.viewNearby,
  zoomToPlace: mapActions.zoomToPlace
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(injectIntl(DestinationPanel))

// Attach planning context to class component
;(DestinationPanel as any).contextType = PlanningContext
