import { React } from "jimu-core"
import { groupPopupFeatures } from "../utils/groupFeatures"

const { useState } = React

interface FeatureResultsPanelProps {
  popupFeatures: any[]
  selectedGraphic: any
  selectionEnabled: boolean
  onFeatureClick: (graphic: any) => void
  onToggleSelection: () => void
  onClearResults: () => void
}

const FeatureResultsPanel = ({
  popupFeatures,
  selectedGraphic,
  selectionEnabled,
  onFeatureClick,
  onToggleSelection,
  onClearResults,
}: FeatureResultsPanelProps) => {
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean
  }>({})

  const groupedPopupFeatures = groupPopupFeatures(popupFeatures)

  const allSectionsExpanded = Object.keys(groupedPopupFeatures).every(
    (title) => expandedSections[title] ?? true,
  )

  const toggleAllSections = () => {
    const nextState: { [key: string]: boolean } = {}

    Object.keys(groupedPopupFeatures).forEach((title) => {
      nextState[title] = !allSectionsExpanded
    })

    setExpandedSections(nextState)
  }

  // Add padding to Calcite's section header inside its shadow root
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

  const updateSectionExpansion = (groupTitle: string, expanded: boolean) => {
    setExpandedSections((previous) => ({
      ...previous,
      [groupTitle]: expanded,
    }))
  }

  const toggleAllLabel = allSectionsExpanded
    ? "Collapse all sections"
    : "Expand all sections"

  const selectionLabel = selectionEnabled
    ? "Clear all highlights and disable selection"
    : "Enable selection"

  return (
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
            style={{ display: "flex", alignItems: "center", gap: "2px" }}
          >
            {/* Expand or collapse all sections */}
            <calcite-action
              id="toggle-all-sections"
              icon={allSectionsExpanded ? "chevrons-up" : "chevrons-down"}
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
              onClick={onToggleSelection}
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
              onClick={onClearResults}
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

      {/* Grouped feature results */}
      {popupFeatures.length > 0 && (
        <div>
          {Object.entries(groupedPopupFeatures).map(([groupTitle, graphics]) => (
            <calcite-block-section
              key={groupTitle}
              ref={(section) => {
                if (section) void styleSectionHeader(section)
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
                  "--calcite-block-section-background-color": "#dfdedead",
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
                        cursor: selectionEnabled ? "pointer" : "default",
                      } as React.CSSProperties
                    }
                    onClick={() => onFeatureClick(graphic)}
                  >
                    <arcgis-feature
                      graphic={graphic}
                      style={{ whiteSpace: "pre-wrap" }}
                    ></arcgis-feature>
                  </calcite-block>
                )
              })}
            </calcite-block-section>
          ))}
        </div>
      )}
    </calcite-panel>
  )
}

export default FeatureResultsPanel
