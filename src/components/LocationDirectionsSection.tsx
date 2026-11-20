import { useCallback, useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  AlertCircle,
  Bus,
  Car,
  Crosshair,
  ExternalLink,
  Footprints,
  MapPin,
  Navigation,
  Route as RouteIcon,
} from 'lucide-react';

const VENUE_ADDRESS =
  'NO. 27-1, Jalan 7/7C, Seksyen 7, 43650 Bandar Baru Bangi, Selangor';

const BANGI_DEFAULT_VIEWPORT_CENTER = { lat: 2.9614, lng: 101.7667 };

type TravelModeOption = 'DRIVING' | 'TRANSIT' | 'WALKING';

interface LatLngPoint {
  lat: number;
  lng: number;
}

interface PolylineHandle {
  setOptions: (opts: {
    strokeColor?: string;
    strokeWeight?: number;
    strokeOpacity?: number;
  }) => void;
  setMap: (map: unknown | null) => void;
}

interface LatLngAccessor {
  lat: () => number;
  lng: () => number;
}

interface PlaceSearchResult {
  location?: LatLngAccessor;
}

interface AutocompleteSuggestionItem {
  placePrediction?: {
    text: { text: string };
    toPlace: () => {
      fetchFields: (opts: { fields: string[] }) => Promise<void>;
      location?: LatLngAccessor;
    };
  };
}

interface RouteStepSummary {
  instruction: string;
  distanceMeters: number;
}

interface ComputedRouteSummary {
  distanceMeters: number;
  durationMillis: number;
  steps: RouteStepSummary[];
  originPosition?: LatLngPoint;
  destinationPosition?: LatLngPoint;
}

function isQuotaError(err: unknown): boolean {
  const msg = String(err ?? '');
  return (
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('429') ||
    msg.includes('QuotaExceeded')
  );
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

function formatDuration(millis: number): string {
  const totalMins = Math.max(1, Math.round(millis / 60000));
  if (totalMins < 60) return `${totalMins} minit`;
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `${hrs} jam ${mins} minit` : `${hrs} jam`;
}

interface MapCanvasProps {
  originInput: LatLngPoint | string | null;
  travelMode: TravelModeOption;
  onRouteComputed: (summary: ComputedRouteSummary | null) => void;
  onRouteLoading: (loading: boolean) => void;
  onRouteError: (msg: string) => void;
}

function MapCanvas({
  originInput,
  travelMode,
  onRouteComputed,
  onRouteLoading,
  onRouteError,
}: MapCanvasProps) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const placesLib = useMapsLibrary('places');

  const polylinesRef = useRef<PolylineHandle[]>([]);
  const [venueLocation, setVenueLocation] = useState<LatLngPoint | null>(null);
  const [originLocation, setOriginLocation] = useState<LatLngPoint | null>(null);
  const [infoOpen, setInfoOpen] = useState(true);
  const [destMarkerRef, destMarker] = useAdvancedMarkerRef();

  // Resolve official destination marker dynamically using Places API (New)
  useEffect(() => {
    if (!placesLib || venueLocation) return;
    let cancelled = false;

    const searchFn = (
      placesLib.Place as unknown as {
        searchByText?: (req: {
          textQuery: string;
          fields: string[];
          maxResultCount?: number;
        }) => Promise<{ places: PlaceSearchResult[] }>;
      }
    ).searchByText;

    if (!searchFn) return;

    searchFn({
      textQuery: VENUE_ADDRESS,
      fields: ['location', 'displayName', 'formattedAddress'],
      maxResultCount: 1,
    })
      .then(({ places }) => {
        if (cancelled) return;
        const first = places?.[0];
        if (first?.location) {
          const pos = {
            lat: first.location.lat(),
            lng: first.location.lng(),
          };
          setVenueLocation(pos);
          if (map && !originInput) {
            map.setCenter(pos);
            map.setZoom(16);
          }
        }
      })
      .catch((err: unknown) => {
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [placesLib, map, venueLocation, originInput]);

  // Compute directions using modern Route.computeRoutes()
  useEffect(() => {
    if (!routesLib || !map || !originInput) {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
      setOriginLocation(null);
      onRouteComputed(null);
      return;
    }

    let cancelled = false;
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    onRouteError('');
    onRouteLoading(true);

    const request = {
      origin: originInput,
      destination: VENUE_ADDRESS,
      travelMode,
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs'],
    };

    (
      routesLib as unknown as {
        Route: {
          computeRoutes: (req: typeof request) => Promise<{
            routes: Array<{
              distanceMeters?: number;
              durationMillis?: number;
              viewport?: unknown;
              createPolylines: () => PolylineHandle[];
              legs?: Array<{
                startLocation?: LatLngAccessor;
                endLocation?: LatLngAccessor;
                steps?: Array<{
                  distanceMeters?: number;
                  navigationInstruction?: { instructions?: string };
                }>;
              }>;
            }>;
          }>;
        };
      }
    ).Route.computeRoutes(request)
      .then(({ routes }) => {
        if (cancelled) return;
        onRouteLoading(false);

        if (!routes || routes.length === 0) {
          onRouteError(
            'Laluan tidak ditemui untuk mod perjalanan ini. Cuba tukar mod atau lokasi bertolak.'
          );
          onRouteComputed(null);
          return;
        }

        const primaryRoute = routes[0];
        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((polyline) => {
          polyline.setOptions({
            strokeColor: '#0F4C5C',
            strokeWeight: 6,
            strokeOpacity: 0.9,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          (
            map as unknown as { fitBounds: (bounds: unknown) => void }
          ).fitBounds(primaryRoute.viewport);
        }

        const firstLeg = primaryRoute.legs?.[0];
        const startLoc = firstLeg?.startLocation;
        const endLoc = firstLeg?.endLocation;

        const origPos = startLoc
          ? { lat: startLoc.lat(), lng: startLoc.lng() }
          : undefined;
        const destPos = endLoc
          ? { lat: endLoc.lat(), lng: endLoc.lng() }
          : undefined;

        if (origPos) setOriginLocation(origPos);
        if (destPos) setVenueLocation(destPos);

        const steps: RouteStepSummary[] = (firstLeg?.steps ?? [])
          .filter((s) => s.navigationInstruction?.instructions)
          .map((s) => ({
            instruction: s.navigationInstruction?.instructions ?? '',
            distanceMeters: s.distanceMeters ?? 0,
          }));

        onRouteComputed({
          distanceMeters: primaryRoute.distanceMeters ?? 0,
          durationMillis: primaryRoute.durationMillis ?? 0,
          steps,
          originPosition: origPos,
          destinationPosition: destPos,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        onRouteLoading(false);
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        onRouteError(
          'Gagal mengira arah pemanduan. Sila semak alamat bertolak atau cuba mod perjalanan lain.'
        );
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [
    routesLib,
    map,
    originInput,
    travelMode,
    onRouteComputed,
    onRouteLoading,
    onRouteError,
  ]);

  return (
    <>
      {originLocation && (
        <AdvancedMarker position={originLocation} title="Lokasi Bertolak Anda">
          <Pin
            background="#1E293B"
            borderColor="#0F172A"
            glyphColor="#FFFFFF"
          />
        </AdvancedMarker>
      )}

      {venueLocation && (
        <>
          <AdvancedMarker
            ref={destMarkerRef}
            position={venueLocation}
            onClick={() => setInfoOpen((prev) => !prev)}
            title="Sistem Tempahan Dewan Pro - Seksyen 7, Bandar Baru Bangi"
          >
            <Pin
              background="#0F4C5C"
              borderColor="#09303A"
              glyphColor="#FFFFFF"
              scale={1.15}
            />
          </AdvancedMarker>
          {infoOpen && destMarker && (
            <InfoWindow
              anchor={destMarker}
              maxWidth={260}
              onCloseClick={() => setInfoOpen(false)}
            >
              <div className="p-1 text-slate-900">
                <p className="text-xs font-bold text-[#0F4C5C]">
                  Pusat Dewan & Seminar Pro
                </p>
                <p className="text-xs text-slate-600 mt-1 leading-snug">
                  {VENUE_ADDRESS}
                </p>
              </div>
            </InfoWindow>
          )}
        </>
      )}
    </>
  );
}

interface OriginSearchBoxProps {
  onSelectOrigin: (origin: LatLngPoint | string) => void;
  onUseCurrentLocation: () => void;
  locating: boolean;
}

function OriginSearchBox({
  onSelectOrigin,
  onUseCurrentLocation,
  locating,
}: OriginSearchBoxProps) {
  const placesLib = useMapsLibrary('places');
  const sessionTokenRef = useRef<unknown>(null);

  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestionItem[]>(
    []
  );
  const [openDropdown, setOpenDropdown] = useState(false);

  useEffect(() => {
    if (!placesLib) return;
    const trimmed = inputValue.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      return;
    }

    const { AutocompleteSessionToken, AutocompleteSuggestion } =
      placesLib as unknown as {
        AutocompleteSessionToken: new () => unknown;
        AutocompleteSuggestion: {
          fetchAutocompleteSuggestions: (req: {
            input: string;
            sessionToken?: unknown;
            includedRegionCodes?: string[];
          }) => Promise<{ suggestions?: AutocompleteSuggestionItem[] }>;
        };
      };

    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: trimmed,
        sessionToken: sessionTokenRef.current ?? undefined,
        includedRegionCodes: ['my'],
      })
        .then((res) => {
          if (!cancelled) {
            setSuggestions(res.suggestions ?? []);
            setOpenDropdown(true);
          }
        })
        .catch((err: unknown) => {
          if (isQuotaError(err)) {
            window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          }
        });
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [placesLib, inputValue]);

  async function handlePickSuggestion(suggestion: AutocompleteSuggestionItem) {
    if (!suggestion.placePrediction) return;
    const label = suggestion.placePrediction.text.text;
    setInputValue(label);
    setOpenDropdown(false);
    setSuggestions([]);

    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['location', 'formattedAddress'],
      });
      sessionTokenRef.current = null;
      if (place.location) {
        onSelectOrigin({
          lat: place.location.lat(),
          lng: place.location.lng(),
        });
      } else {
        onSelectOrigin(label);
      }
    } catch (err) {
      if (isQuotaError(err)) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
      onSelectOrigin(label);
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setOpenDropdown(false);
    onSelectOrigin(inputValue.trim());
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-3 relative">
      <label
        htmlFor="origin-address-input"
        className="block text-xs font-semibold text-slate-700"
      >
        Lokasi Bertolak Anda
      </label>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            id="origin-address-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Taip alamat, stesen atau bandar (cth: KL Sentral)..."
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
          />

          {openDropdown && suggestions.length > 0 && (
            <ul className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-sm divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {suggestions.map((item, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => void handlePickSuggestion(item)}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                  >
                    {item.placePrediction?.text.text}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          className="px-4 py-2.5 text-sm font-medium text-white bg-[#0F4C5C] hover:bg-[#0B3B48] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Kira Arah
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          disabled={locating}
          onClick={onUseCurrentLocation}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0F4C5C] bg-[#0F4C5C]/5 hover:bg-[#0F4C5C]/10 border border-[#0F4C5C]/20 rounded-md cursor-pointer disabled:opacity-50"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>{locating ? 'Mengesan lokasi...' : 'Gunakan Lokasi Semasa'}</span>
        </button>

        {[
          'KL Sentral, Kuala Lumpur',
          'Putrajaya Sentral',
          'Bandar Kajang, Selangor',
        ].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setInputValue(preset);
              setOpenDropdown(false);
              onSelectOrigin(preset);
            }}
            className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-[#F8F9FA] hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
          >
            {preset.split(',')[0]}
          </button>
        ))}
      </div>
    </form>
  );
}

export function LocationDirectionsSection() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  const [originInput, setOriginInput] = useState<LatLngPoint | string | null>(
    null
  );
  const [travelMode, setTravelMode] = useState<TravelModeOption>('DRIVING');
  const [routeSummary, setRouteSummary] =
    useState<ComputedRouteSummary | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [locating, setLocating] = useState(false);

  const handleRouteComputed = useCallback(
    (summary: ComputedRouteSummary | null) => {
      setRouteSummary(summary);
    },
    []
  );

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setRouteError('Pelayar anda tidak menyokong pengesanan lokasi GPS.');
      return;
    }
    setLocating(true);
    setRouteError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setOriginInput({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setLocating(false);
        setRouteError(
          'Akses lokasi semasa tidak dibenarkan. Sila masukkan alamat bertolak secara manual.'
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const externalMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    VENUE_ADDRESS
  )}`;

  return (
    <section
      id="lokasi-arah"
      className="py-14 lg:py-20 bg-[#F8F9FA] border-t border-slate-200 no-print"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-sm font-medium text-[#0F4C5C] mb-2">
              05. Lokasi & Panduan Arah (Google Maps)
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
              Panduan Arah ke Pusat Dewan Kami
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl">
              Rancang perjalanan anda ke Seksyen 7, Bandar Baru Bangi dengan anggaran jarak, masa perjalanan, dan paparan laluan interaktif.
            </p>
          </div>

          <a
            href={externalMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <ExternalLink className="w-4 h-4 text-[#0F4C5C]" />
            <span>Buka dalam Google Maps</span>
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Panel: Address, Origin Controls, Travel Modes, Turn-by-Turn Steps */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div className="pb-5 border-b border-slate-200">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#0F4C5C] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      Alamat Rasmi Premis
                    </p>
                    <p className="text-sm font-semibold text-slate-900 mt-1 leading-relaxed">
                      NO. 27-1, Jalan 7/7C, Seksyen 7,
                      <br />
                      43650, Bandar Baru Bangi, Selangor
                    </p>
                  </div>
                </div>
              </div>

              {apiKey ? (
                <APIProvider
                  apiKey={apiKey}
                  libraries={['routes', 'places', 'marker']}
                  language="ms"
                  region="MY"
                >
                  <OriginSearchBox
                    onSelectOrigin={setOriginInput}
                    onUseCurrentLocation={handleUseCurrentLocation}
                    locating={locating}
                  />
                </APIProvider>
              ) : (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  Kunci API Google Maps belum dikonfigurasi dalam persekitaran semasa. Gunakan butang &ldquo;Buka dalam Google Maps&rdquo; untuk arah terus.
                </div>
              )}

              {/* Travel Mode Selector */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Mod Perjalanan
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'DRIVING' as const, label: 'Memandu', icon: Car },
                    { id: 'TRANSIT' as const, label: 'Transit', icon: Bus },
                    { id: 'WALKING' as const, label: 'Jalan Kaki', icon: Footprints },
                  ].map((mode) => {
                    const Icon = mode.icon;
                    const active = travelMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setTravelMode(mode.id)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#0F4C5C] text-white border-[#0F4C5C]'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {routeError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{routeError}</span>
                </div>
              )}

              {routeLoading && (
                <div className="p-4 rounded-lg bg-[#F8F9FA] border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#0F4C5C] shrink-0" />
                  <span>Mengira laluan terbaik ke Bandar Baru Bangi...</span>
                </div>
              )}

              {routeSummary && !routeLoading && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-4 bg-[#F8F9FA] border-b border-slate-200 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Anggaran Masa</p>
                      <p className="text-lg font-bold text-[#0F4C5C] font-mono tabular-nums">
                        {formatDuration(routeSummary.durationMillis)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Jarak Perjalanan</p>
                      <p className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                        {formatDistance(routeSummary.distanceMeters)}
                      </p>
                    </div>
                  </div>

                  {routeSummary.steps.length > 0 && (
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {routeSummary.steps.map((step, i) => (
                        <div
                          key={i}
                          className="px-4 py-2.5 text-xs flex items-start justify-between gap-3"
                        >
                          <div className="flex items-start gap-2 text-slate-700">
                            <span className="font-mono tabular-nums text-slate-400 shrink-0">
                              {String(i + 1).padStart(2, '0')}.
                            </span>
                            <span>{step.instruction}</span>
                          </div>
                          <span className="font-mono tabular-nums text-slate-500 shrink-0">
                            {formatDistance(step.distanceMeters)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <RouteIcon className="w-4 h-4 text-[#0F4C5C] shrink-0" />
              <span>
                Tempat letak kereta percuma tersedia di kawasan premis Seksyen 7.
              </span>
            </div>
          </div>

          {/* Right Panel: Interactive Google Map */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden min-h-[420px] lg:min-h-[500px] relative">
            {apiKey ? (
              <APIProvider
                apiKey={apiKey}
                libraries={['routes', 'places', 'marker']}
                language="ms"
                region="MY"
              >
                <div className="w-full h-[420px] lg:h-[500px]">
                  <GoogleMap
                    mapId="DEMO_MAP_ID"
                    defaultCenter={BANGI_DEFAULT_VIEWPORT_CENTER}
                    defaultZoom={15}
                    gestureHandling="greedy"
                    internalUsageAttributionIds={[
                      'gmp_mcp_codeassist_v1_aistudio',
                    ]}
                    className="w-full h-full"
                  >
                    <MapCanvas
                      originInput={originInput}
                      travelMode={travelMode}
                      onRouteComputed={handleRouteComputed}
                      onRouteLoading={setRouteLoading}
                      onRouteError={setRouteError}
                    />
                  </GoogleMap>
                </div>
              </APIProvider>
            ) : (
              <div className="w-full h-[420px] lg:h-[500px] flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                <MapPin className="w-10 h-10 text-[#0F4C5C] mb-3" />
                <p className="text-base font-bold text-slate-900">
                  Lokasi Pusat Dewan & Seminar Pro
                </p>
                <p className="text-sm text-slate-600 mt-1 max-w-md">
                  {VENUE_ADDRESS}
                </p>
                <a
                  href={externalMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#0F4C5C] hover:bg-[#0B3B48] rounded-lg"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Lihat Lokasi di Google Maps</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
