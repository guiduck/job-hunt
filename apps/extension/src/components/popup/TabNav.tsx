import type { PopupTab } from "../../store/popupStore"
import { usePopupStore } from "../../store/popupStore"

const TABS: PopupTab[] = ["dashboard", "search", "jobs", "templates", "settings"]

export function TabNav() {
  const activeTab = usePopupStore((state) => state.activeTab)
  const setActiveTab = usePopupStore((state) => state.setActiveTab)

  return (
    <nav className="tab-list" aria-label="Extension sections">
      {TABS.map((tab) => (
        <button
          aria-selected={activeTab === tab}
          className="tab-button"
          key={tab}
          onClick={() => setActiveTab(tab)}
          type="button">
          {tab}
        </button>
      ))}
    </nav>
  )
}
