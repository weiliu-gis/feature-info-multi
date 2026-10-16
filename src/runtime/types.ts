import type Geometry from "@arcgis/core/geometry/Geometry.js"

// One selection message contract for all compatible Experience Builder widgets.
export type WidgetSelectionInput =
  | {
      kind: "selection"
      sourceId: string
      geometries: Geometry[]
    }
  | {
      kind: "clear"
      sourceId: string
    }

export type PopupHitTarget =
  | { x: number; y: number }
  | { x: number; y: number; width: number; height: number }

interface GeometryInputBase {
  geometries: Geometry[]
  sourceId?: string
}

// Map Click and external widgets share the processor, not a retrieval method.
export type UnifiedGeometryInput =
  | (GeometryInputBase & {
      origin: "map-click"
      retrievalMethod: "popup"
      hitTarget: PopupHitTarget
      pointerType?: string
    })
  | (GeometryInputBase & {
      origin: "widget"
      retrievalMethod: "spatial"
    })
