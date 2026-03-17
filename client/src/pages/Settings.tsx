import { useTheme } from "@/contexts/ThemeContext";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  const { theme, toggleTheme, switchable } = useTheme();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Preferences for your FINEDGE experience.
        </p>
      </div>

      <Card className="card-elegant p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-medium">Dark mode</div>
            <div className="text-sm text-muted-foreground">
              {switchable
                ? "Toggle the app theme."
                : "Theme switching is disabled (enable `switchable` in `App.tsx`)."}
            </div>
          </div>
          <Switch
            checked={theme === "dark"}
            disabled={!switchable}
            onCheckedChange={() => toggleTheme?.()}
          />
        </div>
      </Card>
    </div>
  );
}

