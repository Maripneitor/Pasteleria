import { useEffect, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import client from '../config/axios';
import PageShell from '../components/ui/PageShell';
import Card from '../components/ui/Card';
import DayDetailModal from '../components/calendar/DayDetailModal';
import { useNavigate } from 'react-router-dom';

export default function CalendarPage() {
    const [selectedDay, setSelectedDay] = useState(null); // { date: Date, events: [] }
    const calendarRef = useRef(null);
    const navigate = useNavigate();

    // Función de carga dinámica para FullCalendar
    const fetchEvents = async (fetchInfo, successCallback, failureCallback) => {
        try {
            const { startStr, endStr } = fetchInfo;
            const res = await client.get(`/folios/calendar?start=${startStr}&end=${endStr}`);
            successCallback(res.data);
        } catch (e) {
            console.error("Calendar fetch error", e);
            failureCallback(e);
        }
    };

    const handleDateClick = (arg) => {
        // Al hacer click en un día, buscamos los eventos de ese día visualmente o via API
        // Usamos la API del calendario para obtener los eventos cacheados
        const calendarApi = calendarRef.current.getApi();
        const events = calendarApi.getEvents();

        // Filtrar eventos del día seleccionado
        const dayEvents = events.filter(evt => {
            const d = evt.start; // Date object
            // Comparar strings YYYY-MM-DD
            return d.toISOString().split('T')[0] === arg.dateStr;
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
        // Navegar directo a editar o abrir modal de día?
        // El requisito dice "Click en evento: abre detalle/edición"
        navigate(`/pedidos/${info.event.id}/editar`);
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
                    />
                </div>
            </Card>

            {selectedDay && (
                <DayDetailModal
                    date={selectedDay.date}
                    events={selectedDay.events}
                    onClose={() => setSelectedDay(null)}
                    onRefresh={() => calendarRef.current?.getApi().refetchEvents()}
                />
            )}
        </PageShell>
    );
}
