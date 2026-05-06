import { AppHeader } from "./src/components/popup/AppHeader"
import { CaptureProgressListener, PopupContent } from "./src/components/popup/PopupContent"
import { OpportunityDetail } from "./src/components/popup/OpportunityDetail"
import { TabNav } from "./src/components/popup/TabNav"
import "./src/styles/popup.css"

export default function Popup() {
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
