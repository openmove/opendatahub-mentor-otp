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
import { CalendarAlt, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from '@styled-icons/fa-solid'
import { addDays, addMonths, format, getDay, getDaysInMonth, isValid, parseISO, startOfMonth } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import React, { useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { useDispatch, useSelector } from 'react-redux'
import type { AnyAction } from 'redux'
import type { ThunkDispatch } from 'redux-thunk'

import { setQueryParam } from '@otp-react-redux/lib/actions/form'
import type { AppReduxState } from '@otp-react-redux/lib/util/state-types'

type DepartureMode = 'NOW' | 'DEPART' | 'ARRIVE'

type Draft = {
  date: Date
  month: Date
  hour: string
  minute: string
  mode: DepartureMode
}

type DateTimeState = AppReduxState & {
  otp: { currentQuery: { date?: string; departArrive?: string; time?: string } }
}

const asTwoDigits = (value: number) => String(value).padStart(2, '0')
const dayNumber = (date: Date) => format(date, 'yyyy-MM-dd')
const isTimePart = (value: string, limit: number) => /^\d{1,2}$/.test(value) && Number(value) < limit

export default function TripCalendar() {
  const intl = useIntl()
  const dispatch = useDispatch<ThunkDispatch<AppReduxState, unknown, AnyAction>>()
  const { date, departArrive, time } = useSelector((state: DateTimeState) => state.otp.currentQuery)
  const timeZone = useSelector((state: AppReduxState) => state.otp.config.homeTimezone)
  const [draft, setDraft] = useState<Draft | null>(null)
  const message = (key: string) => intl.formatMessage({ id: `components.TripCalendar.${key}` })
  const now = new Date()
  const localDate = timeZone ? formatInTimeZone(now, timeZone, 'yyyy-MM-dd') : dayNumber(now)
  const localTime = timeZone ? formatInTimeZone(now, timeZone, 'HH:mm') : format(now, 'HH:mm')
  const validDate = date && isValid(parseISO(date)) ? date : localDate
  const selectedDate = departArrive === 'NOW' ? localDate : validDate
  const selectedTime = departArrive !== 'NOW' && time && /^([01]\d|2[0-3]):[0-5]\d/.test(time)
    ? time.slice(0, 5)
    : localTime
  const summaryDate = selectedDate === localDate
    ? message('today')
    : parseISO(selectedDate).toLocaleDateString(intl.locale, { day: 'numeric', month: 'short' })

  const { context, refs, strategy, x, y } = useFloating({
    open: Boolean(draft),
    onOpenChange(open) {
      if (!open) {
        setDraft(null)
        return
      }
      const date = parseISO(selectedDate)
      const [hour, minute] = selectedTime.split(':')
      const mode = departArrive === 'ARRIVE' || departArrive === 'DEPART' ? departArrive : 'NOW'
      setDraft({ date, month: startOfMonth(date), hour, minute, mode })
    },
    placement: 'bottom-start',
    strategy: 'fixed',
    whileElementsMounted: (reference, floating, update) =>
      autoUpdate(reference, floating, update, { elementResize: typeof ResizeObserver !== 'undefined' }),
    middleware: [
      offset(4),
      shift({ padding: 8, crossAxis: true }),
      size({
        padding: 8,
        apply({ availableWidth, elements, rects }) {
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

  function confirm() {
    if (!draft || (draft.mode !== 'NOW' && !validTime)) return
    dispatch(setQueryParam({
      date: draft.mode === 'NOW' ? localDate : dayNumber(draft.date),
      time: draft.mode === 'NOW' ? localTime : `${asTwoDigits(Number(draft.hour))}:${asTwoDigits(Number(draft.minute))}`,
      departArrive: draft.mode
    }))
    setDraft(null)
  }

  function changeTime(part: 'hour' | 'minute', step: number) {
    if (!draft) return
    const limit = part === 'hour' ? 24 : 60
    const value = (Number(draft[part]) + step + limit) % limit
    setDraft({ ...draft, [part]: asTwoDigits(value), mode: draft.mode === 'NOW' ? 'DEPART' : draft.mode })
  }

  const calendarStart = draft && addDays(draft.month, -((getDay(draft.month) + 6) % 7))
  const validTime = draft && isTimePart(draft.hour, 24) && isTimePart(draft.minute, 60)

  return (
    <div className="trip-form-calendar">
      <button
        type="button"
        className="trip-calendar-trigger"
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        <CalendarAlt size={18} aria-hidden="true" />
        {summaryDate}, {selectedTime}
      </button>
      {draft && calendarStart && (
        <FloatingPortal>
          <FloatingFocusManager context={context} initialFocus={0}>
            <div
              ref={refs.setFloating}
              style={{ position: strategy, left: x ?? 0, top: y ?? 0 }}
              className="trip-calendar"
              aria-label={message('dateTime')}
              {...getFloatingProps()}
            >
              <select
                className="trip-calendar__mode"
                aria-label={message('dateTime')}
                value={draft.mode}
                onChange={(event) => setDraft({ ...draft, mode: event.target.value as DepartureMode })}
              >
                <option value="NOW">{intl.formatMessage({ id: 'otpUi.DateTimeSelector.now' })}</option>
                <option value="DEPART">{intl.formatMessage({ id: 'otpUi.DateTimeSelector.depart' })}</option>
                <option value="ARRIVE">{intl.formatMessage({ id: 'otpUi.DateTimeSelector.arrive' })}</option>
              </select>
              <header className="trip-calendar__month">
                <button type="button" aria-label={message('previousMonth')} onClick={() => setDraft({ ...draft, month: addMonths(draft.month, -1) })}>
                  <ChevronLeft size={14} aria-hidden="true" />
                </button>
                <strong aria-live="polite">{draft.month.toLocaleDateString(intl.locale, { month: 'long', year: 'numeric' })}</strong>
                <button type="button" aria-label={message('nextMonth')} onClick={() => setDraft({ ...draft, month: addMonths(draft.month, 1) })}>
                  <ChevronRight size={14} aria-hidden="true" />
                </button>
              </header>
              <div className="trip-calendar__days">
                {Array.from({ length: 7 }, (_, i) => (
                  <span key={i}>{addDays(calendarStart, i).toLocaleDateString(intl.locale, { weekday: 'short' })}</span>
                ))}
                {Array.from({ length: (getDay(draft.month) + 6) % 7 }, (_, i) => <span key={`empty-${i}`} aria-hidden="true" />)}
                {Array.from({ length: getDaysInMonth(draft.month) }, (_, i) => {
                  const date = addDays(draft.month, i)
                  return (
                    <button
                      key={dayNumber(date)}
                      type="button"
                      aria-label={date.toLocaleDateString(intl.locale, { dateStyle: 'full' })}
                      aria-pressed={dayNumber(draft.date) === dayNumber(date)}
                      onClick={() => setDraft({ ...draft, date, mode: draft.mode === 'NOW' ? 'DEPART' : draft.mode })}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>
              <div className="trip-calendar__footer">
                <div className="trip-calendar__time">
                  {(['hour', 'minute'] as const).map((part, index) => (
                    <React.Fragment key={part}>
                      {index === 1 && <span aria-hidden="true">:</span>}
                      <div>
                        <button type="button" aria-label={message(part === 'hour' ? 'decreaseHour' : 'decreaseMinute')} onClick={() => changeTime(part, -1)}>
                          <ChevronDown size={10} aria-hidden="true" />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          aria-label={message(part)}
                          value={draft[part]}
                          onChange={(event) => {
                            if (/^\d{0,2}$/.test(event.target.value)) {
                              setDraft({ ...draft, [part]: event.target.value, mode: draft.mode === 'NOW' ? 'DEPART' : draft.mode })
                            }
                          }}
                        />
                        <button type="button" aria-label={message(part === 'hour' ? 'increaseHour' : 'increaseMinute')} onClick={() => changeTime(part, 1)}>
                          <ChevronUp size={10} aria-hidden="true" />
                        </button>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                <button
                  type="button"
                  className="trip-calendar__confirm"
                  disabled={draft.mode !== 'NOW' && !validTime}
                  onClick={confirm}
                >
                  <FormattedMessage id="components.TripCalendar.confirm" />
                </button>
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </div>
  )
}
