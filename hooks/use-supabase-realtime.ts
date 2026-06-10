import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

interface RealtimeSubscriptionConfig {
  table: string;
  event: "INSERT" | "UPDATE" | "DELETE" | "*";
  schema?: string;
  filter?: string;
}

export function useSupabaseRealtime(
  subscriptions: RealtimeSubscriptionConfig[],
  callback: () => void | Promise<void>,
  deps: React.DependencyList = [],
) {
  const callbackRef = useRef(callback);

  // Update the ref whenever the callback changes, but don't include it in useEffect's deps
  // to prevent re-subscription if only the callback changes.
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!supabase) {
      console.error("Supabase client is not initialized for realtime hook.");
      return;
    }

    const channels: RealtimeChannel[] = [];

    subscriptions.forEach((subConfig, index) => {
      // Ensure channel names are unique and descriptive
      const channelName = `realtime_channel_${subConfig.table}_${subConfig.event}_${subConfig.filter || "nofilter"}_${index}`;

      const channel = supabase!
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: subConfig.event,
            schema: subConfig.schema || "public",
            table: subConfig.table,
            filter: subConfig.filter,
          } as any,
          (payload: RealtimePostgresChangesPayload<any>) => {
            callbackRef.current(); // Use the ref to call the latest callback
          },
        )
        .subscribe((status, err) => {
          if (status === "SUBSCRIBED") {
          } else if (status === "CHANNEL_ERROR") {
          } else if (status === "TIMED_OUT") {
          } else if (status === "CLOSED") {
          }
        });
      channels.push(channel);
    });

    return () => {
      channels.forEach((channel) => {
        supabase!.removeChannel(channel);
      });
    };
  }, [supabase, ...deps, JSON.stringify(subscriptions)]); // Deep compare subscriptions config
}
