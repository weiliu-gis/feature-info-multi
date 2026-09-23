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
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean
  }>({})

  const searchPoint = props.mutableStateProps?.searchPoint
  const searchResultUsesInteriorPoint =
    props.mutableStateProps?.searchResultUsesInteriorPoint

  // Show the map-click or search-result point
  const showFeaturePoint = (point: any) => {
    if (!markerLayer || !point) return

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
    if (!mapComponent || !screenPoint) return

    try {
      const graphicGenerator = await mapComponent.fetchPopupFeatures(
        screenPoint,
        { pointerType },
      )

      const graphics: any[] = []

      for await (const graphic of graphicGenerator) {
        graphics.push(graphic)
      }

      selectionLayer?.removeAll()
      setSelectedGraphic(null)
      setPopupFeatures(graphics)
    } catch (error) {
      console.error("Fetch popup features error:", error)
    }
  }

  // Handle active map view
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (jmv) setJimuMapView(jmv)
  }

  // Create marker and selection graphics layers
  useEffect(() => {
    if (!jimuMapView?.view) return

    const view = jimuMapView.view

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
  }, [jimuMapView])

  // Hide Experience Builder's default feature highlight
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

  // Select, zoom to, and highlight a feature
  const handleBlockClick = async (graphic: any) => {
    if (!selectionEnabled) return
    if (!jimuMapView?.view || !selectionLayer || !graphic?.geometry) return

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
            width: 2,
          },
        } as any
      }

      if (graphic.geometry.type === "polyline") {
        selectionGraphic.symbol = {
          type: "simple-line",
          color: [0, 255, 255, 1],
          width: 4,
        } as any
      }

      if (graphic.geometry.type === "point") {
        selectionGraphic.symbol = {
          type: "simple-marker",
          color: [0, 255, 255, 0.35],
          size: 16,
          outline: {
            color: [0, 255, 255, 1],
            width: 2,
          },
        } as any
      }

      selectionLayer.add(selectionGraphic)
      setSelectedGraphic(graphic)
    } catch (error) {
      console.error("Zoom / selection error:", error)
    }
  }

  // Clear feature results, selection, map pin, and search notice
  const clearFeatureResults = () => {
    setPopupFeatures([])
    setSelectedGraphic(null)

    selectionLayer?.removeAll()
    markerLayer?.removeAll()

    const mutableStore = MutableStoreManager.getInstance()

    mutableStore.updateStateValue(props.id, "searchPoint", null)
    mutableStore.updateStateValue(
      props.id,
      "searchResultUsesInteriorPoint",
      false,
    )
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
    if (!jimuMapView?.view) return

    const view = jimuMapView.view

    const handle = view.on("click", async (event: any) => {
      showFeaturePoint(event.mapPoint)

      const mutableStore = MutableStoreManager.getInstance()

      mutableStore.updateStateValue(props.id, "searchPoint", null)
      mutableStore.updateStateValue(
        props.id,
        "searchResultUsesInteriorPoint",
        false,
      )

      const mapComponent = jimuMapView.mapComponent

      if (!mapComponent) return

      const CLICK_BUFFER = 8

      const hitTarget = {
        x: event.screenPoint.x - CLICK_BUFFER,
        y: event.screenPoint.y - CLICK_BUFFER,
        width: CLICK_BUFFER * 2,
        height: CLICK_BUFFER * 2,
      }

      await fetchPopupFeatures(
        mapComponent,
        hitTarget,
        event.pointerType,
      )
    })

    return () => {
      handle.remove()
    }
  }, [jimuMapView, markerLayer])

  // Fetch popup features from Search widget results
  useEffect(() => {
    if (!jimuMapView?.view || !searchPoint) return

    const fetchFeaturesFromSearch = async () => {
      const view = jimuMapView.view
      const mapComponent = jimuMapView.mapComponent

      if (!mapComponent) return

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

        if (!screenPoint) return

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
  }, [jimuMapView, markerLayer, searchPoint])

  // Group popup features by their highest-level layer or group
  const groupPopupFeatures = (graphics: any[]) => {
    const groups: { [key: string]: any[] } = {}

    graphics.forEach((graphic) => {
      const leafLayer = graphic.sourceLayer || graphic.layer

      if (!leafLayer) return

      let topLayer = leafLayer

      while (topLayer.parent?.title) {
        topLayer = topLayer.parent
      }

      const groupTitle =
        topLayer.title || leafLayer.title || "Other"

      if (!groups[groupTitle]) {
        groups[groupTitle] = []
      }

      groups[groupTitle].push(graphic)
    })

    return groups
  }

  const groupedPopupFeatures = groupPopupFeatures(popupFeatures)

  // Check whether all sections are expanded
  const allSectionsExpanded = Object.keys(groupedPopupFeatures).every(
    (title) => expandedSections[title] ?? true,
  )

  // Expand or collapse all sections
  const toggleAllSections = () => {
    const groupTitles = Object.keys(groupedPopupFeatures)
    const nextState: { [key: string]: boolean } = {}

    groupTitles.forEach((title) => {
      nextState[title] = !allSectionsExpanded
    })

    setExpandedSections(nextState)
  }

  // Add horizontal padding to section headers
  const styleSectionHeader = async (section: any) => {
    if (!section) return

    await section.componentOnReady()

    const shadowRoot = section.shadowRoot

    if (!shadowRoot || shadowRoot.querySelector("#section-header-style")) {
      return
    }

    const style = document.createElement("style")

    style.id = "section-header-style"
    style.textContent = `
      .toggle {
        padding-inline: 12px !important;
      }
    `

    shadowRoot.appendChild(style)
  }

  // Update an individual section's expansion state
  const updateSectionExpansion = (
    groupTitle: string,
    expanded: boolean,
  ) => {
    setExpandedSections((previous) => ({
      ...previous,
      [groupTitle]: expanded,
    }))
  }

  // Panel action labels
  const toggleAllLabel = allSectionsExpanded
    ? "Collapse all sections"
    : "Expand all sections"

  const selectionLabel = selectionEnabled
    ? "Clear all highlights and disable selection"
    : "Enable selection"

  // UI
  return (
    <div className="jimu-widget">
      {props.useMapWidgetIds?.length === 1 && (
        <JimuMapViewComponent
          useMapWidgetId={props.useMapWidgetIds[0]}
          onActiveViewChange={activeViewChangeHandler}
        />
      )}

      {jimuMapView?.view && (
        <calcite-panel
          heading="Feature Information"
          style={
            {
              "--calcite-panel-background-color": "#ffffff",
            } as React.CSSProperties
          }
        >
          {popupFeatures.length > 0 && (
            <>
              <span slot="description" style={{ fontSize: "12px" }}>
                Number of Features Found: {popupFeatures.length}
              </span>

              <div
                slot="header-actions-end"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                {/* Expand or collapse all sections */}
                <calcite-action
                  id="toggle-all-sections"
                  icon={
                    allSectionsExpanded
                      ? "chevrons-up"
                      : "chevrons-down"
                  }
                  text={toggleAllLabel}
                  style={
                    {
                      "--calcite-color-focus": "transparent",
                    } as React.CSSProperties
                  }
                  onClick={toggleAllSections}
                />

                <calcite-tooltip
                  close-on-click
                  reference-element="toggle-all-sections"
                  placement="bottom"
                >
                  {toggleAllLabel}
                </calcite-tooltip>

                {/* Toggle feature selection */}
                <calcite-action
                  id="selection-action-switch"
                  icon="enable-disable-feature-selection"
                  text={selectionLabel}
                  style={
                    {
                      "--calcite-color-focus": "transparent",
                      "--calcite-action-background-color": selectionEnabled
                        ? "#97d1bbe8"
                        : "transparent",
                    } as React.CSSProperties
                  }
                  onClick={toggleSelection}
                />

                <calcite-tooltip
                  close-on-click
                  reference-element="selection-action-switch"
                  placement="bottom"
                >
                  {selectionLabel}
                </calcite-tooltip>

                {/* Clear feature results */}
                <calcite-action
                  id="clear-results-action"
                  icon="trash"
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
            </>
          )}

          {/* Search location notice */}
          {searchResultUsesInteriorPoint && (
            <calcite-block
              label="Search Location Notice"
              expanded
              style={
                {
                  backgroundColor: "transparent",
                  "--calcite-block-border-color": "transparent",
                } as React.CSSProperties
              }
            >
              <calcite-notice
                open
                closable
                kind="info"
                icon="information"
                scale="s"
                style={
                  {
                    "--calcite-notice-corner-radius": "7px",
                  } as React.CSSProperties
                }
              >
                <div slot="title">Search Location</div>

                <div slot="message">
                  The map pin marks the point used to retrieve the results
                  shown below.
                </div>
              </calcite-notice>
            </calcite-block>
          )}

          {/* Grouped feature results */}
          {popupFeatures.length > 0 && (
            <div>
              {Object.entries(groupedPopupFeatures).map(
                ([groupTitle, graphics]) => (
                  <calcite-block-section
                    key={groupTitle}
                    ref={(section) => {
                      if (section) {
                        void styleSectionHeader(section)
                      }
                    }}
                    text={groupTitle}
                    expanded={expandedSections[groupTitle] ?? true}
                    oncalciteBlockSectionExpand={() => {
                      updateSectionExpansion(groupTitle, true)
                    }}
                    oncalciteBlockSectionCollapse={() => {
                      updateSectionExpansion(groupTitle, false)
                    }}
                    style={
                      {
                        "--calcite-block-section-content-space": "0px",
                        "--calcite-block-section-border-color": "transparent",
                        "--calcite-color-focus": "transparent",
                        "--calcite-block-section-background-color":
                          "#dfdedead",
                      } as React.CSSProperties
                    }
                  >
                    {graphics.map((graphic, index) => {
                      const leafTitle =
                        graphic.sourceLayer?.title ||
                        graphic.layer?.title ||
                        "Feature"

                      return (
                        <calcite-block
                          key={`${groupTitle}-${leafTitle}-${index}`}
                          label={leafTitle}
                          expanded
                          style={
                            {
                              "--calcite-block-border-color": "transparent",
                              "--calcite-block-content-space": "5px",
                              backgroundColor:
                                selectedGraphic === graphic
                                  ? "#8baffd"
                                  : "transparent",
                              transition: "background-color 0s ease",
                              cursor: selectionEnabled
                                ? "pointer"
                                : "default",
                            } as React.CSSProperties
                          }
                          onClick={() => handleBlockClick(graphic)}
                        >
                          <arcgis-feature
                            graphic={graphic}
                            style={{ whiteSpace: "pre-wrap" }}
                          ></arcgis-feature>
                        </calcite-block>
                      )
                    })}
                  </calcite-block-section>
                ),
              )}
            </div>
          )}
        </calcite-panel>
      )}
    </div>
  )
}

export default Widget