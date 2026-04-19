"use client";

import { defineRegistry } from "@json-render/react";
import { createContext, useContext } from "react";

import { cn } from "@/lib/utils";

import { quoteDocumentCatalog } from "./catalog";

type ChromeState = {
  theme: "editorial" | "executive" | "technical";
  density: "airy" | "balanced" | "compact";
  accent: "sand" | "forest" | "ink";
  lang: "fr" | "en";
};

const DocumentChromeContext = createContext<ChromeState>({
  theme: "executive",
  density: "balanced",
  accent: "sand",
  lang: "fr",
});

function useDocumentChrome() {
  return useContext(DocumentChromeContext);
}

function chromeClasses(chrome: ChromeState) {
  const density =
    chrome.density === "airy"
      ? {
          pagePadding: "px-10 py-12",
          stack: "space-y-7",
          cardPadding: "p-6",
        }
      : chrome.density === "compact"
        ? {
            pagePadding: "px-7 py-8",
            stack: "space-y-4",
            cardPadding: "p-4",
          }
        : {
            pagePadding: "px-8 py-10",
            stack: "space-y-5",
            cardPadding: "p-5",
          };

  const accent =
    chrome.accent === "forest"
      ? {
          badge: "bg-emerald-500/10 text-emerald-900",
          border: "border-emerald-500/20",
          tint: "from-emerald-100/70 via-white to-white",
          panel: "bg-[linear-gradient(180deg,rgba(241,251,247,0.95),rgba(255,255,255,0.98))]",
        }
      : chrome.accent === "ink"
        ? {
            badge: "bg-slate-950/8 text-slate-900",
            border: "border-slate-950/12",
            tint: "from-slate-200/50 via-white to-white",
            panel: "bg-[linear-gradient(180deg,rgba(244,247,250,0.95),rgba(255,255,255,0.98))]",
          }
        : {
            badge: "bg-amber-500/10 text-amber-900",
            border: "border-amber-500/20",
            tint: "from-orange-100/80 via-white to-white",
            panel: "bg-[linear-gradient(180deg,rgba(255,248,239,0.96),rgba(255,255,255,0.99))]",
          };

  const theme =
    chrome.theme === "editorial"
      ? {
          heroTitle: "text-[2rem] leading-[1.05] tracking-[-0.05em]",
          heroPanel: "rounded-[2rem] border border-black/5 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(255,243,228,0.96)_60%,rgba(255,255,255,0.98))] p-7",
        }
      : chrome.theme === "technical"
        ? {
            heroTitle: "text-[1.8rem] leading-[1.1] tracking-[-0.035em]",
            heroPanel: "rounded-[1.75rem] border border-black/6 bg-[linear-gradient(180deg,rgba(247,249,252,0.98),rgba(255,255,255,0.98))] p-6",
          }
        : {
            heroTitle: "text-[1.95rem] leading-[1.08] tracking-[-0.04em]",
            heroPanel: "rounded-[1.85rem] border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(250,245,238,0.98))] p-6",
          };

  return {
    ...density,
    ...accent,
    ...theme,
  };
}

const previewRegistry = defineRegistry(quoteDocumentCatalog, {
  components: {
    ProposalDocument: ({ props, children }) => (
      <DocumentChromeContext.Provider
        value={{
          theme: props.theme,
          density: props.density,
          accent: props.accent,
          lang: props.lang,
        }}
      >
        <div className="mx-auto flex w-full max-w-[58rem] flex-col gap-7 px-4 py-6 md:px-6">
          {children}
        </div>
      </DocumentChromeContext.Provider>
    ),
    ProposalPage: ({ props, children }) => {
      const chrome = useDocumentChrome();
      const classes = chromeClasses(chrome);

      return (
        <article
          className={cn(
            "relative overflow-hidden rounded-[2rem] border bg-white shadow-[0_24px_72px_-42px_rgba(15,23,42,0.48)]",
            classes.border,
          )}
        >
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-90",
              classes.tint,
            )}
          />
          <div className={cn("relative min-h-[58rem]", classes.pagePadding)}>
            <div className={cn("flex flex-col", classes.stack)}>
              {(props.eyebrow || props.label) && (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    {props.eyebrow && (
                      <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                        {props.eyebrow}
                      </p>
                    )}
                    <p className="mt-2 text-sm font-medium tracking-[0.01em] text-foreground/70">
                      {props.label}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]", classes.badge)}>
                    {props.tone}
                  </span>
                </div>
              )}
              {children}
            </div>
          </div>
        </article>
      );
    },
    HeroSection: ({ props }) => {
      const chrome = useDocumentChrome();
      const classes = chromeClasses(chrome);

      return (
        <section className={classes.heroPanel}>
          {props.eyebrow && (
            <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              {props.eyebrow}
            </p>
          )}
          <h2 className={cn("mt-3 max-w-[18ch] font-semibold text-foreground", classes.heroTitle)}>
            {props.title}
          </h2>
          {props.subtitle && (
            <p className="mt-3 max-w-[38rem] text-base leading-7 text-foreground/78">
              {props.subtitle}
            </p>
          )}
          {props.summary && (
            <p className="mt-4 max-w-[42rem] text-sm leading-7 text-muted-foreground">
              {props.summary}
            </p>
          )}
          {props.badge && (
            <div className="mt-6">
              <span className={cn("rounded-full px-3 py-1.5 text-[11px] font-medium", classes.badge)}>
                {props.badge}
              </span>
            </div>
          )}
        </section>
      );
    },
    StatsGrid: ({ props }) => {
      const chrome = useDocumentChrome();
      const classes = chromeClasses(chrome);

      return (
        <section className="space-y-3">
          {props.title && (
            <h3 className="text-sm font-semibold tracking-[0.01em] text-foreground">
              {props.title}
            </h3>
          )}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {props.items.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className={cn(
                  "rounded-[1.35rem] border bg-white/80 backdrop-blur",
                  classes.border,
                  classes.cardPadding,
                )}
              >
                <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      );
    },
    NarrativeSection: ({ props }) => {
      const chrome = useDocumentChrome();
      const classes = chromeClasses(chrome);

      return (
        <section
          className={cn(
            "rounded-[1.5rem] border bg-white/84",
            classes.border,
            classes.cardPadding,
          )}
        >
          {props.eyebrow && (
            <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              {props.eyebrow}
            </p>
          )}
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            {props.title}
          </h3>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {props.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-sm leading-7 text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      );
    },
    ServiceCardsSection: ({ props }) => {
      const chrome = useDocumentChrome();
      const classes = chromeClasses(chrome);

      return (
        <section className="space-y-4">
          {props.eyebrow && (
            <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              {props.eyebrow}
            </p>
          )}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              {props.title}
            </h3>
            {props.intro && (
              <p className="max-w-[26rem] text-sm leading-6 text-muted-foreground">
                {props.intro}
              </p>
            )}
          </div>
          <div className="grid gap-3">
            {props.items.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className={cn(
                  "rounded-[1.5rem] border bg-white/82",
                  classes.border,
                  classes.cardPadding,
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {item.eyebrow && (
                      <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                        {item.eyebrow}
                      </p>
                    )}
                    <h4 className="mt-2 text-base font-semibold text-foreground">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>
                  {item.amount && (
                    <span className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", classes.badge)}>
                      {item.amount}
                    </span>
                  )}
                </div>
                {item.meta.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.meta.map((meta, metaIndex) => (
                      <span
                        key={`${meta}-${metaIndex}`}
                        className="rounded-full border border-black/6 bg-black/[0.03] px-2.5 py-1 text-[11px] text-foreground/72"
                      >
                        {meta}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    },
    TotalsHighlight: ({ props }) => {
      const chrome = useDocumentChrome();
      const classes = chromeClasses(chrome);

      return (
        <section className={cn("rounded-[1.5rem] border", classes.border, classes.panel, classes.cardPadding)}>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            {props.title}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {props.amount}
          </p>
          {props.caption && (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {props.caption}
            </p>
          )}
        </section>
      );
    },
    BulletListSection: ({ props }) => {
      const chrome = useDocumentChrome();
      const classes = chromeClasses(chrome);

      return (
        <section
          className={cn(
            "rounded-[1.5rem] border bg-white/84",
            classes.border,
            classes.cardPadding,
          )}
        >
          {props.eyebrow && (
            <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              {props.eyebrow}
            </p>
          )}
          <h3 className="mt-2 text-base font-semibold text-foreground">
            {props.title}
          </h3>
          <ul className="mt-4 space-y-3">
            {props.items.map((item, index) => (
              <li key={`${item}-${index}`} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                <span
                  className={cn(
                    "mt-2 size-1.5 shrink-0 rounded-full",
                    props.tone === "warning"
                      ? "bg-amber-600"
                      : props.tone === "warm"
                        ? "bg-rose-500"
                        : "bg-slate-500",
                  )}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      );
    },
    PeopleGridSection: ({ props }) => {
      const chrome = useDocumentChrome();
      const classes = chromeClasses(chrome);

      return (
        <section className="space-y-4">
          {props.eyebrow && (
            <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              {props.eyebrow}
            </p>
          )}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              {props.title}
            </h3>
            {props.intro && (
              <p className="max-w-[26rem] text-sm leading-6 text-muted-foreground">
                {props.intro}
              </p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {props.people.map((person, index) => (
              <div
                key={`${person.name}-${index}`}
                className={cn(
                  "rounded-[1.4rem] border bg-white/82",
                  classes.border,
                  classes.cardPadding,
                )}
              >
                <h4 className="text-base font-semibold text-foreground">
                  {person.name}
                </h4>
                {person.role && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {person.role}
                  </p>
                )}
                {person.bio && (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {person.bio}
                  </p>
                )}
                {person.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {person.skills.map((skill, skillIndex) => (
                      <span
                        key={`${skill}-${skillIndex}`}
                        className="rounded-full border border-black/6 bg-black/[0.03] px-2.5 py-1 text-[11px] text-foreground/72"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    },
    LogoCloudSection: ({ props }) => {
      const chrome = useDocumentChrome();
      const classes = chromeClasses(chrome);

      return (
        <section
          className={cn(
            "rounded-[1.5rem] border bg-white/84",
            classes.border,
            classes.cardPadding,
          )}
        >
          {props.eyebrow && (
            <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              {props.eyebrow}
            </p>
          )}
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            {props.title}
          </h3>
          {props.intro && (
            <p className="mt-3 max-w-[40rem] text-sm leading-6 text-muted-foreground">
              {props.intro}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2.5">
            {props.logos.map((logo, index) => (
              <span
                key={`${logo}-${index}`}
                className={cn(
                  "rounded-full border bg-white px-3.5 py-2 text-xs font-medium text-foreground/78",
                  classes.border,
                )}
              >
                {logo}
              </span>
            ))}
          </div>
        </section>
      );
    },
    ContactStrip: ({ props }) => {
      const chrome = useDocumentChrome();
      const classes = chromeClasses(chrome);

      return (
        <section className={cn("rounded-[1.5rem] border", classes.border, classes.panel, classes.cardPadding)}>
          <h3 className="text-base font-semibold text-foreground">
            {props.title}
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {chrome.lang === "fr" ? "Prepare pour" : "Prepared for"}
              </p>
              <div className="mt-2 space-y-1.5 text-sm text-foreground/78">
                {props.preparedFor.map((line, index) => (
                  <p key={`${line}-${index}`}>{line}</p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {chrome.lang === "fr" ? "Prepare par" : "Prepared by"}
              </p>
              <div className="mt-2 space-y-1.5 text-sm text-foreground/78">
                {props.preparedBy.map((line, index) => (
                  <p key={`${line}-${index}`}>{line}</p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {chrome.lang === "fr" ? "Contact" : "Contact"}
              </p>
              <div className="mt-2 space-y-1.5 text-sm text-foreground/78">
                {props.contactLines.map((line, index) => (
                  <p key={`${line}-${index}`}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      );
    },
  },
});

export const quoteDocumentPreviewRegistry = previewRegistry.registry;
