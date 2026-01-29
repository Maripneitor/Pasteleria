import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import client from '../config/axios';
import PageShell from '../components/ui/PageShell';
import Card from '../components/ui/Card';

export default function CalendarPage() {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        // Fetch events for a wide range or handle dynamic fetching via FullCalendar's 'events' prop function
        // For simplicity, fetching current month + slack
        const fetchEvents = async () => {
            try {
                // Using a broad range for now, ideally FullCalendar calls this with start/end
                const res = await client.get('/folios/calendar?start=2024-01-01&end=2026-12-31');
                setEvents(res.data);
            } catch (e) {
                console.error("Calendar fetch error", e);
            }
        };
        fetchEvents();
    }, []);

    return (
        <PageShell title="Calendario de Entregas">
            <Card>
                <div className="h-[75vh]">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        locale={esLocale}
                        events={events}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek'
                        }}
                        height="100%"
                        eventClick={(info) => {
                            alert(`Folio: ${info.event.title}\nEstado: ${info.event.extendedProps.status}`);
                            // Can navigate to edit page here
                        }}
                    />
                </div>
            </Card>
        </PageShell>
    );
}
