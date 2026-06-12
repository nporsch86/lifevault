export interface ParsedCommand {
  action: 'add' | 'move' | 'unknown';
  title?: string;
  date?: string;
  time?: string;
}

export function parseVoiceCommand(text: string): ParsedCommand {
  const normalized = text.toLowerCase();
  
  if (normalized.includes('add')) {
    // "Add meeting tomorrow at 2pm"
    // "Add gym session on Friday"
    const addMatch = normalized.match(/add\s+(.*?)(?:\s+(at|on|tomorrow|today|next|this))|$|/);
    const title = addMatch ? addMatch[1].trim() : '';
    
    let date = new Date().toISOString().split('T')[0];
    if (normalized.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      date = tomorrow.toISOString().split('T')[0];
    } else if (normalized.includes('friday')) {
      date = getNextDayOfWeek(5);
    } else if (normalized.includes('monday')) {
      date = getNextDayOfWeek(1);
    } else if (normalized.includes('tuesday')) {
      date = getNextDayOfWeek(2);
    } else if (normalized.includes('wednesday')) {
      date = getNextDayOfWeek(3);
    } else if (normalized.includes('thursday')) {
      date = getNextDayOfWeek(4);
    }
    // ... basic date parsing logic
    
    const timeMatch = normalized.match(/(?:at|@)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/);
    let time = timeMatch ? formatTime(timeMatch[1]) : '09:00';

    return { action: 'add', title, date, time };
  } else if (normalized.includes('move') || normalized.includes('change')) {
    // "Move dentist to Friday"
    const moveMatch = normalized.match(/(?:move|change)\s+(.*?)\s+to\s+(.*)/);
    const title = moveMatch ? moveMatch[1].trim() : '';
    const dateStr = moveMatch ? moveMatch[2].trim() : '';
    
    let date = '';
    if (dateStr.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      date = tomorrow.toISOString().split('T')[0];
    } else if (dateStr.includes('friday')) date = getNextDayOfWeek(5);
    else if (dateStr.includes('monday')) date = getNextDayOfWeek(1);
    else if (dateStr.includes('tuesday')) date = getNextDayOfWeek(2);
    else if (dateStr.includes('wednesday')) date = getNextDayOfWeek(3);
    else if (dateStr.includes('thursday')) date = getNextDayOfWeek(4);
    // ... basic date parsing logic
    
    return { action: 'move', title, date };
  }

  return { action: 'unknown' };
}

function getNextDayOfWeek(dayOfWeek: number): string {
  const today = new Date();
  const resultDate = new Date(today.getTime());
  resultDate.setDate(today.getDate() + (7 + dayOfWeek - today.getDay()) % 7);
  if (resultDate <= today) resultDate.setDate(resultDate.getDate() + 7);
  return resultDate.toISOString().split('T')[0];
}

function formatTime(timeStr: string): string {
  let [time, modifier] = timeStr.split(/\s*(am|pm)/i);
  let [hours, minutes] = time.split(':');
  if (hours === '12') hours = '00';
  if (modifier?.toLowerCase() === 'pm') hours = (parseInt(hours, 10) + 12).toString();
  if (!minutes) minutes = '00';
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}
