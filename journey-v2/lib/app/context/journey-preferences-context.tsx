import React, { createContext, useState } from 'react'

const storageKey = 'journeyPreferences'

function readOnDemandPreference() {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) || '{}')?.onDemandServices === true
  } catch {
    return false
  }
}

export const JourneyPreferencesContext = createContext({
  onDemandServices: false,
  setOnDemandServices: (_enabled: boolean) => {}
})

export function JourneyPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [onDemandServices, setOnDemandServices] = useState(readOnDemandPreference)

  function updateOnDemandServices(enabled: boolean) {
    setOnDemandServices(enabled)

    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ onDemandServices: enabled }))
    } catch {
      // The selected setting still applies for this session.
    }
  }

  return (
    <JourneyPreferencesContext.Provider value={{
      onDemandServices,
      setOnDemandServices: updateOnDemandServices
    }}>
      {children}
    </JourneyPreferencesContext.Provider>
  )
}
