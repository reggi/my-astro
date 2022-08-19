/** @jsx h */
import { PrismaClient } from '@prisma/client'
import { z } from "zod";
import { h } from "preact";
import { useEffect, useMemo, useState } from 'preact/hooks';

const range = (n: number) => [...Array(n).keys()];

class DateHelper {
  sundayLedDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  sundayLedDaysInt = [0, 1, 2, 3, 4, 5, 6];
  totalRows = 6
  totalCells = this.sundayLedDaysInt.length * 2 * this.totalRows;
  constructor(
    public date: Date = new Date(),
    public props: Props
  ) {}
  get availability () {
    return this.props.availablity || {};
  }
  get daysOfTheWeekAvailable () {
    const entries = Object.entries(this.availability)
    return entries.flatMap(([day, times]) => {
      if (times.length === 0) return []
      return [parseInt(day)];
    });
  }
  get startOfTheWeekDay () {
    return this.props.startOfTheWeekDay || 0;
  }
  /** ordered days of the week by startOfTheWeekDay */
  get days (): number[] {
    const { sundayLedDaysInt: days, startOfTheWeekDay: sDay} = this
    if (sDay === 0) return days
    const start = days.slice(sDay, days.length)
    const end = days.slice(0, sDay)
    return [...start, ...end]
  }
  get daysAbrev () {
    return this.days.map(day => this.sundayLedDays[day])
  }
  get monthNumber () {
    return this.date.getMonth()
  }
  get year () {
    return this.date.getFullYear()
  }
  get monthDate () {
    return new Date(this.year, this.monthNumber + 1, 0)
  }
  december = 11;
  get isDecember () {
    return this.monthNumber === this.december
  }
  get nextMonth () {
    if (this.isDecember) {
      return new DateHelper(new Date(this.year + 1, 0, 0), this.props)
    } else {
      return new DateHelper(new Date(this.year, this.monthNumber + 1, 1), this.props)
    }
  }
  get monthName () {
    return this.date.toLocaleString('en-US', {month: 'long'});
  }
  get firstOfTheMonthDate () {
    return new Date(this.year, this.monthNumber, 1)
  }
  get daysInMonth () {
    return this.monthDate.getDate()
  }
  get startingDayOfTheWeek () {
    return this.firstOfTheMonthDate.getDay()
  }
  get numberOfleadingDays () {
    let matchedDayOfTheWeek = false
    let leadingDays = 0;
    this.days.forEach(v => {
      if (matchedDayOfTheWeek) return
      if (v === this.startingDayOfTheWeek) {
        matchedDayOfTheWeek = true
        return;
      }
      leadingDays++
    })
    return leadingDays;
  }
  get leadingDays () {
    return range(this.numberOfleadingDays).map(v => null)
  }
  get daysInMonthRange () {
    return range(this.daysInMonth)
  }
  get monthDays () {
    return this.daysInMonthRange.map(dayIndex => {
      const day = dayIndex+1;
      const mod = ((dayIndex  + this.startingDayOfTheWeek) % 7)
      const dayOfTheWeek = mod
      let isPrev = false;
      let isFollowing = false;
      let isToday = false;
      let isUnavailable = false
      if (day === this.today) {
        isToday = true
      } else if (day < this.today) {
        isPrev = true
        isUnavailable = true
      } else if (day > this.today) {
        isFollowing = true
      }
      const available = this.daysOfTheWeekAvailable.includes(dayOfTheWeek)
      if (!available) isUnavailable = true
      if (restrictToDOW(dayOfTheWeek)) {
        return { isPrev, isFollowing, isToday, isUnavailable, dayOfTheWeek, day, month: this.monthNumber, year: this.year }
      } else {
        throw new Error('dayOfTheWeek is not a proper day')
      }
      
    })
  }
  get today () {
    return this.date.getDate()
  }
}

const restrictToDOW = (x: number): x is (0 | 1 | 2 | 3 | 4 | 5 | 6) => {
  if (x === 0 || x === 1 || x === 2 || x === 3 || x === 4 || x === 5 || x === 6) {
    return true
  }
  return false;
}

interface Props {
  dayOfBooking?: boolean,
  startOfTheWeekDay?: 0 | 1 | 2 | 3 | 4 | 5 | 6,
  availablity?: {
    [0]?: string[]
    [1]?: string[]
    [2]?: string[]
    [3]?: string[]
    [4]?: string[]
    [5]?: string[]
    [6]?: string[]
  }
}

const example: Props = {
  dayOfBooking: true,
  // startOfTheWeekDay: 1,
  availablity: {
    "1": ['12:00pm'],
    "2": ['12:00pm'],
    '3': ['12:00pm'],
    "4": ['12:00pm'],
    "5": ['12:00pm'],
  }
}

interface CellProps {
  isPrev: boolean,
  isFollowing: boolean,
  isToday: boolean,
  isUnavailable: boolean,
  day: number,
  month: number,
  year: number,
  dayOfTheWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

const contactSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});


const daySelectionSchema = z.object({
  day: z.number(),
  month: z.number(),
  year: z.number(),
});


export const postkey = '@reggi/calendarScheduler'

const postbody = z.object({
  [postkey]: z.object({
    daySelection: daySelectionSchema,
    contact: contactSchema,
    selectedTime: z.string()
  })
});

const rawPostBody = z.object({
  daySelection: daySelectionSchema,
  contact: contactSchema,
  selectedTime: z.string()
})

export function Cell (props: CellProps & { onClick: (selection: CellProps) => void }) {
  const { isUnavailable, isToday, day, month, year, dayOfTheWeek, onClick } = props;
  const classes = []
  if (isToday) classes.push(`bg-blue-200`)
  if (isUnavailable) classes.push(`text-center text-gray-400`)
  if (!isUnavailable) classes.push(`text-center rounded-lg bg-blue-100 hover:cursor-pointer hover:bg-blue-200 text-blue-600 font-bold`)
  return <div class={`${classes.join(' ')}`} onClick={() => {
    if (!isUnavailable) onClick(props)
  }}>{day}</div>
}

const Input = ({error, label, placeholder, id, onChange}: { error?: string, label: string, placeholder: string, id: string, onChange: (e: any) => void} ) => (  
  <div className={`grid grid-col-1 gap-2`}>
    <label for={id} class={`form-label inline-block mb-2 text-gray-700`}>{label}</label>
    {error && <div class={`text-red-400`}>{error}</div>}
    <input
      type="text"
      class={`
        form-control
        block
        w-full
        px-3
        py-1.5
        text-base
        font-normal
        text-gray-700
        bg-white bg-clip-padding
        border border-solid border-gray-300
        rounded
        transition
        ease-in-out
        m-0
        focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none
      `}
      id={id}
      onChange={onChange}
      placeholder={placeholder}
    />
  </div>
)

export function Calendar(props: { date?: Date } & Props) {
  const { availablity } = {...props, ...example}
  const originalDate = useMemo(() => new DateHelper(new Date(), example), [])
  const [page, setPage] = useState<'start' | 'nextMonth' | 'time' | 'contact' | 'done'>('start')
  const [monthSelection, setMonthSelection] = useState<'start' | 'nextMonth'>('start')
  const [date, setDate] = useState<DateHelper>(originalDate)
  const [daySelection, setDaySelection] = useState<CellProps | undefined>()
  const [title, setTitle] = useState<string>(date.monthName)
  const [selectedTime, setTime] = useState<string | undefined>(undefined);
  const [contact, setContact] = useState<{ name?: string, email?: string }>({ name: "", email: "" });
  const [contactErrors, setContactErrors] = useState<{ name?: string, email?: string }>({ name: "", email: "" });

  useEffect(() => {
    if (page === 'time') {
      setTitle('Pick a Time')
    } else if (page === 'contact') {
      setTitle('Enter your Info')
    } else if (page === 'done') {
      setTitle('Thanks 👏')
    } else if (page === 'nextMonth') {
      setTitle(originalDate.nextMonth.monthName)
      setDate(originalDate.nextMonth)
      setDaySelection(undefined)
      setMonthSelection('nextMonth')
    } else if (page === 'start') {
      setTitle(originalDate.monthName)
      setDate(originalDate)
      setDaySelection(undefined)
      setMonthSelection('start')
    }
  }, [page])

  const times = useMemo(() => {
    if (!availablity) return []
    if (daySelection?.dayOfTheWeek === undefined) return []
    const key = daySelection.dayOfTheWeek
    const times = availablity[key] || []
    return times
  }, [availablity, daySelection?.dayOfTheWeek])

  const unavailableDirection = `flex-none ml-3 text-center p-1 pl-3 pr-3 rounded-lg bg-gray-100 text-gray-400 font-bold`
  const availableDirection = `flex-none ml-3 text-center p-1 pl-3 pr-3 rounded-lg bg-blue-100 hover:cursor-pointer hover:bg-blue-200 text-blue-600 font-bold`

  return (
    <div class={`w-72`}>

      <div class={`text-center grid gap-3 grid-cols-2 mb-4`}>
        <div class={`mb-2 text-lg text-left`}>
          {title}
        </div>
        <div class={`mb-2 text-lg flex-col-reverse text-right`}>
          <span class={['start', 'done'].includes(page) ? unavailableDirection : availableDirection} onClick={() => {
            if (page === 'start') {
              // noop
            } else if (page === 'nextMonth') {
              setPage('start')
            } else if (page == 'time') {
              setPage(monthSelection)
            } else if (page == 'contact') {
              setPage('time')
            }
          }}>&#8249;</span>
          <span class={['contact', 'time', 'nextMonth', 'done'].includes(page) ? unavailableDirection : availableDirection} onClick={() => {
            if (page === 'start') {
              setPage('nextMonth')
            }
          }}>&#8250;</span>
        </div>
      </div>
      <div>
        {(page === 'start' || page === 'nextMonth') && (
          <div class={`text-center grid gap-4 grid-cols-7`}>
            {date.daysAbrev.map(day => (
              <div class={`font-bold`}>{day}</div>
            ))}
            {date.leadingDays.map(() => (
              <div class={``}></div>
            ))}
            {date.monthDays.map(props => <Cell {...props} onClick={(v) => {
              setPage('time')
              setDaySelection(v)
            }}/>)}
          </div>
        )}
      </div>
      <div>
        {(page === 'time') && (
          <div>
            {times.length ? (
              <div>
                {times.map(time => (
                  <div className={(() => {
                    const classes = ['border border-blue-600 rounded-lg p-3 text-blue-600 font-bold text-center hover:cursor-pointer']
                    if (time === selectedTime) classes.push('bg-blue-100')
                    return `${classes.join(' ')}`
                  })()} onClick={() => {
                    setTime(time)
                    setPage('contact')
                  }}>
                    {time}
                  </div>
                ))}
              </div>
            ) : (
              <span>Sorry no times available for this day.</span>
            )}
          </div>
        )}
      </div>

      <div>
        {(page === 'contact') && (
          <form className={`grid grid-col-1 gap-4`} onSubmit={(e) => {
            e.preventDefault()
            try {
              contactSchema.parse(contact)
              setPage('done')
              postData(window.location.origin, {
                [postkey]: {
                  daySelection,
                  contact,
                  selectedTime,
                }
              })
              // #shipit
            } catch (e) {
              console.log(e)
              e.issues.forEach((e: any) => {
                if (e.path.includes('email')) {
                  setContactErrors(contactErrors => ({ ...contactErrors, email: e.message }))
                } else if (e.path.includes('name')) {
                  setContactErrors(contactErrors => ({ ...contactErrors, name: e.message }))
                }
              })
            }
          }}>
            <Input id="name" placeholder="Your Name" label="Name" error={contactErrors.name} onChange={e => {
              const name = (e.target as HTMLInputElement).value
              setContact(contact => ({ ...contact, name }));
            }}/>
            <Input id="email" placeholder="your@email.com" label="Email" error={contactErrors.email} onChange={e => {
              const email = (e.target as HTMLInputElement).value
              setContact(contact => ({ ...contact, email }));
            }}/>
            <button className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded`}>Submit</button>
          </form>
        )}
      </div>

      <div>
        {(page === 'done') && (
          <div className={`text-center text-xlg mt-10`}>
            Thanks for scheduling some time!
          </div>
        )}
      </div>

    </div>
  );
}

async function postData(url = '', data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json'
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

export async function calendarServer (data: z.infer<typeof postbody> | z.infer<typeof rawPostBody>, prisma = new PrismaClient()) {
  const full = postbody.safeParse(data)
  const part = rawPostBody.safeParse(data)
  if (full.success || part.success) {
    await prisma.calendar.create({
      data: {
        blob: data,
      },
    })
  }
}
