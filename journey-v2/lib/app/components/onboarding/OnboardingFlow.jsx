import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { getLanguageOptions } from '@otp-react-redux/lib/util/i18n'

import logo from '../../../../branding/opendatahub/map-logo.svg'
import './onboarding.scss'

const desktopQuery = '(min-width: 768px)'

export default function OnboardingFlow({ onComplete, renderMap }) {
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
    const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(desktopQuery).matches)
    const showMap = isDesktop && renderMap
    const headingKey = showMap ? 'headingDesktop' : 'headingMobile'
    const confirmationKey = showMap ? 'confirmDesktop' : 'confirmMobile'
    const confirmationLocale = selectedMessages?.[confirmationKey] ? selectedLanguage : 'en-US'

    useEffect(() => {
        const query = window.matchMedia(desktopQuery)
        const update = () => setIsDesktop(query.matches)
        query.addEventListener('change', update)
        return () => query.removeEventListener('change', update)
    }, [])

    function closeLanguageMenu() {
        setIsLanguageMenuOpen(false)
        trigger.current.focus()
    }

    return (
        <div className={showMap ? 'onboarding-layout onboarding-layout--desktop' : 'onboarding-layout'}>
            <main className="onboarding">
                <header>
                    <img src={logo} width="161" height="42" alt={selectedMessages?.logoAlt ?? defaultMessages?.logoAlt ?? ''} />
                </header>

                <section className="onboarding__content" aria-labelledby="onboarding-title">
                    <h1 id="onboarding-title">
                        {selectedMessages?.[headingKey] ?? defaultMessages?.[headingKey]}
                    </h1>
                    {languageOptions && (
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
                </section>

                <footer>
                    <button
                        className="onboarding__continue"
                        type="button"
                        lang={confirmationLocale}
                        onClick={() => onComplete(selectedLanguage)}
                    >
                        {selectedMessages?.[confirmationKey] ?? defaultMessages?.[confirmationKey]}
                    </button>
                    <div
                        className="onboarding__progress"
                        role="img"
                        aria-label={selectedMessages?.progress ?? defaultMessages?.progress}
                    >
                        <span />
                        <span />
                        <span />
                    </div>
                </footer>
            </main>
            {showMap && <div className="onboarding-layout__map">{renderMap()}</div>}
        </div>
    )
}
