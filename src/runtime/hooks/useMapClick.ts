import { React } from "jimu-core"
import type { JimuMapView } from "jimu-arcgis"
import type GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js"

import type { UnifiedGeometryInput } from "../types"
import { showFeaturePoint } from "../utils/mapGraphics"

const { useEffect, useRef } = React

export const useMapClick = (
  jimuMapView: JimuMapView | undefined,
  markerLayer: GraphicsLayer | undefined,
  clearMessageInput: () => void,
  onGeometryInput: (input: UnifiedGeometryInput) => Promise<void>,
) => {
  // Keep the latest callbacks without recreating the map click listener
  const callbacksRef = useRef({
    clearMessageInput,
    onGeometryInput,
  })

  callbacksRef.current = {
    clearMessageInput,
    onGeometryInput,
  }

  useEffect(() => {
    if (!jimuMapView?.view) return

    const view = jimuMapView.view

    const handle = view.on("click", async (event: any) => {
      // Ignore clicks while the map is moving
      if (!view.stationary) return

      // Display the clicked location
      showFeaturePoint(markerLayer, event.mapPoint, view)
      callbacksRef.current.clearMessageInput()

      // Preserve the existing map component availability check
      if (!jimuMapView.mapComponent) return

      // Create a small rectangle around the click
      const CLICK_BUFFER = 8

      const hitTarget = {
        x: event.screenPoint.x - CLICK_BUFFER,
        y: event.screenPoint.y - CLICK_BUFFER,
        width: CLICK_BUFFER * 2,
        height: CLICK_BUFFER * 2,
      }

      // Convert the map click into a unified geometry input
      const input: UnifiedGeometryInput = {
        origin: "map-click",
        geometries: [event.mapPoint],
        retrievalMethod: "popup",
        hitTarget,
        pointerType: event.pointerType,
      }

      // Send the input to the unified processing workflow
      await callbacksRef.current.onGeometryInput(input)
    })

    return () => {
      handle.remove()
    }
  }, [jimuMapView, markerLayer])
}
