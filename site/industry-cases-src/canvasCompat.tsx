import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import initialState from "./canvas-state.json";

type ChildrenProps = { children?: ReactNode; style?: CSSProperties };
type Tone = "info" | "success" | "warning" | "danger" | "neutral";
type Setter<T> = (value: T | ((previous: T) => T)) => void;

const statePrefix = "argo-industry-cases:";

export function useCanvasState<T>(key: string, defaultValue: T): [T, Setter<T>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window !== "undefined") {
      const persisted = window.localStorage.getItem(statePrefix + key);
      if (persisted !== null) {
        try {
          return JSON.parse(persisted) as T;
        } catch {
          // Ignore corrupt browser state and use the published state/default.
        }
      }
    }
    return (initialState as Record<string, unknown>)[key] as T ?? defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(statePrefix + key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

export function useHostTheme() {
  return useMemo(() => ({
    text: {
      primary: "var(--ae-text-primary)",
      secondary: "var(--ae-text-secondary)",
      tertiary: "var(--ae-text-tertiary)",
      quaternary: "var(--ae-text-quaternary)",
      link: "var(--ae-link)",
      onAccent: "var(--ae-on-accent)",
    },
    stroke: {
      primary: "var(--ae-stroke-primary)",
      secondary: "var(--ae-stroke-secondary)",
      tertiary: "var(--ae-stroke-tertiary)",
    },
    accent: { primary: "var(--ae-accent)", control: "var(--ae-accent)" },
    bg: {
      editor: "var(--ae-bg)",
      chrome: "var(--ae-surface)",
      elevated: "var(--ae-surface-raised)",
    },
    fill: {
      primary: "var(--ae-fill-primary)",
      secondary: "var(--ae-fill-secondary)",
      tertiary: "var(--ae-fill-tertiary)",
      quaternary: "var(--ae-fill-quaternary)",
    },
  }), []);
}

export function Stack({ children, gap = 12, style }: ChildrenProps & { gap?: number }) {
  return <div className="ae-stack" style={{ gap, ...style }}>{children}</div>;
}

export function Row({
  children,
  gap = 8,
  align = "start",
  justify = "start",
  wrap = false,
  style,
}: ChildrenProps & {
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "space-between";
  wrap?: boolean;
}) {
  const alignItems = align === "start" ? "flex-start" : align === "end" ? "flex-end" : align;
  const justifyContent =
    justify === "start" ? "flex-start" : justify === "end" ? "flex-end" : justify;
  return (
    <div
      className="ae-row"
      style={{ gap, alignItems, justifyContent, flexWrap: wrap ? "wrap" : "nowrap", ...style }}
    >
      {children}
    </div>
  );
}

export function Grid({
  children,
  columns,
  gap = 12,
  align = "stretch",
  style,
}: ChildrenProps & {
  columns: number | string;
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
}) {
  const template = typeof columns === "number"
    ? `repeat(${columns}, minmax(0, 1fr))`
    : columns;
  return (
    <div className="ae-grid" style={{ gridTemplateColumns: template, gap, alignItems: align, ...style }}>
      {children}
    </div>
  );
}

export function Divider({ style }: { style?: CSSProperties }) {
  return <div className="ae-divider" role="separator" style={style} />;
}

const TextNestingContext = createContext(false);

export function Text({
  children,
  tone = "primary",
  size = "body",
  as,
  weight = "normal",
  italic = false,
  truncate,
  style,
}: ChildrenProps & {
  tone?: "primary" | "secondary" | "tertiary" | "quaternary";
  size?: "body" | "small";
  as?: "p" | "span";
  weight?: "normal" | "medium" | "semibold" | "bold";
  italic?: boolean;
  truncate?: boolean | "start" | "end";
}) {
  const nested = useContext(TextNestingContext);
  const Tag = as ?? (nested ? "span" : "p");
  const weights = { normal: 400, medium: 500, semibold: 600, bold: 700 };
  const truncation = truncate
    ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }
    : undefined;
  return (
    <TextNestingContext.Provider value>
      <Tag
        className={`ae-text ae-text--${tone} ae-text--${size}`}
        style={{ fontWeight: weights[weight], fontStyle: italic ? "italic" : undefined, ...truncation, ...style }}
      >
        {children}
      </Tag>
    </TextNestingContext.Provider>
  );
}

export function H1({ children, style }: ChildrenProps) {
  return <h1 className="ae-h1" style={style}>{children}</h1>;
}

export function H2({ children, style }: ChildrenProps) {
  return <h2 className="ae-h2" style={style}>{children}</h2>;
}

export function H3({ children, style }: ChildrenProps) {
  return <h3 className="ae-h3" style={style}>{children}</h3>;
}

export function Link({ children, href, style }: ChildrenProps & { href: string }) {
  return <a className="ae-link" href={href} target="_blank" rel="noreferrer" style={style}>{children}</a>;
}

type CardState = { collapsible: boolean; open: boolean; toggle: () => void };
const CardContext = createContext<CardState>({ collapsible: false, open: true, toggle: () => undefined });

export function Card({
  children,
  variant = "default",
  size = "base",
  stickyHeader = false,
  collapsible = false,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  style,
}: ChildrenProps & {
  variant?: "default" | "borderless";
  size?: "base" | "lg";
  stickyHeader?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const toggle = () => {
    const next = !open;
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  return (
    <CardContext.Provider value={{ collapsible, open, toggle }}>
      <section
        className={`ae-card ae-card--${variant} ae-card--${size}${stickyHeader ? " ae-card--sticky" : ""}`}
        style={style}
      >
        {children}
      </section>
    </CardContext.Provider>
  );
}

export function CardHeader({ children, trailing, style }: ChildrenProps & { trailing?: ReactNode }) {
  const card = useContext(CardContext);
  const content = (
    <>
      {card.collapsible && <span className="ae-chevron" aria-hidden>{card.open ? "⌄" : "›"}</span>}
      <span className="ae-card__title">{children}</span>
      {trailing && <span className="ae-card__trailing">{trailing}</span>}
    </>
  );
  return card.collapsible ? (
    <button className="ae-card__header ae-card__header--button" onClick={card.toggle} aria-expanded={card.open} style={style}>
      {content}
    </button>
  ) : (
    <div className="ae-card__header" style={style}>{content}</div>
  );
}

export function CardBody({ children, style }: ChildrenProps) {
  const card = useContext(CardContext);
  if (card.collapsible && !card.open) return null;
  return <div className="ae-card__body" style={style}>{children}</div>;
}

export function Pill({
  children,
  active = false,
  size = "md",
  disabled = false,
  title,
  style,
  onClick,
}: ChildrenProps & {
  active?: boolean;
  size?: "sm" | "md";
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
}) {
  const className = `ae-pill ae-pill--${size}${active ? " ae-pill--active" : ""}`;
  return onClick ? (
    <button className={className} disabled={disabled} title={title} style={style} onClick={onClick}>{children}</button>
  ) : (
    <span className={className} title={title} style={style}>{children}</span>
  );
}

export function Stat({
  value,
  label,
  tone,
  style,
}: {
  value: ReactNode;
  label: string;
  tone?: "success" | "danger" | "warning" | "info";
  style?: CSSProperties;
}) {
  return (
    <div className={`ae-stat${tone ? ` ae-stat--${tone}` : ""}`} style={style}>
      <div className="ae-stat__value">{value}</div>
      <div className="ae-stat__label">{label}</div>
    </div>
  );
}

export function Callout({
  children,
  tone = "neutral",
  title,
  style,
}: ChildrenProps & { tone?: Tone; title?: ReactNode; icon?: ReactNode }) {
  return (
    <aside className={`ae-callout ae-callout--${tone}`} style={style}>
      {title && <div className="ae-callout__title">{title}</div>}
      <div className="ae-callout__body">{children}</div>
    </aside>
  );
}

export function CollapsibleSection({
  title,
  count,
  trailing,
  children,
  defaultOpen = false,
  style,
}: ChildrenProps & {
  title: string;
  leading?: ReactNode;
  count?: number;
  trailing?: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="ae-collapsible" style={style}>
      <button className="ae-collapsible__header" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="ae-chevron" aria-hidden>{open ? "⌄" : "›"}</span>
        <span>{title}</span>
        {typeof count === "number" && <span className="ae-collapsible__count">{count}</span>}
        {trailing && <span className="ae-collapsible__trailing">{trailing}</span>}
      </button>
      {open && <div className="ae-collapsible__body">{children}</div>}
    </section>
  );
}

export function Table({
  headers,
  rows,
  columnAlign = [],
  rowTone = [],
  framed = true,
  striped = false,
  stickyHeader = false,
  style,
}: {
  headers: ReactNode[];
  rows: ReactNode[][];
  columnAlign?: Array<"left" | "center" | "right" | undefined>;
  rowTone?: Array<Tone | undefined>;
  framed?: boolean;
  striped?: boolean;
  stickyHeader?: boolean;
  style?: CSSProperties;
  emptyMessage?: ReactNode;
}) {
  return (
    <div className={`ae-table-shell${framed ? " ae-table-shell--framed" : ""}`} style={style}>
      <table className={`ae-table${striped ? " ae-table--striped" : ""}${stickyHeader ? " ae-table--sticky" : ""}`}>
        <thead>
          <tr>{headers.map((header, index) => <th key={index} style={{ textAlign: columnAlign[index] }}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowTone[rowIndex] ? `ae-row-tone--${rowTone[rowIndex]}` : undefined}>
              {headers.map((_, columnIndex) => (
                <td key={columnIndex} style={{ textAlign: columnAlign[columnIndex] }}>
                  {columnIndex === 0 && rowTone[rowIndex] && <span className="ae-row-tone" aria-hidden />}
                  {row[columnIndex]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TextInput({
  value = "",
  onChange,
  placeholder,
  disabled,
  type = "text",
  style,
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: "text" | "email" | "password" | "number" | "url" | "search";
  style?: CSSProperties;
}) {
  return (
    <input
      className="ae-input"
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      type={type}
      style={style}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  style,
}: {
  value?: string;
  onChange?: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  disabled?: boolean;
  style?: CSSProperties;
}) {
  return (
    <select className="ae-select" value={value} onChange={(event) => onChange?.(event.target.value)} disabled={disabled} style={style}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
    </select>
  );
}

export function Button({
  children,
  variant = "secondary",
  disabled,
  type = "button",
  style,
  onClick,
}: ChildrenProps & {
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
}) {
  return <button className={`ae-button ae-button--${variant}`} disabled={disabled} type={type} style={style} onClick={onClick}>{children}</button>;
}
