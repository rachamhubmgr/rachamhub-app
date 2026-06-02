"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type SupabaseRealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

export interface RealtimeSubscription {
  table: string;
  event?: SupabaseRealtimeEvent;
  schema?: string;
}

export function useSupabaseRealtime(
  subscriptions: RealtimeSubscription[],
  callback: () => void,
  deps: unknown[] = [],
) {
  useEffect(() => {
    if (subscriptions.length === 0) {
      callback();
      return;
    }

    callback();

    const channelName = subscriptions
      .map((sub) => `${sub.table}-${sub.event ?? "*"}`)
      .join("-");

    const channel = supabase!.channel(channelName);

    subscriptions.forEach((sub) => {
      channel.on(
        "postgres_changes",
        {
          event: sub.event ?? "*",
          schema: sub.schema ?? "public",
          table: sub.table,
        },
        callback,
      );
    });

    channel.subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [callback, JSON.stringify(subscriptions), ...deps]);
}
