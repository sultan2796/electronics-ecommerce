import { useI18n } from "../../context/I18nContext";
import { useAsync } from "../../hooks/useAsync";
import { extraService } from "../../services/extra.service";
import ProductGrid from "../home/ProductGrid";
import SectionHeader from "../home/SectionHeader";

export default function RelatedProducts({ productId }: { productId: string }) {
  const { t } = useI18n();
  const related = useAsync(() => extraService.related(productId), [productId]);
  if (!related.data?.items.length) return null;
  return (
    <section className="mt-12">
      <SectionHeader title={related.data.boughtTogether ? t("related.together") : t("related.similar")} />
      <ProductGrid products={related.data.items} scroll />
    </section>
  );
}
