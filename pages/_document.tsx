// NOTE: Minimal Pages Router Document to satisfy Next.js when pages/ exists.
// FUNCTIONAL: Provide a valid default export so Next can prerender /_error and /404 without loader errors.
// STRATEGIC: This repo uses the App Router for the main app; this file avoids build-time errors caused by an empty module.
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
