import { useI18n } from "../../context/I18nContext";
import { useStoreConfig } from "../../hooks/useStoreConfig";
import { formatPrice } from "../../utils/format";

export function useDeliveryText() {
  const { t } = useI18n();
  const config = useStoreConfig();
  if (!config) return null;
  if (config.shippingFee <= 0) return t("delivery.allFree");
  return t("delivery.freeFrom", { amount: formatPrice(config.freeShippingMin) });
}
