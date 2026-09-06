/**
 * Vixara Shopify Backend Launch Service & Customer Message Database Store
 * File: backend/shopify-backend-launch.js
 */

const STORAGE_KEY_MESSAGES = "vixara_customer_messages_db";

export const INITIAL_MOCK_LEADS = [
  {
    id: "MSG-1082",
    type: "Concierge Request",
    client: "elena.v@hautecouture.co",
    channel: "WhatsApp",
    size: "S",
    details: "Reserved Cashmere Overcoat (Size S). Coupon VIXARA-VIP-15 claimed.",
    timestamp: "2026-09-06T18:42:00Z",
    status: "QUALIFIED_VIP"
  },
  {
    id: "MSG-1081",
    type: "Product Feedback",
    client: "marcus.k@designers.io",
    channel: "Email",
    size: "N/A",
    details: "Not interested in VX-0417: Price point too high. Requested price-drop notification if under $2,600.",
    timestamp: "2026-09-06T17:15:00Z",
    status: "PRICE_ALERT_SET"
  },
  {
    id: "MSG-1080",
    type: "Access Request",
    client: "julian.rose@atelier.com",
    channel: "Email",
    size: "N/A",
    details: "Requested Private Access to the next curated drop.",
    timestamp: "2026-09-06T16:05:00Z",
    status: "PENDING_INVITE"
  }
];

/**
 * Retrieves all stored customer messages from localStorage or returns defaults.
 */
export function getStoredMessages() {
  if (typeof window === "undefined") return INITIAL_MOCK_LEADS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(INITIAL_MOCK_LEADS));
      return INITIAL_MOCK_LEADS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading customer messages db:", err);
    return INITIAL_MOCK_LEADS;
  }
}

/**
 * Saves a new customer message or lead entry into the database.
 */
export function saveCustomerMessage(entry) {
  const current = getStoredMessages();
  const newMsg = {
    id: `MSG-${Date.now().toString(36).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    status: entry.status || "NEW",
    ...entry
  };
  const updated = [newMsg, ...current];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(updated));
    } catch (err) {
      console.error("Error saving customer message:", err);
    }
  }
  return newMsg;
}

/**
 * Calculates discount pricing based on input launch price.
 */
export function calculateLaunchPricing(inputPrice, discountPercent = 15) {
  const numericPrice = parseFloat(inputPrice) || 0;
  const discountAmount = (numericPrice * discountPercent) / 100;
  const finalPrice = Math.max(0, numericPrice - discountAmount);

  return {
    originalPrice: numericPrice,
    discountPercent,
    discountAmount: Math.round(discountAmount),
    finalPrice: Math.round(finalPrice),
    formattedOriginal: `$${numericPrice.toLocaleString()}`,
    formattedFinal: `$${Math.round(finalPrice).toLocaleString()}`,
    discountCode: `VIXARA-VIP-${discountPercent}`
  };
}

/**
 * Simulates / executes a Shopify Admin API GraphQL product update and launch trigger.
 */
export async function launchProductWithPrice({
  productId = "gid://shopify/Product/vx-0417",
  newPrice = 3240,
  sku = "VX-0417",
  discountPercent = 15
}) {
  const pricing = calculateLaunchPricing(newPrice, discountPercent);
  const timestamp = new Date().toISOString();

  const shopifyGraphQLMutation = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          title
          status
          variants(first: 1) {
            edges {
              node {
                id
                price
                compareAtPrice
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const mutationVariables = {
    input: {
      id: productId,
      status: "ACTIVE",
      variants: [
        {
          sku: sku,
          price: pricing.finalPrice.toString(),
          compareAtPrice: pricing.originalPrice.toString()
        }
      ]
    }
  };

  console.log('[Vixara Shopify Backend API Triggered]', {
    action: 'ONE_CLICK_LAUNCH',
    timestamp,
    productId,
    pricing,
    mutationVariables
  });

  return {
    success: true,
    message: `Product ${sku} launched successfully at ${pricing.formattedFinal} (${discountPercent}% OFF from ${pricing.formattedOriginal})!`,
    timestamp,
    pricing,
    graphQLQuery: shopifyGraphQLMutation,
    variables: mutationVariables
  };
}

/**
 * Processes incoming customer interest lead & saves into database.
 */
export function registerCustomerInterestLead(leadData) {
  return saveCustomerMessage({
    type: "Concierge Request",
    client: leadData.email || "anonymous@client.com",
    channel: leadData.channel || "Email",
    size: leadData.size || "M",
    details: `Reserved piece at price $${leadData.price || '3,240'}. Coupon generated.`,
    status: "QUALIFIED_VIP"
  });
}
