import { useEffect, useState } from "react";
import { api } from "../services/api";

export interface StoreConfig {
  shippingFee: number;
  freeShippingMin: number;
}

let cached: StoreConfig | null = null;
let pending: Promise<StoreConfig | null> | null = null;

const load = () => {
  if (!pending) {
    pending = api
      .get<StoreConfig>("/store/config")
      .then((r) => {
        cached = r.data;
        return cached;
      })
      .catch(() => {
        pending = null;
        return null;
      });
  }
  return pending;
};

export const shippingCost = (config: StoreConfig | null, amount: number) => {
  if (!config || config.shippingFee <= 0 || amount >= config.freeShippingMin) return 0;
  return config.shippingFee;
};

export function useStoreConfig() {
  const [config, setConfig] = useState<StoreConfig | null>(cached);
  useEffect(() => {
    if (cached) return;
    let alive = true;
    void load().then((value) => alive && value && setConfig(value));
    return () => {
      alive = false;
    };
  }, []);
  return config;
}
