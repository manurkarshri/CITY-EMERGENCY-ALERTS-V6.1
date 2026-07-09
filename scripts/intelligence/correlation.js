export function correlateEvents(events = []) {
  return events.map(event => {
    const related = events
      .filter(other => other.id !== event.id)
      .filter(other => (event.localities || []).some(x => (other.localities || []).includes(x)))
      .map(other => other.id);
    return { ...event, relatedEventIds: [...new Set([...(event.relatedEventIds || []), ...related])] };
  });
}
