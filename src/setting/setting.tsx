import { React } from "jimu-core"
import type { AllWidgetSettingProps } from "jimu-for-builder"
import { MapWidgetSelector } from "jimu-ui/advanced/setting-components"
import { Select, Option } from "jimu-ui"
import type { IMConfig } from "../config"

const Setting = (props: AllWidgetSettingProps<IMConfig>) => {
  const onMapWidgetSelected = (useMapWidgetIds: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds,
    })
  }

  const onPolygonSearchMethodChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    props.onSettingChange({
      id: props.id,
      config: props.config.set(
        "polygonSearchMethod",
        event.target.value as "interior-point" | "inward-buffer",
      ),
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

      <div style={{ margin: "16px 8px 8px" }}>
        <strong>Polygon Search Method</strong>
      </div>

      <div style={{ margin: "8px" }}>
        <Select
          value={props.config.polygonSearchMethod ?? "interior-point"}
          onChange={onPolygonSearchMethodChange}
        >
          <Option value="interior-point">Interior Point</Option>
          <Option value="inward-buffer">Inward Buffered Polygon</Option>
        </Select>
      </div>
    </div>
  )
}

export default Setting