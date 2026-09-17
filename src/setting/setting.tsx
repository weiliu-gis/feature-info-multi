import { React } from "jimu-core"
import type { AllWidgetSettingProps } from "jimu-for-builder"
import { MapWidgetSelector } from "jimu-ui/advanced/setting-components"
import type { IMConfig } from "../config"

const Setting = (props: AllWidgetSettingProps<IMConfig>) => {
  const onMapWidgetSelected = (useMapWidgetIds: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds,
    })
  }

    return (
    <div>
      <div style={{ margin: "8px" }}>
        Select a Map widget.
      </div>

      <div style={{ margin: "8px" }}>
        <MapWidgetSelector
          useMapWidgetIds={props.useMapWidgetIds}
          onSelect={onMapWidgetSelected}
        />
      </div>
    </div>
  )
}

export default Setting