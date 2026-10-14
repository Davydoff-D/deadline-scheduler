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
    const priorityColor = {
      high: '#dc2626',
      medium: '#f59e0b',
      low: '#10b981',
    }[deadline.priority];

    return {
      id: deadline.id.toString(),
      title: deadline.title,
      start: deadline.due_date,
      end: deadline.due_date,
      backgroundColor: priorityColor,
      borderColor: priorityColor,
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

    try {
      const deadlineId = parseInt(dropInfo.event.id);
      const newDate = dropInfo.event.start?.toISOString();
      if (newDate) {
        await onDeadlineDrop(deadlineId, newDate);
      }
    } catch (error) {
      console.error('Failed to update deadline date:', error);
      dropInfo.revert();
    }
  };

  return (
    <div className="w-full bg-slate-900 rounded-2xl shadow-xl shadow-slate-950/50 p-6">
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
        height="auto"
        dayMaxEvents={3}
        eventDisplay="block"
      />
    </div>
  );
}
