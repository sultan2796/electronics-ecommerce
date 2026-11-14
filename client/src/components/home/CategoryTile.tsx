import { ArrowUpRight, Camera, Gamepad2, Headphones, Laptop, LucideIcon, Monitor, Package, Plug, Smartphone, Speaker, Tablet, Tv, Watch } from "lucide-react";
import { Link } from "react-router-dom";
import { Category } from "../../types";

const iconRules: { test: RegExp; icon: LucideIcon }[] = [
  { test: /smart.?watch|saat|watch|часы/i, icon: Watch },
  { test: /tablet|planşet|планшет|ipad/i, icon: Tablet },
  { test: /laptop|notebook|noutbuk|ноутбук|macbook/i, icon: Laptop },
  { test: /phone|smartfon|telefon|телефон|смартфон/i, icon: Smartphone },
  { test: /headphone|qulaqlıq|наушник|audio|earbud/i, icon: Headphones },
  { test: /speaker|dinamik|колонк/i, icon: Speaker },
  { test: /monitor|монитор/i, icon: Monitor },
  { test: /\btv\b|televizor|телевизор/i, icon: Tv },
  { test: /camera|kamera|камер|foto/i, icon: Camera },
  { test: /game|oyun|console|konsol|игр/i, icon: Gamepad2 },
  { test: /accessor|aksesuar|аксессуар|charger|şarj|cable|kabel/i, icon: Plug },
];

const iconFor = (category: Category) => iconRules.find((rule) => rule.test.test(`${category.slug} ${category.name}`))?.icon ?? Package;

export default function CategoryTile({ category, label }: { category: Category; label: string }) {
  const Icon = iconFor(category);
  return (
    <Link
      to={`/products?category=${category.slug}`}
      className="group relative flex h-full min-h-[132px] flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface p-4 transition-colors duration-300 hover:border-brand-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] sm:p-5"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-brand-500/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
      />
      <span className="flex items-start justify-between">
        <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-brand-500/5 text-brand-600 ring-1 ring-inset ring-brand-500/20 transition duration-300 group-hover:from-brand-500/25 dark:text-brand-500">
          <Icon className="size-5" strokeWidth={1.6} aria-hidden="true" />
        </span>
        <ArrowUpRight
          className="size-4 text-muted opacity-60 transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink group-hover:opacity-100"
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </span>
      <span className="relative mt-4 block">
        <span className="block text-[15px] font-semibold leading-tight text-ink">{category.name}</span>
        <span className="mt-1 block text-xs text-muted">{label}</span>
      </span>
    </Link>
  );
}
