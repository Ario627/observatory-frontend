"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { fetchCaptureHistory } from "../lib/api/capture";
import { CAPTURE_PAGE_SIZE, ENV } from "@/lib/constants";
import type { CaptureItem, FeedStatus } from "@/types/celestial";
import { a } from "framer-motion/client";

export type CaptureHistoryFeed = {
  items: readonly CaptureItem[];
  total: number;
  status: FeedStatus;
  origin: "live" | "sim" | "mock";
  error: string | null;
  updatedAtMs: number | null;
  hasMore: boolean;
  loadingMore: boolean;
  reload: () => void;
  loadMore: () => void;
};

export type CaptureHistoryOptions = {
  enabled?: boolean;
};

type State = {
  items: readonly CaptureItem[];
  total: number;
  page: number;
  status: FeedStatus;
  error: string | null;
  updatedAtMs: number | null;
  loadingMore: boolean;
};

type Action =
  | { kind: "begin"; keep: boolean }
  | {
      kind: "settle";
      items: readonly CaptureItem[];
      total: number;
      page: number;
      replace: boolean;
      atMs: number;
    }
  | { kind: "fail"; message: string; offline: boolean };

const INITIAL: State = {
  items: [],
  total: 0,
  page: 1,
  status: "loading",
  error: null,
  updatedAtMs: null,
  loadingMore: false,
};

function appendUnique(current: readonly CaptureItem[], incoming: readonly CaptureItem[]): readonly CaptureItem[] {
    const seen = new Set(current.map((item) => item.id));
    const merged = [...current]

    for(const item of incoming) {
        if (seen.has(item.id)) continue;

        seen.add(item.id);
        merged.push(item);
    }

    return merged;
}

function reduce(state: State, action: Action): State {
    switch(action.kind) {
        case "begin": 
            return {
                ...state,
                status: action.keep && state.status.length > 0 ? "stale" : "loading",
                error: null,
                loadingMore: action.keep,
            }
        case "settle" :
            return {
              items: action.replace
                ? [...action.items]
                : appendUnique(state.items, action.items),
              total: action.total,
              page: action.page,
              status: "live",
              error: null,
              updatedAtMs: action.atMs,
              loadingMore: false,
            };

        case "fail":
            return {
                ...state,
                status: action.offline ? "offline" : state.status,
                error: action.message,
                loadingMore: false,
            }
    }
}

export function useCaptureHistory(options: CaptureHistoryOptions = {}): CaptureHistoryFeed {
    const { enabled = true } = options;

    const [state, dispatch] = useReducer(reduce, INITIAL);

    const control = useRef<AbortController | null>(null);
    const mounted = useRef(true);

    const request = useCallback((page: number, replace: boolean): void => {
        control.current?.abort();

        const controller = new AbortController();
        control.current = controller;

        dispatch({kind: "begin", keep: !replace});

        fetchCaptureHistory({page, limit: CAPTURE_PAGE_SIZE}, controller.signal)
            .then((history) => {
                if (controller.signal.aborted) return;

                dispatch({
                  kind: "settle",
                  items: history.items,
                  total: history.total,
                  page: history.page,
                  replace,
                  atMs: Date.now(),
                });
            })


            .catch((cause: unknown) => {
                if (controller.signal.aborted) return;

                dispatch({
                  kind: "fail",
                  message:
                    cause instanceof Error
                      ? cause.message
                      : "Riwayat gagal dimuat",
                  offline: true,
                });
            })
    }, [dispatch]);

    useEffect(() => {
        mounted.current = true;

        return () => {
            mounted.current = false;
            control.current?.abort();
        }
    }, [])


    useEffect(() => {
        if (!enabled) return;

        request(1, true);
    }, [enabled, request]);

    const reload = useCallback((): void => {
        request(1, true);
    }, [request]);

    const loadMore = useCallback((): void => {
      if (state.loadingMore) return;
      if (state.items.length >= state.total) return;

      request(state.page + 1, false);
    }, [
      request,
      state.items.length,
      state.loadingMore,
      state.page,
      state.total,
    ]);

    return {
      items: state.items,
      total: state.total,
      status: state.status,
      origin: ENV.mock ? "mock" : "live",
      error: state.error,
      updatedAtMs: state.updatedAtMs,
      hasMore: state.items.length < state.total,
      loadingMore: state.loadingMore,
      reload,
      loadMore,
    };
}