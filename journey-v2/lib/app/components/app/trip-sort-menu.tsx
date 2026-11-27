import {
  autoUpdate,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  shift,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole
} from '@floating-ui/react'
import { Award, ChevronDown, ChevronUp } from '@styled-icons/fa-solid'
import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import { useDispatch, useSelector } from 'react-redux'

import { updateItineraryFilter } from '@otp-react-redux/lib/actions/narrative'
import type { AppReduxState } from '@otp-react-redux/lib/util/state-types'

import { tripSortOptions } from '../../util/itinerary-sort'

export default function TripSortMenu() {
  const intl = useIntl()
  const dispatch = useDispatch()
  const filter = useSelector((state: AppReduxState) => state.otp.filter)
  const selected = tripSortOptions.find(({ value }) => value === filter.sort.type)
  const [open, setOpen] = useState(false)
  const { context, refs, strategy, x, y } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'bottom-start',
    strategy: 'fixed',
    whileElementsMounted: (reference, floating, update) =>
      autoUpdate(reference, floating, update, { elementResize: typeof ResizeObserver !== 'undefined' }),
    middleware: [
      offset(2),
      shift({ padding: 8, crossAxis: true }),
      size({
        padding: 8,
        apply({ elements, rects, availableWidth }) {
          elements.floating.style.width = `${Math.min(rects.reference.width, availableWidth)}px`
        }
      })
    ]
  })
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context),
    useRole(context, { role: 'dialog' })
  ])
  const Chevron = open ? ChevronUp : ChevronDown

  return (
    <div className="trip-form-sort">
      <button
        type="button"
        className="trip-form-optimization"
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        <Award size={16} aria-hidden="true" />
        {intl.formatMessage({ id: selected?.messageId ?? 'components.DesktopTrip.routeOrder' })}
        <Chevron size={16} aria-hidden="true" />
      </button>
      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context} initialFocus={0}>
            <div
              ref={refs.setFloating}
              className="trip-sort-options"
              style={{ position: strategy, left: x ?? 0, top: y ?? 0 }}
              aria-label={intl.formatMessage({ id: 'components.DesktopTrip.routeOrder' })}
              {...getFloatingProps()}
            >
              {tripSortOptions.map(({ value, messageId }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter.sort.type === value && filter.sort.direction === 'ASC'}
                  onClick={() => {
                    dispatch(updateItineraryFilter({ ...filter, sort: { type: value, direction: 'ASC' } }))
                    setOpen(false)
                  }}
                >
                  {intl.formatMessage({ id: messageId })}
                </button>
              ))}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </div>
  )
}
