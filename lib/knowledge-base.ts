import { Document, Source } from "./types"

// Pluang Knowledge Base Documents
export const knowledgeBase: Document[] = [
  {
    id: "doc-1",
    title: "Company Background",
    category: "About Pluang",
    content: `Pluang is an award-winning multi-asset investment platform, founded in 2018 (originally as a gold-only savings app called Emasdigi). Over time it expanded into a broad investment ecosystem covering stocks, crypto, futures, ETFs, mutual funds and options trading.

Its mission is to democratize access to investing for retail customers by enabling a wide variety of financial products under one platform with low minimums and transparent fees.

Pluang has grown rapidly and serves more than 11 million+ users across Southeast Asia.`,
  },
  {
    id: "doc-2",
    title: "US Stocks & ETFs",
    category: "Products",
    content: `Pluang provides access to US Stocks & ETFs:
- Access to 650+ stocks & ETFs including major companies like Apple, Microsoft, Meta and more.
- Fractional shares allow users to invest with small amounts (e.g., from $1).
- Transaction fee: ~0.30% for regular users, ~0.20% for Pluang Plus members (plus 11% VAT).
- Regulatory fees (SEC, TAF, CAT) apply for sales.
- Dividend tax: 15% for regular stock holdings; 30% for leveraged positions.`,
  },
  {
    id: "doc-3",
    title: "Cryptocurrencies & Futures",
    category: "Products",
    content: `Pluang offers comprehensive crypto trading:
- 600+ crypto coins available, including major assets like BTC, ETH, BNB, Solana, XRP.
- Crypto futures trading (up to 25x leverage) can be accessed for more advanced strategies.
- Competitive spread plus transparent buy/sell pricing; fees vary by asset.
- USD Yield (Pluang Cuan): Yield-earning program where users earn interest on crypto holdings like BTC/ETH (competitive APY).`,
  },
  {
    id: "doc-4",
    title: "Options Trading",
    category: "Products",
    content: `Pluang is the first app in Indonesia to offer options trading on US stocks.
- Options trading enables traders to profit in rising or falling markets.
- Advanced order types available: Limit, Stop, Stop-Limit, Stop Loss and Take Profit orders for precise entry/exit.
- Technical charting tools: 50+ indicators and drawing tools via TradingView integration.`,
  },
  {
    id: "doc-5",
    title: "Mutual Funds & Digital Gold",
    category: "Products",
    content: `Pluang offers traditional investment options:

Mutual Funds:
- Over 65 mutual funds across categories like equity, fixed income, and money market.
- Low admin costs and competitive spreads applied per transaction.

Digital Gold:
- Digital gold purchase starting from very small amounts (e.g., Rp 10,000).
- Regulated by Bappebti.`,
  },
  {
    id: "doc-6",
    title: "Trading Tools & Features",
    category: "Features",
    content: `Pluang includes advanced features for both beginner investors and experienced traders:

Portfolio & Investment Features:
- Pocket Portfolios: Pre-defined or custom baskets of assets based on themes or strategies (e.g., tech, dividend stocks).
- Auto-Invest / Dollar-Cost Averaging: Scheduled investing strategy to reduce timing risk and build holdings over time.

Trading Tools for Advanced Users:
- Advanced Order Types: Limit, Stop, Stop-Limit, Stop Loss and Take Profit orders.
- Order Book & Market Depth: Real-time liquidity and trading activity view (especially for crypto).
- Technical Charting Tools: 50+ indicators and drawing tools via TradingView integration.
- Leverage Trading: Up to 4x on selected asset classes for amplified exposure.`,
  },
  {
    id: "doc-7",
    title: "Fees & Pricing",
    category: "Fees",
    content: `Pluang emphasizes fee transparency:

US Stocks & ETFs:
- Transaction fee: ~0.30% for regular users, ~0.20% for Pluang Plus members (plus 11% VAT).
- Regulatory fees (SEC, TAF, CAT) apply for sales.
- Dividend tax: 15% for regular stock holdings; 30% for leveraged positions.

Crypto:
- Competitive spread plus transparent buy/sell pricing; fees vary by asset.

Mutual Funds & Gold:
- Low admin costs and competitive spreads applied per transaction.

Account Fees:
- No deposit or account opening fees.`,
  },
  {
    id: "doc-8",
    title: "Pluang Plus Membership",
    category: "Membership",
    content: `Pluang Plus is a paid membership program offering:
- Lower trading fees (e.g., 0.20% vs 0.30% for US stocks)
- Priority support & servicing
- Exclusive community features and enhanced tools
- Access to premium analytics and insights`,
  },
  {
    id: "doc-9",
    title: "Regulation & Security",
    category: "Safety",
    content: `Pluang products are regulated under strict Indonesian financial authorities:

Regulatory Bodies:
- Crypto & Futures: OJK & Bappebti
- US Stocks & Options: OJK (via PT PG Berjangka)
- Mutual Funds: OJK (APERD licensed)
- Gold: Bappebti

Security Standards:
- ISO/IEC 27001:2013 information security certification.
- Client funds segregated in licensed custodial accounts.
- Advanced crypto custody backed by secure technology partners.

Pluang is compliant with Indonesian trading laws; it is not an unregulated or offshore trading platform.`,
  },
  {
    id: "doc-10",
    title: "Getting Started & Minimum Investment",
    category: "Getting Started",
    content: `How much do you need to start investing with Pluang?

Minimums are very low:
- Crypto and gold: from as little as Rp 10,000
- US stocks: from ~US$1 (fractional shares)
- Mutual funds and ETFs: also accessible with small denominations

No deposit or account opening fees required.
All plans include a 14-day free trial for premium features.`,
  },
  {
    id: "doc-11",
    title: "FAQ - Common Questions",
    category: "FAQ",
    content: `Frequently Asked Questions:

Q: Is Pluang licensed and safe?
A: Yes — Pluang products are regulated by Indonesian authorities (OJK and Bappebti) and employs industry-standard security and custodial measures.

Q: What assets can I invest in with Pluang?
A: Users can currently trade crypto, US stocks & ETFs, options, crypto futures, mutual funds, and digital gold.

Q: Are dividends and yields included?
A: Yes — if you hold eligible US stocks, you may receive dividends (subject to tax). Crypto holdings can earn yields where eligible through Pluang Cuan.

Q: What makes Pluang different?
A: Pluang offers a single app to manage diverse financial products rather than separate apps for different investments.`,
  },
]

// Simple keyword-based search for demo purposes
export function searchKnowledgeBase(query: string): Source[] {
  const queryLower = query.toLowerCase()
  const keywords = queryLower.split(/\s+/).filter((word) => word.length > 2)

  const results: { doc: Document; score: number }[] = []

  for (const doc of knowledgeBase) {
    let score = 0
    const contentLower = doc.content.toLowerCase()
    const titleLower = doc.title.toLowerCase()
    const categoryLower = doc.category.toLowerCase()

    for (const keyword of keywords) {
      if (titleLower.includes(keyword)) {
        score += 5
      }
      if (categoryLower.includes(keyword)) {
        score += 3
      }
      if (contentLower.includes(keyword)) {
        score += 1
        // Count occurrences
        const matches = contentLower.split(keyword).length - 1
        score += Math.min(matches, 5)
      }
    }

    if (score > 0) {
      results.push({ doc, score })
    }
  }

  // Sort by score and take top 3
  results.sort((a, b) => b.score - a.score)

  return results.slice(0, 3).map(({ doc }) => ({
    title: doc.title,
    content: doc.content,
    documentId: doc.id,
  }))
}

// Get full knowledge base as context string
export function getKnowledgeBaseContext(): string {
  return knowledgeBase
    .map((doc) => `## ${doc.title} (${doc.category})\n${doc.content}`)
    .join("\n\n---\n\n")
}
