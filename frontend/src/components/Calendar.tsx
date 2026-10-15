import { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';
import type { Deadline } from '../types';

interface CalendarProps {
  deadlines: Deadline[];
  onDateSelect: (date: Date) => void;
  onDeadlineClick: (deadline: Deadline) => void;
  onDeadlineDrop?: (deadlineId: number, newDate: string) => Promise<void>;
}

export function Calendar({
  deadlines,
  onDateSelect,
  onDeadlineClick,
  onDeadlineDrop,
}: CalendarProps) {
  const calendarRef = useRef(null);

  const events = deadlines.map((deadline) => {
    const priorityColor = deadline.is_completed
      ? '#64748b'
      : {
          high: '#dc2626',
          medium: '#f59e0b',
          low: '#10b981',
        }[deadline.priority];

    return {
      id: deadline.id.toString(),
      title: deadline.title,
      start: deadline.due_date,
      allDay: true,
      backgroundColor: priorityColor,
      borderColor: priorityColor,
      classNames: ['deadline-event'],
      extendedProps: {
        deadline,
      },
    };
  });

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    onDateSelect(selectInfo.start);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const deadline = clickInfo.event.extendedProps.deadline as Deadline;
    onDeadlineClick(deadline);
  };

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    if (!onDeadlineDrop) return;

    console.log('Drop event:', {
      eventId: dropInfo.event.id,
      oldStart: dropInfo.oldEvent.start,
      newStart: dropInfo.event.start,
    });

    try {
      const deadlineId = parseInt(dropInfo.event.id);
      const originalDeadline = dropInfo.event.extendedProps.deadline as Deadline;
      
      const newDate = dropInfo.event.start;
      if (newDate && originalDeadline) {
        const originalTime = new Date(originalDeadline.due_date);
        newDate.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);
        console.log('Updating deadline to:', newDate.toISOString());
        await onDeadlineDrop(deadlineId, newDate.toISOString());
      }
    } catch (error) {
      console.error('Failed to update deadline date:', error);
      dropInfo.revert();
    }
  };

  return (
    <div className="w-full bg-slate-900/95 rounded-2xl shadow-2xl shadow-slate-950/50 p-6 border border-slate-800/50">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        selectable={true}
        select={handleDateSelect}
        eventClick={handleEventClick}
        editable={true}
        eventDrop={handleEventDrop}
        eventDragMinDistance={3}
        dragRevertDuration={150}
        dragScroll={true}
        snapDuration="1:00:00"
        eventOverlap={true}
        height="auto"
        dayMaxEvents={3}
        eventDisplay="block"
        firstDay={1}
      />
    </div>
  );
}
