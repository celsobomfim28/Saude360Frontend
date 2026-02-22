import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

interface MicroArea {
  id: string;
  name: string;
  code: string;
}

interface Professional {
  id: string;
  fullName: string;
  role: string;
}

export function useReportOptions() {
  const { data: microAreas, isLoading: loadingMicroAreas } = useQuery({
    queryKey: ['report-micro-areas'],
    queryFn: async () => {
      const response = await api.get('/reports/micro-areas');
      return response.data.data as MicroArea[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const { data: professionals, isLoading: loadingProfessionals } = useQuery({
    queryKey: ['report-professionals'],
    queryFn: async () => {
      const response = await api.get('/reports/professionals');
      return response.data.data as Professional[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    microAreas: microAreas || [],
    professionals: professionals || [],
    isLoading: loadingMicroAreas || loadingProfessionals,
  };
}
