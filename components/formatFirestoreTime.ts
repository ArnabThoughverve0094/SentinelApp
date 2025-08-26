export function formatFirestoreTime(date: Date): string {
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  
    const minute = 60;
    const hour = 60 * minute;
    const day = 24 * hour;
  
    if (diffSec < minute) {
      return `${diffSec} sec${diffSec !== 1 ? 's' : ''} ago`;
    } else if (diffSec < hour) {
      const mins = Math.floor(diffSec / minute);
      return `${mins} min${mins !== 1 ? 's' : ''} ago`;
    } else if (diffSec < day) {
      const hrs = Math.floor(diffSec / hour);
      return `${hrs} hr${hrs !== 1 ? 's' : ''} ago`;
    }
  
    // Older than a day: format as "DD.MM.YYYY HH:mm"
    const d = date;
    const DD = String(d.getDate()).padStart(2, '0');
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const YYYY = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
  
    return `${DD}.${MM}.${YYYY} ${hh}:${mm}`;
  }
  