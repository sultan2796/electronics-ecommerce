import { OrderStatus } from "../../types";
import { orderStatusLabels, orderStatusStyles } from "../../utils/format";

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${orderStatusStyles[status]}`}>
      {orderStatusLabels[status]}
    </span>
  );
}
