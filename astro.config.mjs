import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel/serverless";

/*********************************************************
 * Astro Config
 *********************************************************/
/** @type {import('astro').AstroUserConfig} */
export default {
  output: "server",
  adapter: vercel({
    runtime: "nodejs20.x"
  }),
  integrations: [tailwind({
    applyBaseStyles: true,
  })],
  server: {
    port: 4321
  }
};
