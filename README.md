# Glozin v2.6.0 — Moon SA Store

Shopify theme source for the **Glozin** theme (v2.6.0) by Nextsky, configured for the Moon SA store.

## Theme info

| | |
|---|---|
| Theme | Glozin |
| Version | 2.6.0 |
| Author | Nextsky |
| Documentation | https://nextsky.gitbook.io/glozin-theme |
| Support | https://support.nextsky.co |

## Project structure

```
.
├── assets/       # CSS, JS, images, fonts
├── config/       # Theme settings (settings_schema.json, settings_data.json)
├── layout/       # theme.liquid, password.liquid
├── locales/      # Translation files
├── sections/     # Page sections (100+)
├── snippets/     # Reusable Liquid fragments
└── templates/    # JSON and Liquid templates
```

## Getting started

### Prerequisites

- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli)
- A Shopify store with theme access

### Local development

From this directory:

```bash
shopify theme dev
```

This starts a local preview connected to your store.

### Push to store

```bash
shopify theme push
```

### Pull from store

```bash
shopify theme pull
```

## Setup notes

1. **Purchase code** — Enter your Glozin purchase code in **Theme settings** after uploading (required by the theme author).
2. **Demo content** — Import demo data from the [Glozin documentation](https://nextsky.gitbook.io/glozin-theme) if you want the default layout.
3. **Apps** — Some sections integrate with Judge.me reviews and other apps; configure those in the Shopify admin as needed.

## Key templates

| Template | Purpose |
|---|---|
| `index.json` | Homepage |
| `product.json` | Product page (layout 1) |
| `product.layout-2.json` | Product page (layout 2) |
| `collection.json` | Collection listing |
| `page.wishlist.json` | Wishlist page |
| `page.compare.json` | Product compare page |
| `page.store-location.json` | Store locator |
