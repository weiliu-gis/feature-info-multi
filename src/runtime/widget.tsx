import { React, type AllWidgetProps, MutableStoreManager } from "jimu-core"
import { JimuMapViewComponent, type JimuMapView } from "jimu-arcgis"
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils.js"
import Graphic from "@arcgis/core/Graphic.js"
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js"
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol.js"

const { useState, useEffect } = React

const Widget = (props: AllWidgetProps<any>) => {
  // State
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>()
  const [markerLayer, setMarkerLayer] = useState<GraphicsLayer>()
  const [selectionLayer, setSelectionLayer] = useState<GraphicsLayer>()
  const [popupFeatures, setPopupFeatures] = useState<any[]>([])
  const [selectedGraphic, setSelectedGraphic] = useState<any>(null)
  const [selectionEnabled, setSelectionEnabled] = useState(false)

  // Show the map-click or search-result point
  const showFeaturePoint = (point: any) => {
    if (!markerLayer || !point) {
      return
    }

    markerLayer.removeAll()

    const pinGraphic = new Graphic({
      geometry: point,
      symbol: new PictureMarkerSymbol({
        url: "https://static.arcgis.com/images/Symbols/Shapes/RedPin1LargeB.png",
        width: "40px",
        height: "40px",
        yoffset: "15px",
      }),
    })

    markerLayer.add(pinGraphic)
  }

  // Fetch popup-enabled features at a screen point
  const fetchPopupFeatures = async (
    mapComponent: any,
    screenPoint: any,
    pointerType: any = "mouse",
  ) => {
    if (!mapComponent || !screenPoint) {
      return
    }

    try {
      const graphicGenerator = await mapComponent.fetchPopupFeatures(
        screenPoint,
        {
          pointerType,
        },
      )

      const graphics: any[] = []

      for await (const graphic of graphicGenerator) {
        graphics.push(graphic)
      }

      setPopupFeatures(graphics)
    } catch (error) {
      console.error("Fetch popup features error:", error)
    }
  }

  // Handle active map view
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv)
    }
  }

  // Create marker and selection graphics layers
  useEffect(() => {
    if (!jimuMapView?.view) {
      return
    }

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

    jimuMapView.view.map.add(marker)
    jimuMapView.view.map.add(selection)

    setMarkerLayer(marker)
    setSelectionLayer(selection)

    return () => {
      jimuMapView.view.map.remove(marker)
      jimuMapView.view.map.remove(selection)

      setMarkerLayer(undefined)
      setSelectionLayer(undefined)
    }
  }, [jimuMapView])

  // Select, zoom to, and highlight a feature
  const handleBlockClick = async (graphic: any) => {
    if (!selectionEnabled) {
      return
    }

    if (!jimuMapView?.view || !selectionLayer || !graphic?.geometry) {
      return
    }

    if (selectedGraphic === graphic) {
      selectionLayer.removeAll()
      setSelectedGraphic(null)
      return
    }

    try {
      selectionLayer.removeAll()

      await jimuMapView.view.goTo(graphic.geometry)

      const selectionGraphic = new Graphic({
        geometry: graphic.geometry,
      })

      if (graphic.geometry.type === "polygon") {
        selectionGraphic.symbol = {
          type: "simple-fill",
          color: [0, 255, 255, 0.15],
          outline: {
            color: [0, 255, 255, 1],
            width: 3,
          },
        } as any
      }

      if (graphic.geometry.type === "polyline") {
        selectionGraphic.symbol = {
          type: "simple-line",
          color: [0, 255, 255, 1],
          width: 5,
        } as any
      }

      if (graphic.geometry.type === "point") {
        selectionGraphic.symbol = {
          type: "simple-marker",
          color: [0, 255, 255, 0.35],
          size: 16,
          outline: {
            color: [0, 255, 255, 1],
            width: 3,
          },
        } as any
      }

      selectionLayer.add(selectionGraphic)
      setSelectedGraphic(graphic)
    } catch (error) {
      console.error("Zoom / selection error:", error)
    }
  }

  // Clear feature results, selection, and map pin
  const clearFeatureResults = () => {
    setPopupFeatures([])
    setSelectedGraphic(null)

    selectionLayer?.removeAll()
    markerLayer?.removeAll()
  }

  // Enable or disable feature selection
  const toggleSelection = () => {
    if (selectionEnabled) {
      selectionLayer?.removeAll()
      setSelectedGraphic(null)
      setSelectionEnabled(false)
    } else {
      setSelectionEnabled(true)
    }
  }

  // Fetch popup features from map clicks
  useEffect(() => {
    if (!jimuMapView?.view) {
      return
    }

    const view = jimuMapView.view

    const handle = view.on("click", async (event: any) => {
      showFeaturePoint(event.mapPoint)

      MutableStoreManager.getInstance().updateStateValue(
        props.id,
        "searchPoint",
        null,
      )

      const mapComponent = jimuMapView.mapComponent

      if (!mapComponent) {
        return
      }

      await fetchPopupFeatures(
        mapComponent,
        event.screenPoint,
        event.pointerType,
      )
    })

    return () => {
      handle.remove()
    }
  }, [jimuMapView, markerLayer])

  // Fetch popup features from Search widget results
  useEffect(() => {
    const searchPoint = props.mutableStateProps?.searchPoint

    if (!jimuMapView?.view || !searchPoint) {
      return
    }

    const fetchFeaturesFromSearch = async () => {
      const view = jimuMapView.view
      const mapComponent = jimuMapView.mapComponent

      if (!mapComponent) {
        return
      }

      try {
        showFeaturePoint(searchPoint)

        await view.goTo({
          center: searchPoint,
          zoom: 18,
        })

        await reactiveUtils.whenOnce(
          () => view.stationary && !view.updating,
        )

        const screenPoint = view.toScreen(searchPoint)

        if (!screenPoint) {
          return
        }

        await fetchPopupFeatures(
          mapComponent,
          screenPoint,
          "mouse",
        )
      } catch (error) {
        console.error("Search zoom / fetch error:", error)
      }
    }

    fetchFeaturesFromSearch()
  }, [
    jimuMapView,
    markerLayer,
    props.mutableStateProps?.searchPoint,
  ])

  // UI
  return (
    <div className="jimu-widget">
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent
          useMapWidgetId={props.useMapWidgetIds[0]}
          onActiveViewChange={activeViewChangeHandler}
        />
      )}

      {jimuMapView?.view && (
        <calcite-panel
          style={
            {
              "--calcite-panel-background-color": "#ffffff",
            } as React.CSSProperties
          }
          heading="Feature Information"
        >
          <calcite-block
            expanded
            style={{
              backgroundColor: "#dddddd50",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <span>
                Number of Features Found: {popupFeatures.length}
              </span>

              {popupFeatures.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <calcite-action
                    id="selection-action-switch"
                    icon="enable-disable-feature-selection"
                    style={
                      {
                        "--calcite-action-text-color": "#000000",
                        "--calcite-action-background-color": selectionEnabled
                          ? "#97d1bbe8"
                          : "rgba(0, 0, 0, 0)",
                      } as React.CSSProperties
                    }
                    text={
                      selectionEnabled
                        ? "Clear all highlights and disable selection"
                        : "Enable selection"
                    }
                    onClick={toggleSelection}
                  />

                  <calcite-tooltip
                    close-on-click
                    reference-element="selection-action-switch"
                    placement="bottom"
                  >
                    {selectionEnabled
                      ? "Clear all highlights and disable selection"
                      : "Enable selection"}
                  </calcite-tooltip>

                  <calcite-action
                    id="clear-results-action"
                    icon="trash"
                    style={
                      {
                        "--calcite-action-text-color": "#000000",
                      } as React.CSSProperties
                    }
                    text="Delete all results"
                    onClick={clearFeatureResults}
                  />

                  <calcite-tooltip
                    close-on-click
                    reference-element="clear-results-action"
                    placement="bottom"
                  >
                    Delete all results
                  </calcite-tooltip>
                </div>
              )}
            </div>
          </calcite-block>

          <div>
            {popupFeatures.map((graphic, index) => {
              const title =
                graphic.layer?.title ||
                graphic.sourceLayer?.title ||
                "Feature"

              return (
                <calcite-block
                  key={index}
                  label={title}
                  expanded
                  style={{
                    backgroundColor:
                      selectedGraphic === graphic
                        ? "#b3cbff"
                        : "transparent",
                    transition: "background-color 0s ease",
                    cursor: selectionEnabled ? "pointer" : "default",
                  }}
                  onClick={() => handleBlockClick(graphic)}
                >
                  <arcgis-feature graphic={graphic}></arcgis-feature>
                </calcite-block>
              )
            })}
          </div>
        </calcite-panel>
      )}
    </div>
  )
}

export default Widget