import React, { useEffect, useRef, useState } from 'react'

import logo from '../../../../branding/opendatahub/map-logo.svg'
import './onboarding.scss'

const languages = {
    it: { label: 'Italiano (IT)', confirmation: 'Sì, certo', desktopConfirmation: 'Conferma scelta' },
    en: { label: 'English (EN)', confirmation: 'Yes of course', desktopConfirmation: 'Confirm choice' },
    de: { label: 'Deutsch (DE)', confirmation: 'Ja, natürlich', desktopConfirmation: 'Auswahl bestätigen' },
}

const desktopQuery = '(min-width: 768px)'

export default function OnboardingFlow({ onComplete, renderMap }) {
    const [selectedLanguage, setSelectedLanguage] = useState('en')
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
    const trigger = useRef(null)
    const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(desktopQuery).matches)
    const showMap = isDesktop && renderMap

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
                    <img src={logo} width="161" height="42" alt="Journey Planner - Open Data Hub" />
                </header>

                <section className="onboarding__content" aria-labelledby="onboarding-title">
                    <h1 id="onboarding-title">
                        {showMap ? <>Ciao, Hi,<br />Hallo, Salut</> : <>Ciao, Hi, Hallo,<br />Salut</>}
                    </h1>
                    <h2 id="onboarding-language-label">Select your language</h2>
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
                            {languages[selectedLanguage].label}
                            <span className="onboarding__chevron" aria-hidden="true" />
                        </button>
                        <ul id="onboarding-language-options" hidden={!isLanguageMenuOpen}>
                            {Object.entries(languages).map(([code, { label }]) => (
                                <li key={code}>
                                    <button
                                        type="button"
                                        lang={code}
                                        aria-pressed={code === selectedLanguage}
                                        onClick={() => {
                                            setSelectedLanguage(code)
                                            closeLanguageMenu()
                                        }}
                                    >
                                        {label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <footer>
                    <button
                        className="onboarding__continue"
                        type="button"
                        lang={selectedLanguage}
                        onClick={() => onComplete(selectedLanguage)}
                    >
                        {showMap
                            ? languages[selectedLanguage].desktopConfirmation
                            : languages[selectedLanguage].confirmation}
                    </button>
                    <div className="onboarding__progress" role="img" aria-label="Step 1 of 3">
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
