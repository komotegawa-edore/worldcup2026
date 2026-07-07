"use client";

import useSWR from "swr";
import { MatchData } from "@/lib/types";
import { isLive } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useMatchData() {
  const { data, error, isLoading } = useSWR<MatchData>("/api/matches", fetcher, {
    refreshInterval: (latestData) => {
      // LIVE試合があれば10秒、通常は60秒
      if (latestData?.matches.some(isLive)) return 10_000;
      return 60_000;
    },
    revalidateOnFocus: true,
    dedupingInterval: 5_000,
  });

  return { data, error, isLoading };
}
