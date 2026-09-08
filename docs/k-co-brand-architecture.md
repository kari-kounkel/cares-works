# K Co LLC — master brand architecture

_Kari's standing direction, 2026-09-08. This governs every design decision in this
repo and outside it. Read it before restyling anything._

K Co LLC is the parent company and ownership structure for a collection of
businesses, brands, creative properties, products, books, tools, and websites.

## Important

**K Co is NOT a master visual brand that its properties must resemble.**

The purpose of K Co branding is to establish ownership, provenance, and
organizational structure — **not** visual uniformity.

Each K Co property is intentionally allowed to have its own complete visual world.

| Property | Its own world |
| --- | --- |
| CARES / CARES Works | Neon, electric, modern, systems/problem-solving energy. Preserve its independent identity. |
| KariKounkel.com | Pink/purple, marbles, personal, creative, editorial, playful. Preserve its independent identity. |
| Ladybug | Its own Ladybug visual universe. Do not introduce K Co pink, marbles, CARES neon, or other parent-brand elements simply to create consistency. |
| Court of Accounts / accounts.karikounkel.com | Its own royal/accounting/chicken universe. Preserve its independent visual identity. |

Books, projects, microsites, tools, programs, and future properties may each have
completely different art direction. **This is intentional.**

## Core rule

- Do not redesign, recolor, restyle, or standardize a K Co property merely to make
  it visually match another K Co property.
- Do not create a universal K Co component library and propagate its visual styles
  into independent properties.
- Do not make all buttons, fonts, colors, illustrations, cards, or layouts
  consistent across the K Co ecosystem.

Consistency should exist **within** a property, not necessarily **between**
properties.

## K Co's role

K Co functions primarily as a **maker's mark**. The relationship between a
property and K Co may be communicated through:

- a small K Co mark in the footer
- "A K Co LLC company"
- "A K Co LLC creation"
- legal/copyright attribution
- About information
- publishing/imprint information
- a small monochrome maker's mark
- other quiet provenance treatments

The K Co mark should never compete with the property's primary logo.

The K Co mark must have adaptable versions: **full-color, single-color,
white/reversed, dark, and a simplified K-only mark** — so K Co attribution can live
inside completely different visual environments without imposing K Co's colors on
them.

> Think of K Co as the signature on the painting, not the paint palette.

## Brand hierarchy

```
K CO LLC
    |
    +-- independent businesses/brands
    |
    +-- publishing/imprints
    |
    +-- books and creative properties
    |
    +-- tools and digital products
    |
    +-- personal brand properties
    |
    +-- future things not yet invented
```

Do not assume that two things owned by K Co should look alike.

When a new property is created, first determine whether it:

1. belongs inside an existing brand, **or**
2. deserves its own visual world.

Do not automatically apply K Co styling.

## Design principle

**K Co provides STRUCTURE without imposing SAMENESS.**

The portfolio should feel curated because the ideas, voice, quality, and provenance
connect it — not because everything uses the same colors.

When choosing between:

- **A.** making two K Co properties look more consistent, or
- **B.** protecting the distinctive personality of each property

choose **B** unless explicitly instructed otherwise.

---

## How this lands in this repo

- **The invoice maker (`/invoices`) already obeys this by construction.** A brand
  is a row in `invoice_brands` carrying its own logo, colors, fonts, paper and
  images; nothing is shared between brands and no brand inherits from another.
  Court of Accounts wears parchment and the egg's brown; CARES Consulting wears its
  neon mark; K Co LLC wears pink and gold. None of them were made to match.
- **An invoice from K Co LLC is K Co's own document**, which is why the K Co
  Creative mark leads that page at full size. That is not the maker's mark being
  imposed on a property — it is the property. An invoice raised for Ladybug or any
  other property would be its own brand row, in that property's world, with K Co
  appearing only as provenance if at all.
- **`src/design/neon.jsx` is the CARES Works design system, not a K Co one.** It
  belongs to CARES/CARES Works and to the app's own chrome. It is not to be
  propagated into other properties to make them consistent.
- **The maker's-mark variants do not exist yet.** There is one full-color K Co
  logo (`public/k-co-creative-logo.png`). Single-color, reversed, dark and the
  K-only mark are not drawn, so quiet provenance treatments have nothing to use.
