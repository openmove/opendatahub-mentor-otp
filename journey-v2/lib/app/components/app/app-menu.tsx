// SPDX-FileCopyrightText: 2024 Conveyal <support@conveyal.com>
//
// SPDX-License-Identifier: MIT

import { ChevronLeft, Times } from '@styled-icons/fa-solid'
import coreUtils from '@opentripplanner/core-utils'
import { connect } from 'react-redux'
import { Envelope } from '@styled-icons/fa-regular/Envelope'
import { ExternalLinkSquareAlt } from '@styled-icons/fa-solid/ExternalLinkSquareAlt'
import { FormattedMessage, injectIntl } from 'react-intl'
import { GraduationCap } from '@styled-icons/fa-solid/GraduationCap'
import { History } from '@styled-icons/fa-solid/History'
import React, { Component, useContext } from 'react'
import SlidingPane from 'react-sliding-pane'
import type { WrappedComponentProps } from 'react-intl'

import * as callTakerActions from '@otp-react-redux/lib/actions/call-taker'
import * as fieldTripActions from '@otp-react-redux/lib/actions/field-trip'
import * as mapActions from '@otp-react-redux/lib/actions/map'
import * as uiActions from '@otp-react-redux/lib/actions/ui'
import { MobileScreens } from '@otp-react-redux/lib/actions/ui-constants'
import { AppMenuItemConfig, LanguageConfig } from '@otp-react-redux/lib/util/config-types'
import { AppReduxState } from '@otp-react-redux/lib/util/state-types'
import { ComponentContext } from '@otp-react-redux/lib/util/contexts'
import { getLanguageOptions } from '@otp-react-redux/lib/util/i18n'
import { isModuleEnabled, Modules } from '@otp-react-redux/lib/util/config'

import AppMenuItem from '@otp-react-redux/lib/components/app/app-menu-item'
import PopupTriggerText from '@otp-react-redux/lib/components/app/popup-trigger-text'
import logo from '../../../../branding/opendatahub/map-logo.svg'
import SearchFavoritesPanel from './search-favorites-panel'
import UserPreferencesPanel from './user-preferences-panel'

const menuLanguages = [
  { locale: 'it', label: 'Italiano (IT)' },
  { locale: 'en-US', label: 'English (EN)' },
  { locale: 'de', label: 'Deutsch (DE)' }
]

type MenuItem = {
  children?: MenuItem[]
  href?: string
  iconType?: string | JSX.Element
  iconUrl?: string
  id: string
  isSelected?: boolean
  label?: string | JSX.Element
  lang?: string
  onClick?: () => void
  skipLocales?: boolean
  subMenuDivider?: boolean
}

type AppMenuProps = {
  activeLocale: string
  clearMapPopupLocation: () => void
  callTakerEnabled?: boolean
  extraMenuItems?: AppMenuItemConfig[]
  fieldTripEnabled?: boolean
  language?: LanguageConfig
  languageOptions: Record<string, any> | null
  mailablesEnabled?: boolean
  popupTarget?: string
  resetAndToggleCallHistory?: () => void
  resetAndToggleFieldTrips?: () => void
  setLocale: (locale: string) => void
  setMainPanelContent: (panel: null) => void
  setMobileScreen: (screen: number) => void
  stayOnCurrentMap?: boolean
  setPopupContent: (url: string) => void
  startOverFromInitialUrl: () => void
  toggleMailables: () => void
  termsOfServiceLink?: string
}
type AppMenuState = {
  isPaneOpen: boolean
  view: 'menu' | 'favorites' | 'language' | 'preferences'
}

/**
 * Custom AppMenu without route viewer link.
 */
class AppMenu extends Component<
  AppMenuProps & WrappedComponentProps,
  AppMenuState
> {
  static contextType = ComponentContext

  state = {
    isPaneOpen: false,
    view: 'menu'
  }

  _startOver = () => {
    this._closePane()
    this.props.startOverFromInitialUrl()
  }

  _triggerPopup = () => {
    const { popupTarget, setPopupContent } = this.props
    if (popupTarget) setPopupContent(popupTarget)
  }

  _togglePane = () => {
    const { isPaneOpen } = this.state
    this.setState({ isPaneOpen: !isPaneOpen, view: 'menu' })
  }

  _backToMenu = () => {
    const { view } = this.state
    this.setState({ view: 'menu' }, () => {
      document.getElementById(`app-menu-${view}`)?.focus()
    })
  }

  _closePane = () => this.setState({ isPaneOpen: false, view: 'menu' })

  _showFavorite = () => {
    const { clearMapPopupLocation, setMainPanelContent, setMobileScreen, stayOnCurrentMap } = this.props
    clearMapPopupLocation()
    this._closePane()
    if (!stayOnCurrentMap) {
      setMainPanelContent(null)
      if (coreUtils.ui.isMobile()) setMobileScreen(MobileScreens.WELCOME_SCREEN)
    }
  }

  _openView = (view: AppMenuState['view']) => {
    this.setState({ view }, () => {
      document.getElementById('app-menu-section-back')?.focus()
    })
  }

  _handleSkipNavigation = () => {
    document.querySelector('main')?.focus()
  }

  _addExtraMenuItems = (menuItems?: MenuItem[] | null) => {
    return (
      menuItems &&
      menuItems.map((menuItem) => {
        const {
          children,
          href,
          iconType,
          iconUrl,
          id,
          isSelected,
          label: configLabel,
          lang,
          onClick,
          skipLocales,
          subMenuDivider
        } = menuItem
        const { activeLocale, language } = this.props
        const localizedLabel = language?.[activeLocale]?.config?.menuItems?.[id]
        const useLocalizedLabel = !skipLocales && localizedLabel
        const label = useLocalizedLabel ? localizedLabel : configLabel

        return (
          <AppMenuItem
            aria-selected={isSelected || undefined}
            className={subMenuDivider ? 'app-menu-divider' : undefined}
            href={href}
            icon={
              iconType && typeof iconType !== 'string' ? (
                iconType
              ) : (
                <Icon iconType={iconType} iconUrl={iconUrl} />
              )
            }
            id={id}
            key={id}
            lang={lang}
            onClick={onClick}
            role={isSelected !== undefined ? 'option' : undefined}
            subItems={this._addExtraMenuItems(children) || undefined}
            text={label}
          />
        )
      })
    )
  }

  render() {
    const {
      activeLocale,
      callTakerEnabled,
      extraMenuItems,
      fieldTripEnabled,
      intl,
      languageOptions,
      mailablesEnabled,
      popupTarget,
      resetAndToggleCallHistory,
      resetAndToggleFieldTrips,
      setLocale,
      toggleMailables,
      termsOfServiceLink
    } = this.props
    const { isPaneOpen, view } = this.state
    const message = (key: string) => intl.formatMessage({ id: `components.JourneyMenu.${key}` })
    const favoritesTitle = intl.formatMessage({ id: 'components.SearchFavorites.title' })
    const languageTitle = message('language')
    const availableMenuLanguages = menuLanguages.filter(({ locale }) => languageOptions?.[locale])
    const infoItems = [
      { id: 'about', label: message('about') },
      { id: 'terms', label: message('terms'), href: termsOfServiceLink?.replace('{locale}', activeLocale) },
      { id: 'privacy', label: message('privacy') }
    ].map((item) => ({
      ...item,
      href: item.href || extraMenuItems?.find(({ id }) => id === item.id)?.href
    }))
    const otherMenuItems = extraMenuItems?.filter(({ id }) => !infoItems.some((item) => item.id === id))
    const { SvgIcon } = this.context
    const buttonLabel = isPaneOpen
      ? intl.formatMessage({ id: 'components.AppMenu.closeMenu' })
      : intl.formatMessage({ id: 'components.AppMenu.openMenu' })
    const Bar = 'span'

    return (
      <>
        {/* Use a button for skipping navigation. A regular <a href=...> element would modify the URL,
            and such change would be captured by the router without changing the focused element. */}
        <button
          className="skip-nav-button"
          onClick={this._handleSkipNavigation}
        >
          <FormattedMessage id="components.AppMenu.skipNavigation" />
        </button>
        <button
          type="button"
          aria-controls="app-menu"
          aria-expanded={isPaneOpen}
          aria-label={buttonLabel}
          className="app-menu-icon"
          onClick={this._togglePane}
        >
          <Bar className="menu-line top" />
          <Bar className="menu-line middle" />
          <Bar className="menu-line bottom" />
        </button>
        <SlidingPane
          className="journey-menu-pane"
          from="left"
          hideHeader
          isOpen={isPaneOpen}
          onRequestClose={this._closePane}
          shouldCloseOnEsc
          width="min(100vw, 393px)"
        >
          {view === 'favorites' ? (
            <SearchFavoritesPanel
              onBack={this._backToMenu}
              onClose={this._closePane}
              onShowPlace={this._showFavorite}
            />
          ) : (
            <div id="app-menu">
              <header className="journey-menu-header">
                {view === 'menu' ? (
                  <img src={logo} width="161" height="42" alt="Journey Planner - Open Data Hub" />
                ) : (
                  <>
                    <button id="app-menu-section-back" type="button" onClick={this._backToMenu} aria-label={intl.formatMessage({ id: 'common.forms.back' })}>
                      <ChevronLeft size={20} aria-hidden="true" />
                    </button>
                    <h2>{view === 'language' ? languageTitle : message('preferences')}</h2>
                  </>
                )}
                <button className="journey-menu-close" type="button" onClick={this._closePane} aria-label={intl.formatMessage({ id: 'components.AppMenu.closeMenu' })}>
                  <Times size={22} aria-hidden="true" />
                </button>
              </header>
              {view === 'language' && (
                <div className="journey-menu-languages" role="radiogroup" aria-label={languageTitle}>
                  {availableMenuLanguages.map(({ locale, label }) => (
                    <label key={locale} lang={locale}>
                      <input
                        type="radio"
                        name="journey-menu-language"
                        value={locale}
                        checked={activeLocale === locale}
                        onChange={() => setLocale(locale)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              )}
              {view === 'preferences' && (
                <UserPreferencesPanel />
              )}
              {view === 'menu' && (
                <nav className="app-menu journey-menu-list" aria-label={buttonLabel}>
                  <AppMenuItem onClick={this._startOver} text={message('restart')} />
                  <AppMenuItem id="app-menu-preferences" onClick={() => this._openView('preferences')} text={message('preferences')} />
                  {availableMenuLanguages.length > 0 && (
                    <AppMenuItem id="app-menu-language" onClick={() => this._openView('language')} text={languageTitle} />
                  )}
                  <AppMenuItem id="app-menu-favorites" onClick={() => this._openView('favorites')} text={favoritesTitle} />
                  {infoItems.map(({ id, href, label }) => href ? (
                    <AppMenuItem key={id} href={href} onClick={this._closePane} text={label} />
                  ) : (
                    <button key={id} type="button" disabled>{label}</button>
                  ))}
                  {popupTarget && (
                    <AppMenuItem
                      icon={<SvgIcon iconName={popupTarget} />}
                      onClick={this._triggerPopup}
                      text={<PopupTriggerText popupTarget={popupTarget} />}
                    />
                  )}
                  {callTakerEnabled && (
                    <AppMenuItem
                      icon={<History />}
                      onClick={resetAndToggleCallHistory}
                      text={intl.formatMessage({
                        id: 'components.AppMenu.callHistory'
                      })}
                    />
                  )}
                  {fieldTripEnabled && (
                    <AppMenuItem
                      icon={<GraduationCap />}
                      onClick={resetAndToggleFieldTrips}
                      text={intl.formatMessage({
                        id: 'components.AppMenu.fieldTrip'
                      })}
                    />
                  )}
                  {mailablesEnabled && (
                    <AppMenuItem
                      icon={<Envelope />}
                      onClick={toggleMailables}
                      text={intl.formatMessage({
                        id: 'components.AppMenu.mailables'
                      })}
                    />
                  )}
                  {this._addExtraMenuItems(otherMenuItems)}
                </nav>
              )}
            </div>
          )}
        </SlidingPane>
      </>
    )
  }
}

// connect to the redux store

const mapStateToProps = (state: AppReduxState) => {
  const { extraMenuItems, language, popups, termsOfServiceLink } = state.otp.config
  return {
    activeLocale: state.otp.ui.locale,
    callTakerEnabled: isModuleEnabled(state, Modules.CALL_TAKER),
    extraMenuItems,
    fieldTripEnabled: isModuleEnabled(state, Modules.FIELD_TRIP),
    language,
    languageOptions: getLanguageOptions(language),
    mailablesEnabled: isModuleEnabled(state, Modules.MAILABLES),
    popupTarget: popups?.launchers?.sidebarLink,
    termsOfServiceLink
  }
}

const mapDispatchToProps = {
  clearMapPopupLocation: mapActions.clearMapPopupLocation,
  resetAndToggleCallHistory: callTakerActions.resetAndToggleCallHistory,
  resetAndToggleFieldTrips: fieldTripActions.resetAndToggleFieldTrips,
  setLocale: uiActions.setLocale,
  setMainPanelContent: uiActions.setMainPanelContent,
  setMobileScreen: uiActions.setMobileScreen,
  setPopupContent: uiActions.setPopupContent,
  startOverFromInitialUrl: uiActions.startOverFromInitialUrl,
  toggleMailables: callTakerActions.toggleMailables
}

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(AppMenu))

/**
 * Renders a label and icon either from url or font awesome type
 */
export const Icon = ({
  iconType,
  iconUrl
}: {
  iconType?: string
  iconUrl?: string
}): JSX.Element => {
  const { SvgIcon } = useContext(ComponentContext)
  return iconUrl ? (
    <img alt="" src={iconUrl} />
  ) : iconType ? (
    <SvgIcon iconName={iconType} />
  ) : (
    <ExternalLinkSquareAlt />
  )
}
