import type { JimuMapView } from "jimu-arcgis"
import type Graphic from "@arcgis/core/Graphic.js"
import type Geometry from "@arcgis/core/geometry/Geometry.js"

import { createInwardBuffer } from "../utils/geometryUtils"
import { retrieveSpatialFeatures } from "./featureRetrieval"

// Geometry collection independent of the source widget
interface GeometryQueryInput {
  geometries: Geometry[]
}

// Retrieve features and the geometries used for querying
export const retrieveFeaturesFromGeometryInput = async (
  jimuMapView: JimuMapView,
  input: GeometryQueryInput,
): Promise<{
  graphics: Graphic[]
  queryGeometries: Geometry[]
}> => {
  const graphics: Graphic[] = []
  const queryGeometries: Geometry[] = []

  if (!jimuMapView?.view || !input?.geometries?.length) {
    return { graphics, queryGeometries }
  }

  for (const geometry of input.geometries) {
    if (!geometry) continue

    try {
      // Apply an inward buffer to polygons only
      const queryGeometry =
        geometry.type === "polygon"
          ? createInwardBuffer(geometry)
          : geometry

      if (!queryGeometry) continue

      // Save the actual geometry used for querying
      queryGeometries.push(queryGeometry)

      // Retrieve intersecting features
      const features = await retrieveSpatialFeatures(
        jimuMapView.view,
        queryGeometry,
      )

      graphics.push(...features)
    } catch (error) {
      console.error("Geometry input query error:", error)
    }
  }

  // Remove duplicate features from the same layer
  const uniqueGraphics: Graphic[] = []
  const seen = new Map<any, Set<string | number>>()

  for (const graphic of graphics) {
    const layer: any = graphic.sourceLayer || graphic.layer
    const objectIdField = layer?.objectIdField
    const objectId = objectIdField
      ? graphic.attributes?.[objectIdField]
      : undefined

    // Keep features when a reliable identifier is unavailable
    if (!layer || objectId === null || objectId === undefined) {
      uniqueGraphics.push(graphic)
      continue
    }

    if (!seen.has(layer)) {
      seen.set(layer, new Set())
    }

    const layerIds = seen.get(layer)!

    if (layerIds.has(objectId)) continue

    layerIds.add(objectId)
    uniqueGraphics.push(graphic)
  }

  return {
    graphics: uniqueGraphics.reverse(),
    queryGeometries
  }
}
