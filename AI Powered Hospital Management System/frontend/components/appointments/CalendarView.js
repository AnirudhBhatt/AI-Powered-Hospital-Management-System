'use client';

import { useState } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getStatusColor(status) {
  switch(status) {
    case 'Requested': return '#fbbf24';
    case 'Confirmed': return '#60a5fa';
    case 'In Consultation': return '#a78bfa';
    case 'Completed': return '#34d399';
    case 'Cancelled': return '#f87171';
    default: return '#6366f1';
  }
}

export default function CalendarView({ appointments = [], onDateClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }
  
  function getAppointmentsForDay(day) {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.getDate() === day && aptDate.getMonth() === month && aptDate.getFullYear() === year;
    });
  }
  
  const today = new Date();
  const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const cells = [];
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="calendar-cell empty" />);
  }
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayAppts = getAppointmentsForDay(day);
    cells.push(
      <div
        key={day}
        className={`calendar-cell${isToday(day) ? ' today' : ''}${dayAppts.length > 0 ? ' has-appointments' : ''}`}
        onClick={() => onDateClick?.(new Date(year, month, day))}
      >
        <span className="calendar-day-number">{day}</span>
        {dayAppts.length > 0 && (
          <div className="calendar-dots">
            {dayAppts.slice(0, 3).map((apt, i) => (
              <span key={i} className="calendar-dot" style={{ background: getStatusColor(apt.status) }} title={`${apt.timeSlot} - ${apt.status}`} />
            ))}
            {dayAppts.length > 3 && <span className="calendar-more">+{dayAppts.length - 3}</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button className="btn btn-ghost btn-sm" onClick={prevMonth}>◀</button>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{MONTHS[month]} {year}</h3>
        <button className="btn btn-ghost btn-sm" onClick={nextMonth}>▶</button>
      </div>
      <div className="calendar-grid">
        {DAYS.map(d => <div key={d} className="calendar-day-header">{d}</div>)}
        {cells}
      </div>
      <div className="calendar-legend">
        {['Requested','Confirmed','In Consultation','Completed','Cancelled'].map(s => (
          <span key={s} className="calendar-legend-item">
            <span className="calendar-dot" style={{ background: getStatusColor(s) }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
