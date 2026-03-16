import { useState } from "react";
import HumanizeTab from "@/components/HumanizeTab";
import EmailTab from "@/components/EmailTab";
import { Sparkles, Mail, Menu, X } from "lucide-react";

type Tab = "humanize" | "email";

const tabs = [
  { id: "humanize" as Tab, label: "Humanize Text", icon: Sparkles },
  { id: "email" as Tab, label: "Write Email", icon: Mail },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("humanize");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-40 h-full w-64 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Sparkles size={16} className="text-sidebar-primary-foreground" />
            </div>
            <span className="text-lg font-display font-bold text-sidebar-primary-foreground">
              HumanizeAI
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-sidebar-muted hover:text-sidebar-foreground">
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3 mt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md shadow-sidebar-primary/10"
                    : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-4">
          <div className="rounded-xl bg-sidebar-accent/50 p-4 text-xs text-sidebar-muted leading-relaxed">
            Transform AI text into natural, human-sounding writing with one click.
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden gradient-bg">
        {/* Mobile header */}
        <header className="flex items-center gap-3 p-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm hover:bg-secondary transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="font-display font-bold text-foreground">HumanizeAI</span>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          {activeTab === "humanize" ? <HumanizeTab /> : <EmailTab />}
        </div>
      </main>
    </div>
  );
};

export default Index;
