// Group popup features by their highest-level layer or group
export const groupPopupFeatures = (graphics: any[]) => {
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