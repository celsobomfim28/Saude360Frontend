import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix para ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  patientName: string;
  status: 'GREEN' | 'YELLOW' | 'RED';
  criticalCount?: number;
  microArea?: string;
}

interface InteractiveMapProps {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onMarkerClick?: (point: MapPoint) => void;
}

export default function InteractiveMap({
  points,
  center = [-10.7313776, -37.186328499999995], // Riachuelo/SE como centro padrão
  zoom = 13,
  height = '500px',
  onMarkerClick,
}: InteractiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Inicializar mapa
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(center, zoom);

      // Adicionar camada de tiles (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    // Limpar marcadores existentes
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current?.removeLayer(layer);
      }
    });

    // Adicionar marcadores
    if (points && points.length > 0) {
      const bounds: L.LatLngBoundsExpression = [];

      points.forEach((point) => {
        if (!point.lat || !point.lng) return;

        // Definir cor do marcador baseado no status
        const color =
          point.status === 'RED'
            ? '#ef4444'
            : point.status === 'YELLOW'
            ? '#f59e0b'
            : '#10b981';

        // Criar ícone customizado
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background-color: ${color};
              width: 30px;
              height: 30px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                transform: rotate(45deg);
                color: white;
                font-weight: bold;
                font-size: 12px;
              ">
                ${point.criticalCount || ''}
              </div>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 30],
          popupAnchor: [0, -30],
        });

        const marker = L.marker([point.lat, point.lng], { icon }).addTo(mapRef.current!);

        // Adicionar popup
        const popupContent = `
          <div style="padding: 8px; min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${point.patientName}</h4>
            ${point.microArea ? `<p style="margin: 4px 0; font-size: 12px; color: #666;">Microárea: ${point.microArea}</p>` : ''}
            ${point.criticalCount ? `<p style="margin: 4px 0; font-size: 12px; color: #666;">${point.criticalCount} indicadores críticos</p>` : ''}
            <div style="
              margin-top: 8px;
              padding: 4px 8px;
              background-color: ${color}20;
              border-radius: 4px;
              text-align: center;
              font-size: 11px;
              font-weight: 600;
              color: ${color};
            ">
              Status: ${point.status === 'RED' ? 'Crítico' : point.status === 'YELLOW' ? 'Atenção' : 'Normal'}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        // Evento de clique
        if (onMarkerClick) {
          marker.on('click', () => onMarkerClick(point));
        }

        bounds.push([point.lat, point.lng]);
      });

      // Ajustar visualização para mostrar todos os marcadores
      if (bounds.length > 0) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    return () => {
      // Cleanup não é necessário pois reutilizamos o mapa
    };
  }, [points, center, zoom, onMarkerClick]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        height,
        width: '100%',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        position: 'relative',
      }}
    />
  );
}
