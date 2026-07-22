'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface CalendarDatePickerProps {
  serviceId: string;
  businessId: string;
  onDateTimeSelect: (date: string, time: string) => void;
  isLoading?: boolean;
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const WEEKDAYS_ES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

function todayLimaStr(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

const CACHE_TTL_MS = 12 * 60 * 1000;

export default function CalendarDatePicker({ serviceId, businessId, onDateTimeSelect, isLoading }: CalendarDatePickerProps) {
  const today = todayLimaStr();
  const [todayYear, todayMonth] = today.split('-').map(Number);

  const [viewYear, setViewYear] = useState(todayYear);
  const [viewMonth, setViewMonth] = useState(todayMonth); // 1-12

  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState('');

  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const cacheKeyFor = useCallback(
    (year: number, month: number) => `nc_calendar_${businessId}_${serviceId}_${monthKey(year, month)}`,
    [businessId, serviceId]
  );

  const loadCalendar = useCallback(async (year: number, month: number) => {
    if (!serviceId || !businessId) return;
    setCalendarError('');
    setCalendarLoading(true);

    const key = cacheKeyFor(year, month);
    try {
      const cachedRaw = localStorage.getItem(key);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as { ts: number; availability: Record<string, boolean> };
        if (Date.now() - cached.ts < CACHE_TTL_MS) {
          setAvailability(cached.availability);
          setCalendarLoading(false);
          return;
        }
      }
    } catch {
      // localStorage inaccesible o corrupto — ignorar caché
    }

    try {
      const res = await api.get(`/bookings/calendar/${businessId}`, {
        params: { month: monthKey(year, month), serviceId },
      });
      const avail = res.data.availability ?? {};
      setAvailability(avail);
      try {
        localStorage.setItem(key, JSON.stringify({ ts: Date.now(), availability: avail }));
      } catch {
        // cuota de localStorage excedida — seguir sin caché
      }
    } catch (err: any) {
      setAvailability({});
      setCalendarError(err.response?.data?.error || 'No se pudo cargar el calendario. Intenta de nuevo.');
    } finally {
      setCalendarLoading(false);
    }
  }, [serviceId, businessId, cacheKeyFor]);

  useEffect(() => {
    setSelectedDate('');
    setSlots([]);
    setSelectedTime('');
    setSlotsError('');
    loadCalendar(viewYear, viewMonth);
  }, [viewYear, viewMonth, loadCalendar]);

  const loadSlots = useCallback(async (date: string) => {
    setSlotsLoading(true);
    setSlotsError('');
    setSlots([]);
    setSelectedTime('');
    try {
      const res = await api.get(`/bookings/slots/${serviceId}`, { params: { date } });
      setSlots(res.data.slots ?? []);
      if ((res.data.slots ?? []).length === 0) {
        setSlotsError(res.data.message || 'No hay horarios disponibles ese día.');
      }
    } catch (err: any) {
      setSlotsError(err.response?.data?.error || 'No se pudieron cargar los horarios.');
    } finally {
      setSlotsLoading(false);
    }
  }, [serviceId]);

  const handleSelectDay = (date: string, available: boolean) => {
    if (!available) return;
    setSelectedDate(date);
    loadSlots(date);
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    onDateTimeSelect(selectedDate, time);
  };

  const goPrevMonth = () => {
    if (viewYear === todayYear && viewMonth === todayMonth) return;
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  };
  const goNextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  };

  const isPrevDisabled = viewYear === todayYear && viewMonth === todayMonth;

  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const firstOfMonth = new Date(viewYear, viewMonth - 1, 1);
    // getDay(): 0=domingo..6=sábado → convertir a semana que empieza lunes (0=lunes..6=domingo)
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7;

    const cells: { date: string; day: number; available: boolean; isToday: boolean }[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push({ date: '', day: 0, available: false, isToday: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ date, day: d, available: !!availability[date], isToday: date === today });
    }
    return cells;
  }, [viewYear, viewMonth, availability, today]);

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      {/* Header: navegación de mes */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <button
          type="button"
          onClick={goPrevMonth}
          disabled={isPrevDisabled}
          aria-label="Mes anterior"
          className="w-11 h-11 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-sm font-bold text-gray-900" aria-live="polite">
          {MONTHS_ES[viewMonth - 1]} {viewYear}
        </p>
        <button
          type="button"
          onClick={goNextMonth}
          aria-label="Mes siguiente"
          className="w-11 h-11 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4">
        {calendarError && (
          <div className="mb-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg px-3 py-2.5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {calendarError}
          </div>
        )}

        {calendarLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {WEEKDAYS_ES.map(w => (
                <div key={w} className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  {w}
                </div>
              ))}
            </div>

            {/* Grid de días */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarCells.map((cell, i) =>
                cell.date === '' ? (
                  <div key={`empty-${i}`} />
                ) : (
                  <button
                    key={cell.date}
                    type="button"
                    disabled={!cell.available}
                    onClick={() => handleSelectDay(cell.date, cell.available)}
                    aria-label={`${cell.day} ${cell.available ? 'disponible' : 'no disponible'}`}
                    aria-pressed={selectedDate === cell.date}
                    className={[
                      'aspect-square min-h-[44px] rounded-lg text-sm font-semibold transition-colors flex items-center justify-center',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                      cell.isToday ? 'ring-2 ring-indigo-400' : '',
                      selectedDate === cell.date
                        ? 'bg-indigo-600 text-white'
                        : cell.available
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-300 cursor-not-allowed',
                    ].join(' ')}
                  >
                    {cell.day}
                  </button>
                )
              )}
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-4 mt-4 text-[11px] text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-green-100 border border-green-200" /> Disponible
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200" /> No disponible
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm ring-2 ring-indigo-400" /> Hoy
              </span>
            </div>
          </>
        )}

        {/* Slots de hora del día seleccionado */}
        {selectedDate && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              Horarios disponibles
            </p>

            {slotsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              </div>
            ) : slotsError ? (
              <div className="bg-amber-50 border border-amber-100 text-amber-700 text-xs rounded-lg px-3 py-2.5 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {slotsError}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map(time => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleSelectTime(time)}
                    disabled={isLoading}
                    aria-pressed={selectedTime === time}
                    className={`min-h-[44px] rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 ${
                      selectedTime === time
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-indigo-50 border border-gray-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
