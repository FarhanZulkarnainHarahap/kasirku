# Kasirku Product Assets

The 20 WebP files in `web/public/products` are synthetic, photorealistic demo
catalog images generated with the built-in imagegen tool. They are not photos of
actual inventory or branded merchandise. Existing uploaded product photos remain
preferred by the API. Old demo SVG and random-image URLs receive these photos.

## Generation Brief

Each product was generated separately. Shared direction: a single photorealistic
studio catalog photograph, whole product centered on a white background with
generous margins, soft natural lighting and realistic contact shadow. Square
composition, realistic textures, no text, branding, watermark, illustration or CGI
appearance. Images were resized to 640 pixels and encoded as WebP at quality 85.

| Filename | Product-specific prompt subject |
| --- | --- |
| air-mineral-600ml.webp | Clear 600ml mineral-water bottle, blue cap, pale blue blank label, condensation |
| americano.webp | Transparent glass of hot black Americano coffee without milk, delicate steam |
| kopi-susu-gula-aren.webp | Clear cup of iced Indonesian palm-sugar milk coffee, espresso, milk and palm-sugar layers |
| matcha-latte.webp | Clear glass of iced green matcha latte with white milk layers |
| croissant-butter.webp | Golden French butter croissant, crisp laminated flaky pastry |
| roti-cokelat.webp | Soft Indonesian bread bun cut open to reveal dark chocolate filling |
| nasi-goreng-spesial.webp | Indonesian fried rice, sunny-side-up egg, chicken, cucumber and prawn crackers on a white plate |
| mie-goreng.webp | Indonesian stir-fried yellow noodles, vegetables and chicken on a white plate |
| keripik-kentang.webp | Thin crispy golden potato chips in a small white bowl |
| biskuit-cokelat.webp | Dark cocoa sandwich biscuits with chocolate cream filling |
| kacang-panggang.webp | Roasted shelled peanuts in a small white bowl |
| cokelat-bar.webp | Segmented milk chocolate bar partly unwrapped in silver foil |
| sabun-mandi.webp | Mint-green oval bath soap with a few water drops |
| sampo-170ml.webp | Small pearl-white shampoo bottle, dark green flip-top cap and blank green label |
| tisu-wajah.webp | Pale blue rectangular facial-tissue box with a white tissue pulled through the opening |
| deterjen-800g.webp | Upright sealed blue-and-white 800g powder-detergent refill pouch, flexible plastic folds, not a liquid jug |
| kemeja-oxford.webp | Pale blue long-sleeve Oxford cotton shirt, collar, full button placket, cuffs and woven texture |
| kaos-basic.webp | Plain forest-green cotton crew-neck short-sleeve T-shirt, no collar or buttons |
| kabel-usb-c.webp | Black coiled USB-C to USB-C cable with both symmetrical male connectors visible |
| charger-20w.webp | Compact white USB-C wall charger with two round European prongs and one USB-C port |

## Logo

The code-native mark combines a receipt silhouette with a bold K, using the
Kasirku charcoal/lime palette. Editable source: `web/public/icon.svg`.
Run `node scripts/build-favicon.mjs` from `web` to regenerate the ICO at
16, 32, 48, 64, 128 and 256 pixels, plus the 180px Apple touch icon.
