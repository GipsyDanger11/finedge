import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Users } from "lucide-react";
import { useState } from "react";

export default function Community() {
  const utils = trpc.useUtils();
  const [q, setQ] = useState("");

  const discover = trpc.social.discover.useQuery({ q, limit: 20 });
  const follow = trpc.social.follow.useMutation({
    onSuccess: async () => {
      await discover.refetch();
    },
  });
  const unfollow = trpc.social.unfollow.useMutation({
    onSuccess: async () => {
      await discover.refetch();
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">Community</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Discover public profiles and follow investors you like.
        </p>
      </div>

      <Card className="card-elegant p-5">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <div className="text-xs text-muted-foreground mb-1">Search</div>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name…" />
          </div>
          {discover.isFetching ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating…
            </div>
          ) : null}
        </div>
      </Card>

      {discover.error ? (
        <Card className="card-elegant p-5">
          <div className="text-sm text-destructive">Failed to load profiles.</div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(discover.data ?? []).map((p: any) => (
          <Card key={String(p._id)} className="card-elegant p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{p.displayName}</div>
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  {p.bio || "Public profile"}
                </div>
              </div>
              <div>
                {p.isFollowing ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={unfollow.isPending}
                    onClick={() => unfollow.mutate({ userId: String(p.userId) })}
                  >
                    Unfollow
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={follow.isPending}
                    onClick={() => follow.mutate({ userId: String(p.userId) })}
                  >
                    Follow
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {discover.data && discover.data.length === 0 && !discover.isLoading ? (
        <Card className="card-elegant p-5">
          <div className="text-sm text-muted-foreground">
            No public profiles found yet.
          </div>
        </Card>
      ) : null}
    </div>
  );
}

