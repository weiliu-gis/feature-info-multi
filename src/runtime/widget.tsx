import { React, type AllWidgetProps, MutableStoreManager } from "jimu-core"
import { JimuMapViewComponent, type JimuMapView } from "jimu-arcgis"

import { processFeatureInput } from "./services/featureInputProcessor"
import { highlightFeature, showInputGeometries } from "./utils/mapGraphics"
import { useMapGraphics } from "./hooks/useMapGraphics"
import { useMapClick } from "./hooks/useMapClick"
import FeatureResultsPanel from "./components/FeatureResultsPanel"
import type { UnifiedGeometryInput, WidgetSelectionInput } from "./types"

const { useState, useEffect, useRef } = React

interface ActiveInput {
  sourceId?: string
  requestId: number
}

const Widget = (props: AllWidgetProps<any>) => {
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>()
  const { markerLayer, selectionLayer } = useMapGraphics(jimuMapView)
  const [popupFeatures, setPopupFeatures] = useState<any[]>([])
  const [selectedGraphic, setSelectedGraphic] = useState<any>(null)
  const [selectionEnabled, setSelectionEnabled] = useState(false)

  const requestSequenceRef = useRef(0)
  const activeInputRef = useRef<ActiveInput | null>(null)
  const messageInput = props.mutableStateProps?.widgetInput as
    | WidgetSelectionInput | null | undefined

  const updateFeatureResults = (graphics: any[]) => {
    selectionLayer?.removeAll()
    setSelectedGraphic(null)
    setPopupFeatures(graphics)
  }

  // Clear only our stored message; we do not reset another widget's UI.
  const resetMessageInput = () => {
    MutableStoreManager.getInstance().updateStateValue(props.id, "widgetInput", null)
  }

  const handleUnifiedGeometryInput = async (
    input: UnifiedGeometryInput,
  ): Promise<void> => {
    if (!jimuMapView?.view) return

    const requestId = ++requestSequenceRef.current
    activeInputRef.current = { sourceId: input.sourceId, requestId }

    try {
      const { graphics, queryGeometries } = await processFeatureInput(input, jimuMapView)
      if (activeInputRef.current?.requestId !== requestId) return

      // Map Click draws its own marker before retrieval.
      // All external geometry selections display the geometries used to query.
      if (input.retrievalMethod === "spatial") {
        showInputGeometries(markerLayer, queryGeometries)
      }
      updateFeatureResults(graphics)
    } catch (error) {
      if (activeInputRef.current?.requestId === requestId) {
        console.error("Unified geometry input error:", error)
      }
    }
  }

  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (jmv) setJimuMapView(jmv)
  }

  // Preserve the widget's custom feature-highlighting behavior.
  useEffect(() => {
    if (!jimuMapView?.view) return
    const defaultHighlight = jimuMapView.view.highlights.find(
      (highlight: any) => highlight.name === "default",
    )
    if (!defaultHighlight) return

    const originalHaloOpacity = defaultHighlight.haloOpacity
    const originalFillOpacity = defaultHighlight.fillOpacity
    defaultHighlight.haloOpacity = 0
    defaultHighlight.fillOpacity = 0

    return () => {
      defaultHighlight.haloOpacity = originalHaloOpacity
      defaultHighlight.fillOpacity = originalFillOpacity
    }
  }, [jimuMapView])

  const handleBlockClick = async (graphic: any) => {
    if (!selectionEnabled || !jimuMapView?.view || !selectionLayer || !graphic?.geometry) return

    if (selectedGraphic === graphic) {
      selectionLayer.removeAll()
      setSelectedGraphic(null)
      return
    }

    try {
      selectionLayer.removeAll()
      await jimuMapView.view.goTo(graphic.geometry)
      highlightFeature(selectionLayer, graphic.geometry)
      setSelectedGraphic(graphic)
    } catch (error) {
      console.error("Zoom / selection error:", error)
    }
  }

  const clearFeatureResults = () => {
    ++requestSequenceRef.current
    activeInputRef.current = null
    updateFeatureResults([])
    markerLayer?.removeAll()
    resetMessageInput()
  }

  const toggleSelection = () => {
    if (selectionEnabled) {
      selectionLayer?.removeAll()
      setSelectedGraphic(null)
    }
    setSelectionEnabled(!selectionEnabled)
  }

  // Map clicks use the hit rectangle to retrieve overlapping popup features.
  useMapClick(jimuMapView, markerLayer, resetMessageInput, handleUnifiedGeometryInput)

  // Every compatible widget publishes the same selection/clear message payload.
  useEffect(() => {
    if (!messageInput) return

    if (messageInput.kind === "clear") {
      // A source can only clear its own currently displayed results.
      if (activeInputRef.current?.sourceId !== messageInput.sourceId) return
      ++requestSequenceRef.current
      activeInputRef.current = null
      markerLayer?.removeAll()
      updateFeatureResults([])
      return
    }

    if (!jimuMapView?.view || !messageInput.geometries.length) return

    void handleUnifiedGeometryInput({
      origin: "widget",
      sourceId: messageInput.sourceId,
      geometries: messageInput.geometries,
      retrievalMethod: "spatial",
    })
  }, [jimuMapView?.view, markerLayer, messageInput])

  return (
    <div className="jimu-widget">
      {props.useMapWidgetIds?.length === 1 && (
        <JimuMapViewComponent
          useMapWidgetId={props.useMapWidgetIds[0]}
          onActiveViewChange={activeViewChangeHandler}
        />
      )}
      {jimuMapView?.view && (
        <FeatureResultsPanel
          popupFeatures={popupFeatures}
          selectedGraphic={selectedGraphic}
          selectionEnabled={selectionEnabled}
          onFeatureClick={handleBlockClick}
          onToggleSelection={toggleSelection}
          onClearResults={clearFeatureResults}
        />
      )}
    </div>
  )
}

export default Widget
