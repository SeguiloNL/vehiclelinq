import { useEffect, useRef } from 'react';
import maplibregl, { type LngLatLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { HistoryPoint, VehicleLiveState } from '@vehiclelinq/shared';

interface MapPanelProps {
  tileUrl: string;
  attribution: string;
  center: LngLatLike;
  zoom: number;
  liveStates?: VehicleLiveState[];
  historyPoints?: HistoryPoint[];
}

export function MapPanel({
  tileUrl,
  attribution,
  center,
  zoom,
  liveStates = [],
  historyPoints = [],
}: MapPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 256,
            attribution,
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center,
      zoom,
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [attribution, center, tileUrl, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const markers = liveStates.map((state) => {
      const el = document.createElement('div');
      el.className = 'h-4 w-4 rounded-full border-2 border-white shadow-lg';
      el.style.background = state.online ? '#10b981' : '#64748b';
      return new maplibregl.Marker(el)
        .setLngLat([state.lng, state.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 16 }).setHTML(
            `<strong>${state.trackerImei}</strong><br/>${state.speedKph} km/u`,
          ),
        )
        .addTo(map);
    });

    return () => markers.forEach((marker) => marker.remove());
  }, [liveStates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const sourceId = 'history-route';
    const layerId = 'history-route-line';
    const coordinates = historyPoints.map((point) => [point.lng, point.lat]);

    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    if (!coordinates.length) {
      return;
    }

    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates,
        },
        properties: {},
      },
    });

    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-width': 4,
        'line-color': '#38bdf8',
      },
    });

    return () => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  }, [historyPoints]);

  return <div ref={containerRef} className="h-full min-h-[420px] w-full rounded-3xl" />;
}
