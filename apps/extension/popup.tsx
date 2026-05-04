import { useEffect } from "react"

import { AppHeader } from "./src/components/popup/AppHeader"
import { CaptureProgressListener, PopupContent } from "./src/components/popup/PopupContent"
import { OpportunityDetail } from "./src/components/popup/OpportunityDetail"
import { TabNav } from "./src/components/popup/TabNav"
import { usePopupStore } from "./src/store/popupStore"
import "./src/styles/popup.css"

export default function Popup() {
  const refreshData = usePopupStore((state) => state.refreshData)

  useEffect(() => {
    void refreshData()
  }, [refreshData])

  return (
    <main className="app-shell">
      <CaptureProgressListener />
      <AppHeader />
      <TabNav />
      <PopupContent />
      <OpportunityDetail />
    </main>
  )
}
