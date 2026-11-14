import { Link, useParams } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import CampaignShowcase from "../components/home/CampaignShowcase";
import ProductSkeletonGrid from "../components/product/ProductSkeleton";
import { useAsync } from "../hooks/useAsync";
import { useSeo } from "../hooks/useSeo";
import { extraService } from "../services/extra.service";
import { promotionService } from "../services/promotion.service";

export default function CampaignPage() {
  const { id = "" } = useParams();
  const showcase = useAsync(() => extraService.campaign(id), [id]);
  const fridayPromos = useAsync(() => promotionService.live("FRIDAY").catch(() => []), []);
  const campaign = showcase.data?.campaign;
  useSeo({ title: campaign?.name ?? "Kampaniya", description: campaign?.description ?? undefined });

  if (showcase.loading && !showcase.data) return <ProductSkeletonGrid count={8} />;
  if (showcase.error || !showcase.data || !campaign || (showcase.data.status === "live" && showcase.data.products.length === 0)) {
    return (
      <EmptyState
        title="Bu kampaniya bitib və ya hazırda aktiv deyil."
        action={
          <Link to="/products" className="btn-primary">
            Məhsullara bax
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <CampaignShowcase
        data={showcase.data}
        friday={campaign.fridayOnly}
        full
        promotions={campaign.fridayOnly ? (fridayPromos.data ?? []).filter((promo) => !promo.campaign || promo.campaign.id === campaign.id) : []}
        onExpire={() => void showcase.reload()}
      />
    </div>
  );
}
