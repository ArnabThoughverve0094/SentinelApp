export const getMediaType = (url: string): string => {
  if (!url) return 'unknown';
  
  const lower = url.toLowerCase();
  const urlPath = lower.split('?')[0];
  
  if (urlPath.match(/\.(mp4|mov|avi|mkv|webm|m4v)$/)) return 'video';
  if (urlPath.match(/\.(jpg|jpeg|png|bmp|webp)$/)) return 'image';
  if (urlPath.match(/\.gif$/)) return 'gif';
  if (urlPath.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/)) return 'doc';
  
  if (lower.includes('unsplash.com') || lower.includes('images.') || 
      lower.includes('photo') || lower.includes('img.') || 
      lower.includes('picture')) return 'image';
      
  if (lower.includes('video') || lower.includes('youtube') || 
      lower.includes('vimeo')) return 'video';
  
  if (lower.startsWith('http') && !urlPath.includes('.')) return 'image';
  
  return urlPath.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/) ? 'doc' : 'image';
};
