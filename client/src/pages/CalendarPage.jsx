import { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { ordersApi } from '../services/ordersApi'; // Updated import
import PageShell from '../components/ui/PageShell';
import Card from '../components/ui/Card';
import DayDetailModal from '../components/calendar/DayDetailModal';
import EventDetailModal from '../components/calendar/EventDetailModal'; // New Import

export default function CalendarPage() {
    const [selectedDay, setSelectedDay] = useState(null); // For day click
    const [selectedEventId, setSelectedEventId] = useState(null); // For event click
    const calendarRef = useRef(null);

    // Función de carga dinámica para FullCalendar
    const fetchEvents = async (fetchInfo, successCallback, failureCallback) => {
        try {
            const { startStr, endStr } = fetchInfo;
            // Use Lite endpoint
            const res = await ordersApi.getCalendarEventsLite(startStr, endStr);
            successCallback(res.data);
        } catch (e) {
            console.error("Calendar fetch error", e);
            failureCallback(e);
        }
    };

    const handleDateClick = (arg) => {
        // Al hacer click en un día (celda vacía o día), mostramos resumen del día
        // Reutilizamos la lógica existente de DayDetailModal
        const calendarApi = calendarRef.current.getApi();
        const events = calendarApi.getEvents();

        const dayEvents = events.filter(evt => {
            const d = evt.start;
            return d && d.toISOString().split('T')[0] === arg.dateStr;
        });

        setSelectedDay({
            date: arg.date,
            events: dayEvents.map(e => ({
                id: e.id,
                title: e.title,
                start: e.start,
                extendedProps: e.extendedProps
            }))
        });
    };

    const handleEventClick = (info) => {
        // Prevenir que el click se propague al día (opcional, pero útil)
        info.jsEvent.stopPropagation();

        // Abrir Modal de Detalle
        setSelectedEventId(info.event.id);
    };

    return (
        <PageShell title="Calendario de Entregas">
            <Card>
                <div className="h-[75vh]">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        locale={esLocale}
                        events={fetchEvents}
                        dateClick={handleDateClick}
                        eventClick={handleEventClick}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek'
                        }}
                        height="100%"
                        dayMaxEvents={true}
                        eventTimeFormat={{
                            hour: '2-digit',
                            minute: '2-digit',
                            meridiem: 'short'
                        }}
                    />
                </div>
            </Card>

            {/* Modal de Día (Resumen) */}
            {selectedDay && (
                <DayDetailModal
                    date={selectedDay.date}
                    events={selectedDay.events}
                    onClose={() => setSelectedDay(null)}
                    onRefresh={() => calendarRef.current?.getApi().refetchEvents()}
                />
            )}

            {/* Modal de Evento Individual (Detalle Lite -> Full) */}
            {selectedEventId && (
                <EventDetailModal
                    eventId={selectedEventId}
                    onClose={() => setSelectedEventId(null)}
                />
            )}
        </PageShell>
    );
}
