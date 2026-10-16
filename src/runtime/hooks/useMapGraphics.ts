import { React } from "jimu-core"
import type { JimuMapView } from "jimu-arcgis"
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js"

const { useState, useEffect } = React

// Create and remove the widget's own marker/highlight layers with its map view.
export const useMapGraphics = (jimuMapView: JimuMapView | undefined) => {
  const [markerLayer, setMarkerLayer] = useState<GraphicsLayer>()
  const [selectionLayer, setSelectionLayer] = useState<GraphicsLayer>()
  const view = jimuMapView?.view

  useEffect(() => {
    if (!view) return

    const marker = new GraphicsLayer({
      id: "feature-info-multi-marker",
      title: "Feature Marker",
      listMode: "hide",
    })
    const selection = new GraphicsLayer({
      id: "feature-info-multi-selection",
      title: "Feature Selection",
      listMode: "hide",
    })

    view.map.add(marker)
    view.map.add(selection)
    setMarkerLayer(marker)
    setSelectionLayer(selection)

    return () => {
      view.map.remove(marker)
      view.map.remove(selection)
    }
  }, [view])

  return { markerLayer, selectionLayer }
}
