import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export function useEmbedMode(): boolean {
  const [isEmbed, setIsEmbed] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const embed = params.get('embed') === 'true';
      setIsEmbed(embed);
      console.log('Embed mode:', embed);
    }
  }, []);

  return isEmbed;
}

export function postResultToParent(data: {
  businessDays: number;
  totalCalendarDays: number;
  weekendDays: number;
  holidays: number;
  startDate: string;
  endDate: string;
}) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      window.parent.postMessage(
        { type: 'BUSINESS_DAYS_RESULT', ...data },
        '*'
      );
      console.log('Posted result to parent:', data);
    } catch (e) {
      console.log('postMessage failed:', e);
    }
  }
}
