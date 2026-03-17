import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Mail, User } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        </div>
        <p className="text-sm text-muted-foreground">Your account details.</p>
      </div>

      <Card className="card-elegant p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Name</div>
            <div className="font-medium">{user?.name || "-"}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Email</div>
            <div className="font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {user?.email || "-"}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Login method</div>
            <div className="font-medium">{(user as any)?.loginMethod ?? "-"}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

