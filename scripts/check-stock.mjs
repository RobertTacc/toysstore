import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const product = {
  name: "Pokemon First Partner Illustration Collection Series 2",
  url: "https://toysstore.dk/shop/363-pokemon-kort/3518-pokemon-first-partner-illustration-collection-series-2/",
};

const statePath = new URL("../data/state.json", import.meta.url);
const userAgent =
  "Mozilla/5.0 (compatible; ToysstoreStockMonitor/1.0; +https://github.com/)";

const negativeSignals = [
  "ikke på lager",
  "ikke paa lager",
  "udsolgt",
  "sold out",
  "out of stock",
  "notify me",
  "giv mig besked",
];

const positiveSignals = [
  "læg i kurv",
  "laeg i kurv",
  "tilføj til kurv",
  "tilfoej til kurv",
  "add to cart",
  "på lager",
  "paa lager",
  "in stock",
];

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function findJsonLdAvailability(html) {
  const scriptRegex =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const scripts = [...html.matchAll(scriptRegex)].map((match) => match[1]);

  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.trim());
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];

      while (queue.length) {
        const item = queue.shift();
        if (!item || typeof item !== "object") continue;

        const availability = item.availability || item.offers?.availability;
        if (typeof availability === "string") {
          if (/instock/i.test(availability)) return "in_stock";
          if (/outofstock|soldout|discontinued/i.test(availability)) {
            return "out_of_stock";
          }
        }

        for (const value of Object.values(item)) {
          if (Array.isArray(value)) queue.push(...value);
          else if (value && typeof value === "object") queue.push(value);
        }
      }
    } catch {
      // Some shops emit several JSON-LD objects in one tag. Text matching below
      // still gives us a useful answer if that happens.
    }
  }

  return null;
}

function detectStockStatus(html) {
  const structuredStatus = findJsonLdAvailability(html);
  if (structuredStatus) return structuredStatus;

  const text = stripHtml(html).toLowerCase();
  const hasNegative = negativeSignals.some((signal) => text.includes(signal));
  const hasPositive = positiveSignals.some((signal) => text.includes(signal));

  if (hasNegative && !hasPositive) return "out_of_stock";
  if (hasPositive && !hasNegative) return "in_stock";

  // If both kinds of words appear, cart/purchase controls are the stronger sign.
  if (hasPositive && /læg i kurv|laeg i kurv|tilføj til kurv|tilfoej til kurv|add to cart/.test(text)) {
    return "in_stock";
  }

  return "unknown";
}

async function loadState() {
