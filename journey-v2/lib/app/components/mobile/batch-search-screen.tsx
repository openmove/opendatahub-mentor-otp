// SPDX-FileCopyrightText: 2024 Conveyal <support@conveyal.com>
//
// SPDX-License-Identifier: MIT

import { injectIntl, IntlShape } from 'react-intl'
import React, { Component } from 'react'

import LocationField from '@otp-react-redux/lib/components/form/connected-location-field'
import MobileContainer from '@otp-react-redux/lib/components/mobile/container'

import { ChevronDoubleDown, ChevronDoubleUp } from '../../icons/nav'
import TripFormControls from '../app/trip-form-controls'
import DefaultMap from '../map/default-map'
import MobileNavigationBar from './navigation-bar'

interface Props {
  intl: IntlShape
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

  panel = React.createRef<HTMLDivElement>()

  expandedField = () =>
    this.panel.current?.querySelector<HTMLInputElement>('input[role="combobox"][aria-expanded="true"]')

  closeSuggestions = () => {
    const field = this.expandedField()
    if (!field) return false

    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    field.blur()
    return true
  }

  handlePlanTripClick = () => {
    this.setState({ planTripClicked: true })
  }

  expandForSearch = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!this.state.expanded && (event.target as HTMLElement).matches('input[role="combobox"]')) {
      this.setState({ expanded: true }, () => window.dispatchEvent(new Event('resize')))
    }
  }

  toggleExpanded = () => {
    if (this.closeSuggestions()) return
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
          <div
            className={`batch-search-settings mobile-trip-form${expanded ? ' mobile-trip-form--expanded' : ''}`}
            onFocusCapture={this.expandForSearch}
            ref={this.panel}
          >
            <button
              aria-expanded={expanded}
              className="panel-chevron"
              onClick={this.toggleExpanded}
              onMouseDown={(event) => {
                if (this.expandedField()) event.preventDefault()
              }}
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
              selfValidate={planTripClicked}
              showClearButton={false}
            />
            <LocationField
              inputPlaceholder={intl.formatMessage({
                id: 'components.LocationSearch.setDestination'
              })}
              isRequired
              locationType="to"
              selfValidate={planTripClicked}
              showClearButton={false}
            />
            {expanded && <TripFormControls onPlanTripClick={this.handlePlanTripClick} />}
          </div>
          <div className="batch-search-map" onPointerDownCapture={this.closeSuggestions}>
            <DefaultMap />
          </div>
        </main>
      </MobileContainer>
    )
  }
}

export default injectIntl(BatchSearchScreen)
