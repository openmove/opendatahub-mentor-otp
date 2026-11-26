import React, { useContext } from 'react'
import { FormattedMessage } from 'react-intl'
import { useSelector } from 'react-redux'

import { AppReduxState } from '@otp-react-redux/lib/util/state-types'

import { JourneyPreferencesContext } from '../../context/journey-preferences-context'

export default function UserPreferencesPanel() {
  const { onDemandServices, setOnDemandServices } = useContext(JourneyPreferencesContext)
  const hasOnDemandLayer = useSelector((state: AppReduxState) => {
    const overlays = state.otp.config.map?.overlays as { type: string; url?: string }[] | undefined
    return Boolean(overlays?.some(({ type, url }) => type === 'taxi_noi' && url))
  })

  const options = [
    { id: 'technicalCookies', checked: true },
    { id: 'weather', checked: true },
    { id: 'privateHire', checked: false },
    {
      id: 'onDemandServices',
      checked: hasOnDemandLayer && onDemandServices,
      onChange: hasOnDemandLayer ? setOnDemandServices : undefined
    }
  ]

  return (
    <div className="journey-menu-preferences">
      {options.map(({ id, checked, onChange }) => (
        <label key={id} className="journey-preference">
          <FormattedMessage id={`components.JourneyMenu.${id}`} />
          <input
            type="checkbox"
            role="switch"
            checked={checked}
            disabled={!onChange}
            onChange={onChange && ((event) => onChange(event.target.checked))}
          />
        </label>
      ))}
    </div>
  )
}
