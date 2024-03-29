import { Handlers, PageProps } from 'fresh/server.ts';

import { Calendar, CalendarEvent, FreshContextState } from '/lib/types.ts';
import { getCalendarEvents, getCalendars } from '/lib/data/calendar.ts';
import CalendarWrapper from '/islands/calendar/CalendarWrapper.tsx';

interface Data {
  userCalendars: Pick<Calendar, 'id' | 'name' | 'color' | 'is_visible' | 'extra'>[];
  userCalendarEvents: CalendarEvent[];
  view: 'day' | 'week' | 'month';
  startDate: string;
}

export const handler: Handlers<Data, FreshContextState> = {
  async GET(request, context) {
    if (!context.state.user) {
      return new Response('Redirect', { status: 303, headers: { 'Location': `/login` } });
    }

    const searchParams = new URL(request.url).searchParams;

    const view = (searchParams.get('view') as Data['view']) || 'week';
    const startDate = searchParams.get('startDate') || new Date().toISOString().substring(0, 10);

    const userCalendars = await getCalendars(context.state.user.id);
    const visibleCalendarIds = userCalendars.filter((calendar) => calendar.is_visible).map((calendar) => calendar.id);

    const dateRange = { start: new Date(startDate), end: new Date(startDate) };

    if (view === 'day') {
      dateRange.start.setDate(dateRange.start.getDate() - 1);
      dateRange.end.setDate(dateRange.end.getDate() + 1);
    } else if (view === 'week') {
      dateRange.start.setDate(dateRange.start.getDate() - 7);
      dateRange.end.setDate(dateRange.end.getDate() + 7);
    } else {
      dateRange.start.setDate(dateRange.start.getDate() - 7);
      dateRange.end.setDate(dateRange.end.getDate() + 31);
    }

    const userCalendarEvents = await getCalendarEvents(context.state.user.id, visibleCalendarIds);

    return await context.render({ userCalendars, userCalendarEvents, view, startDate });
  },
};

export default function CalendarPage({ data }: PageProps<Data, FreshContextState>) {
  return (
    <main>
      <CalendarWrapper
        initialCalendars={data.userCalendars}
        initialCalendarEvents={data.userCalendarEvents}
        view={data.view}
        startDate={data.startDate}
      />
    </main>
  );
}
