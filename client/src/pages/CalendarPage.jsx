import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Cake, Loader } from 'lucide-react';
import axios from '../config/axios';

const CalendarPage = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            const start = format(startOfWeek(startOfMonth(currentDate)), 'yyyy-MM-dd');
            const end = format(endOfWeek(endOfMonth(currentDate)), 'yyyy-MM-dd');
            try {
                const res = await axios.get(`/folios/calendar?start=${start}&end=${end}`);
                setEvents(res.data);
            } catch (error) {
                console.error("Error fetching calendar events", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [currentDate]);

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentDate)),
        end: endOfWeek(endOfMonth(currentDate))
    });

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Horneado': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Decorado': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Entregado': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="p-6 h-full flex flex-col fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <Cake className="text-pink-500" /> Agenda de Producción
                </h1>

                <div className="flex items-center bg-white rounded-xl shadow-sm border p-1">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition"><ChevronLeft size={20} /></button>
                    <span className="w-48 text-center font-bold text-lg capitalize text-gray-700">
                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                    </span>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition"><ChevronRight size={20} /></button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col min-h-[600px]">
                {/* Cabecera Días */}
                <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                        <div key={d} className="py-3 text-center font-bold text-gray-400 text-sm uppercase tracking-wide">{d}</div>
                    ))}
                </div>

                {/* Celdas Días */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                    {days.map((day, idx) => {
                        const dayEvents = events.filter(e => isSameDay(parseISO(e.fecha_entrega), day));
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div
                                key={idx}
                                className={`border-b border-r border-gray-100 p-2 transition-colors relative min-h-[100px]
                  ${!isSameMonth(day, currentDate) ? 'bg-gray-50/50' : 'bg-white'}
                  ${isToday ? 'bg-pink-50/30' : ''}
                  hover:bg-gray-50
                `}
                            >
                                <div className={`text-sm font-bold mb-2 flex justify-between items-center ${isToday ? 'text-pink-600' : 'text-gray-500'}`}>
                                    <span className={isToday ? 'bg-pink-500 text-white w-7 h-7 flex items-center justify-center rounded-full shadow-md' : ''}>
                                        {format(day, 'd')}
                                    </span>
                                    {dayEvents.length > 0 && <span className="text-[10px] text-gray-400">{dayEvents.length} pedidos</span>}
                                </div>

                                <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                                    {dayEvents.slice(0, 4).map(ev => (
                                        <div
                                            key={ev.id}
                                            className={`text-[10px] px-2 py-1 rounded border truncate font-medium cursor-pointer transition hover:scale-105 ${getStatusColor(ev.estatus_produccion)}`}
                                            title={`${ev.hora_entrega} - ${ev.cliente_nombre}`}
                                        >
                                            <span className="font-bold mr-1">{ev.hora_entrega.slice(0, 5)}</span>
                                            {ev.cliente_nombre}
                                        </div>
                                    ))}
                                    {dayEvents.length > 4 && (
                                        <div className="text-[10px] text-center text-gray-400 font-medium cursor-pointer hover:text-pink-500">
                                            Ver {dayEvents.length - 4} más...
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;
