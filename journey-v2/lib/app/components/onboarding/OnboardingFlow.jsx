import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { getLanguageOptions } from '@otp-react-redux/lib/util/i18n'
import coreUtils from '@opentripplanner/core-utils'

import logo from '../../../../branding/opendatahub/map-logo.svg'
import './onboarding.scss'

const { isMobile } = coreUtils.ui

export default function OnboardingFlow({ onComplete, onLanguageConfirm, onPosition, renderMap }) {
    const [step, setStep] = useState(1)
    const [locationAllowed, setLocationAllowed] = useState(false)
    const [pending, setPending] = useState(false)
    const [languageError, setLanguageError] = useState(false)
    const mounted = useRef(false)
    const isLanguageStep = step === 1
    const languageConfig = useSelector((state) => state.otp.config.language)
    const locale = useSelector((state) => state.otp.ui.locale)
    const languageOptions = getLanguageOptions(languageConfig)
    const [languageChoice, setLanguageChoice] = useState(null)
    const selectedLanguage = languageOptions
        ? languageChoice ?? (languageOptions[locale] ? locale : Object.keys(languageOptions)[0])
        : locale
    const defaultMessages = languageConfig?.['en-US']?.components?.Onboarding
    const selectedMessages = languageConfig?.[selectedLanguage]?.components?.Onboarding
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
    const trigger = useRef(null)
    // Same user agent check the app uses to pick its mobile or desktop
    // layout, so onboarding and app never disagree (tablets, narrow windows).
    const isDesktop = !isMobile()
    const showMap = isDesktop && renderMap
    const headingKey = isLanguageStep
        ? (showMap ? 'headingDesktop' : 'headingMobile')
        : (step === 2 ? 'locationQuestion' : 'cookiesQuestion')
    const confirmationKey = step === 3
        ? 'cookiesAcknowledge'
        : isLanguageStep && showMap ? 'confirmDesktop' : 'confirmMobile'
    const message = (key) => selectedMessages?.[key] ?? defaultMessages?.[key]

    useEffect(() => {
        mounted.current = true
        return () => {
            mounted.current = false
        }
    }, [])

    function closeLanguageMenu() {
        setIsLanguageMenuOpen(false)
        trigger.current.focus()
    }

    function finishLocation(position) {
        if (!mounted.current) return
        if (position) onPosition(position)
        setLocationAllowed(Boolean(position))
        setPending(false)
        setStep(3)
    }

    async function confirmStep() {
        if (isLanguageStep) {
            setPending(true)
            setLanguageError(false)
            try {
                await onLanguageConfirm(selectedLanguage)
                if (mounted.current) setStep(2)
            } catch {
                if (mounted.current) setLanguageError(true)
            } finally {
                if (mounted.current) setPending(false)
            }
        } else if (step === 2) {
            const geolocation = navigator.geolocation
            if (!geolocation) {
                finishLocation()
                return
            }
            setPending(true)
            geolocation.getCurrentPosition(finishLocation, () => finishLocation(), {
                enableHighAccuracy: true,
                timeout: 10000
            })
        } else {
            onComplete(locationAllowed)
        }
    }

    return (
        <div className={showMap ? 'onboarding-layout onboarding-layout--desktop' : 'onboarding-layout'}>
            <main className="onboarding">
                <header>
                    <img src={logo} width="161" height="42" alt={selectedMessages?.logoAlt ?? defaultMessages?.logoAlt ?? ''} />
                </header>

                <section className="onboarding__content" aria-labelledby="onboarding-title">
                    <h1 id="onboarding-title" className={isLanguageStep ? undefined : 'onboarding__question'}>
                        {message(headingKey)}
                    </h1>
                    {isLanguageStep && languageOptions && (
                        <>
                            <h2 id="onboarding-language-label">
                                {selectedMessages?.selectLanguage ?? defaultMessages?.selectLanguage}
                            </h2>
                            <div
                                className="onboarding__select"
                                onBlur={(event) => {
                                    if (!event.currentTarget.contains(event.relatedTarget)) {
                                        setIsLanguageMenuOpen(false)
                                    }
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === 'Escape' && isLanguageMenuOpen) closeLanguageMenu()
                                }}
                            >
                                <button
                                    id="onboarding-language-trigger"
                                    ref={trigger}
                                    type="button"
                                    aria-labelledby="onboarding-language-label onboarding-language-trigger"
                                    aria-controls="onboarding-language-options"
                                    aria-expanded={isLanguageMenuOpen}
                                    onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                                >
                                    {languageOptions[selectedLanguage].name}
                                    <span className="onboarding__chevron" aria-hidden="true" />
                                </button>
                                <ul id="onboarding-language-options" hidden={!isLanguageMenuOpen}>
                                    {Object.entries(languageOptions).map(([code, { name }]) => (
                                        <li key={code}>
                                            <button
                                                type="button"
                                                lang={code}
                                                aria-pressed={code === selectedLanguage}
                                                onClick={() => {
                                                    setLanguageChoice(code)
                                                    closeLanguageMenu()
                                                }}
                                            >
                                                {name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}
                    {isLanguageStep && languageError && <p role="alert">{message('languageError')}</p>}
                </section>

                <footer>
                    <button
                        className="onboarding__continue"
                        type="button"
                        lang={selectedMessages?.[confirmationKey] ? selectedLanguage : 'en-US'}
                        disabled={pending}
                        onClick={confirmStep}
                    >
                        {message(confirmationKey)}
                    </button>
                    {!isLanguageStep && (
                        <button
                            className="onboarding__secondary"
                            type="button"
                            disabled={pending}
                            onClick={step === 2
                                ? () => finishLocation()
                                : () => onComplete(locationAllowed)}
                        >
                            {message(step === 2 ? 'locationManual' : 'cookiesSkip')}
                        </button>
                    )}
                    <div
                        className="onboarding__progress"
                        role="img"
                        aria-label={message(isLanguageStep ? 'progress' : `progress${step}`)}
                    >
                        {[1, 2, 3].map((index) => (
                            <span key={index} className={index === step ? 'is-current' : undefined} />
                        ))}
                    </div>
                </footer>
            </main>
            {showMap && <div className="onboarding-layout__map">{renderMap()}</div>}
        </div>
    )
}
