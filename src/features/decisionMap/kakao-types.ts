// Kakao Maps SDK의 **최소 계약**. 이 파일과 KakaoMapAdapter/useKakaoLoader 밖으로
// 새어나가지 않는다(domain/strategy/currentHousing/MapEntity에 Kakao 타입 침투 금지).
// 테스트에서 이 인터페이스를 stub으로 주입해 SDK 없이 검증한다. (decision-map.md §11)

export interface KLatLng {
  getLat(): number;
  getLng(): number;
}
export interface KLatLngBounds {
  extend(ll: KLatLng): void;
}
export interface KMapBounds {
  getSouthWest(): KLatLng;
  getNorthEast(): KLatLng;
}
export interface KMap {
  setBounds(b: KLatLngBounds): void;
  setCenter(ll: KLatLng): void;
  setLevel(n: number): void;
  getBounds(): KMapBounds;
}
export interface KCustomOverlay {
  setMap(m: KMap | null): void;
}
export interface KShape {
  setMap(m: KMap | null): void;
}
export interface KPolygonOptions {
  path: KLatLng[];
  strokeWeight?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeStyle?: string;
  fillColor?: string;
  fillOpacity?: number;
  zIndex?: number;
}
export interface KPolylineOptions {
  path: KLatLng[];
  strokeWeight?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeStyle?: string;
  zIndex?: number;
}
export interface KEvent {
  addListener(target: unknown, type: string, handler: (...args: unknown[]) => void): void;
  removeListener(target: unknown, type: string, handler: (...args: unknown[]) => void): void;
}

export interface KCustomOverlayOptions {
  position: KLatLng;
  content: HTMLElement;
  xAnchor?: number;
  yAnchor?: number;
  clickable?: boolean;
  zIndex?: number;
}

/** adapter가 의존하는 kakao.maps 서브셋. 실제 SDK와 stub이 모두 만족한다. */
export interface KakaoMapsApi {
  Map: new (container: HTMLElement, options: { center: KLatLng; level: number }) => KMap;
  LatLng: new (lat: number, lng: number) => KLatLng;
  LatLngBounds: new () => KLatLngBounds;
  CustomOverlay: new (options: KCustomOverlayOptions) => KCustomOverlay;
  Polygon: new (options: KPolygonOptions) => KShape;
  Polyline: new (options: KPolylineOptions) => KShape;
  event: KEvent;
}
