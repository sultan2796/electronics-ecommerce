import { Category } from "../../types";
import FigmaIcon, { FigmaIconName } from "../common/FigmaIcon";

const iconBySlug: Record<string, FigmaIconName> = {
  headsets: "headset",
  earphones: "earphones",
  cables: "cable",
};

interface CategoryChipsProps {
  categories: Category[];
  active: string;
  onSelect: (slug: string) => void;
}

export default function CategoryChips({ categories, active, onSelect }: CategoryChipsProps) {
  return (
    <div className="no-scrollbar -mx-5 flex gap-[13px] overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
      {categories.map((category) => {
        const isActive = category.slug === active;
        const icon = iconBySlug[category.slug];
        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(category.slug)}
            className={`flex h-[33.333px] shrink-0 items-center gap-1 rounded-[20px] pr-4 text-xs font-light transition ${
              icon ? "min-w-[122px] pl-0" : "pl-4"
            } ${isActive ? "bg-brand-500 text-white" : "bg-chip text-muted hover:text-ink"}`}
          >
            {icon && (
              <span className="flex size-10 items-center justify-center">
                <FigmaIcon name={icon} className={`h-[17px] w-auto ${isActive ? "brightness-0 invert" : ""}`} />
              </span>
            )}
            <span className="whitespace-nowrap">{category.name}</span>
          </button>
        );
      })}
    </div>
  );
}
