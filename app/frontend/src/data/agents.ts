export interface AgentItem {
  key: string;
  display_name: string;
  description?: string;
  order: number;
  category: 'value' | 'growth' | 'macro' | 'activist' | 'analyst' | 'risk';
  category_name: string;
  investment_style: string;
  biography?: string;
  historical_performance?: {
    description: string;
    notable_calls: Array<{
      year: number;
      description: string;
      outcome: string;
    }>;
  };
  example_analyses?: Array<{
    title: string;
    company: string;
    year: number;
    analysis: string;
    outcome: string;
  }>;
  specialties?: string[];
  limitations?: string[];
}

export const investmentStyles = {
  value: {
    name: '价值投资',
    description: '寻找被低估的优质公司，长期持有',
    icon: '💎',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    philosophy: [
      "Focus on intrinsic value and margin of safety",
      "Long-term investment horizon",
      "Emphasis on company fundamentals",
      "Conservative valuation approach"
    ],
    metrics: [
      "P/E Ratio",
      "Book Value",
      "Free Cash Flow",
      "Margin of Safety"
    ],
    methods: [
      "Fundamental Analysis",
      "Balance Sheet Review",
      "Cash Flow Analysis",
      "Industry Comparison"
    ],
    strengths: [
      "Lower risk profile",
      "Strong downside protection",
      "Proven long-term results",
      "Based on fundamental business value"
    ],
    limitations: [
      "May miss growth opportunities",
      "Requires patience",
      "Can underperform in bull markets",
      "Value traps risk"
    ]
  },
  growth: {
    name: '成长投资',
    description: '投资于高成长潜力的公司和行业',
    icon: '🚀',
    color: 'bg-green-50 border-green-200 text-green-800',
    philosophy: [
      "Emphasis on revenue and earnings growth",
      "Focus on market leadership and innovation",
      "Long-term growth potential",
      "Willing to pay premium for quality"
    ],
    metrics: [
      "Revenue Growth Rate",
      "Market Share",
      "R&D Investment",
      "TAM & Market Opportunity"
    ],
    methods: [
      "Growth Trend Analysis",
      "Market Position Assessment",
      "Innovation Pipeline Review",
      "Competitive Analysis"
    ],
    strengths: [
      "High return potential",
      "Benefits from innovation",
      "Market leadership focus",
      "Future-oriented approach"
    ],
    limitations: [
      "Higher volatility",
      "Valuation risk",
      "Competitive pressure",
      "Market sentiment dependency"
    ]
  },
  macro: {
    name: '宏观投资',
    description: '基于宏观经济趋势进行投资布局',
    icon: '🌍',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
    philosophy: [
      "Global economic trends analysis",
      "Focus on macro indicators",
      "Cross-asset opportunities",
      "Top-down investment approach"
    ],
    metrics: [
      "GDP Growth",
      "Interest Rates",
      "Currency Movements",
      "Global Trade Flows"
    ],
    methods: [
      "Economic Cycle Analysis",
      "Policy Impact Assessment",
      "Global Trends Review",
      "Cross-Market Analysis"
    ],
    strengths: [
      "Broad market perspective",
      "Early trend identification",
      "Multi-asset opportunities",
      "Policy change benefits"
    ],
    limitations: [
      "Timing challenges",
      "Complex analysis required",
      "Policy uncertainty",
      "Market lag effects"
    ]
  },
  activist: {
    name: '激进投资',
    description: '积极介入公司治理，推动价值释放',
    icon: '⚡',
    color: 'bg-orange-50 border-orange-200 text-orange-800',
    philosophy: [
      "Active engagement with management",
      "Focus on corporate governance",
      "Value creation through change",
      "Concentrated positions"
    ],
    metrics: [
      "Corporate Governance",
      "Board Composition",
      "Capital Allocation",
      "Operational Efficiency"
    ],
    methods: [
      "Strategic Review",
      "Operational Analysis",
      "Governance Assessment",
      "Stakeholder Analysis"
    ],
    strengths: [
      "Direct value creation",
      "Management accountability",
      "Strategic influence",
      "Catalyst-driven returns"
    ],
    limitations: [
      "High resource requirements",
      "Concentration risk",
      "Management resistance",
      "Time-intensive process"
    ]
  },
  analyst: {
    name: '专业分析',
    description: '基于专业技术和数据分析',
    icon: '📊',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    philosophy: [
      "Deep fundamental analysis",
      "Quantitative approach",
      "Data-driven decisions",
      "Systematic evaluation process"
    ],
    metrics: [
      "Financial Ratios",
      "Industry Analysis",
      "Competitive Position",
      "Market Trends"
    ],
    methods: [
      "Quantitative Analysis",
      "Technical Analysis",
      "Sentiment Analysis",
      "Pattern Recognition"
    ],
    strengths: [
      "Systematic approach",
      "Objective analysis",
      "Comprehensive coverage",
      "Data-driven insights"
    ],
    limitations: [
      "Model limitations",
      "Data quality dependency",
      "Historical bias",
      "Technical complexity"
    ]
  }
};

export const agents: AgentItem[] = [
  {
    "key": "aswath_damodaran",
    "display_name": "Aswath Damodaran",
    "description": "The Dean of Valuation",
    "order": 0,
    "category": "macro",
    "category_name": "宏观投资派",
    "investment_style": "估值院长，故事与数字并重",
    "biography": `Aswath Damodaran is a Professor of Finance at the Stern School of Business at NYU. Known as the 'Dean of Valuation', 
      he has revolutionized how academics and practitioners approach company valuation. His work combines rigorous financial theory 
      with practical applications, emphasizing that every number has a story and every story needs a number.`,
    "historical_performance": {
      "description": "Known for accurate valuations of major tech companies and market trends",
      "notable_calls": [
        {
          "year": 2017,
          "description": "Warned about Bitcoin bubble",
          "outcome": "Bitcoin crashed from $20,000 to $3,000 in 2018"
        },
        {
          "year": 2020,
          "description": "Tesla valuation analysis",
          "outcome": "Accurately predicted Tesla's potential market cap range"
        }
      ]
    },
    "example_analyses": [
      {
        "title": "Uber Pre-IPO Valuation",
        "company": "Uber",
        "year": 2019,
        "analysis": "Comprehensive valuation considering growth potential, market size, and competitive advantages",
        "outcome": "Valuation closely matched actual trading range post-IPO"
      }
    ],
    "specialties": [
      "Company valuation frameworks",
      "Growth company analysis",
      "Risk assessment models",
      "Emerging market valuations"
    ],
    "limitations": [
      "Pure quantitative focus may miss qualitative factors",
      "Academic approach may be too theoretical",
      "Limited focus on short-term trading",
      "May undervalue disruptive innovations"
    ]
  },
  {
    "key": "ben_graham",
    "display_name": "Ben Graham",
    "description": "The Father of Value Investing",
    "order": 1,
    "category": "value",
    "category_name": "价值投资派",
    "investment_style": "价值投资之父，安全边际理论",
    "biography": `Benjamin Graham (1894-1976) was a British-born American economist and professional investor. He developed 
      value investing and wrote two of investment's foundational texts: Security Analysis (1934) and The Intelligent 
      Investor (1949). His most famous student was Warren Buffett, who credits Graham with laying the foundation for his 
      successful investment philosophy.`,
    "historical_performance": {
      "description": "Graham-Newman Corp averaged 20% annual returns over 20 years (1936-1956)",
      "notable_calls": [
        {
          "year": 1946,
          "description": "GEICO Investment",
          "outcome": "Initial $712,000 investment grew to $400 million by 1972"
        },
        {
          "year": 1949,
          "description": "Published 'The Intelligent Investor'",
          "outcome": "Became the definitive text on value investing"
        }
      ]
    },
    "example_analyses": [
      {
        "title": "Northern Pipeline Analysis",
        "company": "Northern Pipeline",
        "year": 1926,
        "analysis": "Identified significant hidden assets on the balance sheet",
        "outcome": "Company distributed excess cash to shareholders"
      }
    ],
    "specialties": [
      "Net-net working capital analysis",
      "Margin of safety calculations",
      "Balance sheet analysis",
      "Bond-stock arbitrage"
    ],
    "limitations": [
      "Approach may be too conservative in modern markets",
      "Focus on tangible assets may miss intellectual property value",
      "Limited application in service-based economies",
      "May miss growth opportunities"
    ]
  },
  {
    "key": "bill_ackman",
    "display_name": "Bill Ackman",
    "description": "The Activist Investor",
    "order": 2,
    "category": "activist",
    "category_name": "激进投资派",
    "investment_style": "激进投资者，勇于推动变革",
    "biography": `Bill Ackman is the founder and CEO of Pershing Square Capital Management. Known for his 
      activist investing approach, he takes large positions in public companies and pushes for changes to 
      unlock shareholder value. His high-profile investments and public campaigns have made him one of the 
      most watched investors in the market.`,
    "historical_performance": {
      "description": "Pershing Square has delivered 16.5% net annual returns since inception in 2004",
      "notable_calls": [
        {
          "year": 2012,
          "description": "Short position on Herbalife",
          "outcome": "Eventually closed position in 2018 after significant losses"
        },
        {
          "year": 2020,
          "description": "CDS hedge against COVID market crash",
          "outcome": "Turned $27 million into $2.6 billion in March 2020"
        }
      ]
    },
    "example_analyses": [
      {
        "title": "Canadian Pacific Railway Transformation",
        "company": "Canadian Pacific",
        "year": 2011,
        "analysis": "Identified operational inefficiencies and management issues",
        "outcome": "Stock price increased over 150% after management changes"
      }
    ],
    "specialties": [
      "Corporate governance reform",
      "Operational turnarounds",
      "Capital allocation improvement",
      "Strategic alternatives"
    ],
    "limitations": [
      "High-profile approach can create resistance",
      "Concentrated portfolio increases risk",
      "Long time horizon needed for changes",
      "Reputation risk from public campaigns"
    ]
  },
  {
    "key": "cathie_wood",
    "display_name": "Cathie Wood",
    "description": "The Queen of Growth Investing",
    "order": 3,
    "category": "growth",
    "category_name": "成长投资派",
    "investment_style": "颠覆性创新女王，科技成长专家",
    "biography": `Cathie Wood is the founder and CEO of ARK Invest, known for her investments in disruptive innovation. 
      She has revolutionized thematic investing by focusing on companies leading technological breakthroughs in areas like 
      AI, robotics, blockchain, and genomics. Her bold predictions and conviction-based investing style have earned her a 
      significant following.`,
    "historical_performance": {
      "description": "ARK Innovation ETF (ARKK) returned 152% in 2020",
      "notable_calls": [
        {
          "year": 2018,
          "description": "Tesla price target of $4,000 pre-split",
          "outcome": "Tesla reached equivalent of $4,000 in 2021"
        },
        {
          "year": 2020,
          "description": "Bitcoin adoption prediction",
          "outcome": "Institutional adoption increased significantly in 2021"
        }
      ]
    },
    "example_analyses": [
      {
        "title": "Tesla Investment Thesis",
        "company": "Tesla",
        "year": 2019,
        "analysis": "Identified potential in autonomous driving, battery tech, and AI capabilities",
        "outcome": "Stock price increased over 1000% in following years"
      }
    ],
    "specialties": [
      "Disruptive innovation identification",
      "Long-term growth forecasting",
      "Technology convergence analysis",
      "Thematic investing"
    ],
    "limitations": [
      "High volatility in holdings",
      "Concentrated portfolio risk",
      "Vulnerable to interest rate changes",
      "May overvalue growth potential"
    ]
  },
  {
    "key": "charlie_munger",
    "display_name": "Charlie Munger",
    "description": "The Rational Thinker",
    "order": 4,
    "category": "value",
    "category_name": "价值投资派",
    "investment_style": "理性思维者，优秀企业的公平价格",
    "biography": `Charlie Munger, born in 1924, is Warren Buffett's long-time business partner and 
      Vice Chairman of Berkshire Hathaway. Known for his multidisciplinary approach to investing and 
      emphasis on mental models, Munger has helped shape Berkshire's strategy of buying wonderful 
      companies at fair prices, rather than fair companies at wonderful prices.`,
    "historical_performance": {
      "description": "Achieved 19.8% annual returns at Blue Chip Stamps before joining Berkshire",
      "notable_calls": [
        {
          "year": 1977,
          "description": "Investment in GEICO",
          "outcome": "Became one of Berkshire's most successful investments"
        },
        {
          "year": 2008,
          "description": "BYD Investment",
          "outcome": "Turned $232 million into $7.7 billion by 2021"
        }
      ]
    },
    "example_analyses": [
      {
        "title": "Costco Investment",
        "company": "Costco",
        "year": 2000,
        "analysis": "Identified superior business model with strong customer loyalty and efficient operations",
        "outcome": "Stock has returned over 1000% since investment"
      }
    ],
    "specialties": [
      "Mental models application",
      "Business model analysis",
      "Competitive advantage assessment",
      "Long-term value creation"
    ],
    "limitations": [
      "Very high quality standards limit investment opportunities",
      "Extremely patient approach may miss shorter-term gains",
      "Conservative approach to technology",
      "Preference for simple, understandable businesses"
    ]
  },
  {
    "key": "michael_burry",
    "display_name": "Michael Burry",
    "description": "The Big Short Contrarian",
    "order": 5,
    "category": "value",
    "category_name": "价值投资派",
    "investment_style": "大空头逆向投资者，深度价值挖掘",
    "biography": `Michael Burry, born in 1971, is a physician-turned-investor known for his successful 
      bet against the housing bubble in 2008. He founded Scion Capital and gained fame through Michael 
      Lewis's book "The Big Short". His investment approach combines deep value investing with contrarian 
      macro views, focusing on detailed analysis and conviction in unpopular positions.`,
    "historical_performance": {
      "description": "Returns of 489.34% (2000-2008) vs. S&P 500's 3% during same period",
      "notable_calls": [
        {
          "year": 2005,
          "description": "Subprime mortgage short",
          "outcome": "Generated $725 million in profits for investors"
        },
        {
          "year": 2020,
          "description": "GameStop long position",
          "outcome": "Position value increased significantly during 2021 squeeze"
        }
      ]
    },
    "example_analyses": [
      {
        "title": "Housing Market Analysis",
        "company": "Various CDOs",
        "year": 2005,
        "analysis": "Detailed analysis of mortgage-backed securities revealed systemic risks in housing market",
        "outcome": "Successfully predicted and profited from 2008 housing crisis"
      }
    ],
    "specialties": [
      "Deep value investing",
      "Market bubble identification",
      "Contrarian macro analysis",
      "Complex security analysis"
    ],
    "limitations": [
      "High-conviction positions can lead to significant volatility",
      "Contrarian approach can mean long periods of underperformance",
      "Limited communication with investors",
      "May exit positions early due to conviction changes"
    ]
  },
  {
    "key": "peter_lynch",
    "display_name": "Peter Lynch",
    "description": "The 10-Bagger Investor",
    "order": 6,
    "category": "growth",
    "category_name": "成长投资派",
    "investment_style": "十倍股猎手，日常业务成长投资",
    "biography": `Peter Lynch (born 1944) is renowned for his management of the Magellan Fund at Fidelity 
      Investments between 1977 and 1990. During his tenure, the fund's assets grew from $20 million to $14 billion, 
      averaging a 29.2% annual return. Lynch is famous for his "invest in what you know" philosophy and ability to 
      spot high-growth companies in everyday life.`,
    "historical_performance": {
      "description": "Generated 29.2% average annual returns over 13 years at Magellan Fund",
      "notable_calls": [
        {
          "year": 1977,
          "description": "Investment in Dunkin' Donuts",
          "outcome": "Stock increased over 10-fold during his holding period"
        },
        {
          "year": 1985,
          "description": "Investment in Walmart",
          "outcome": "Identified early-stage growth potential in retail giant"
        }
      ]
    },
    "example_analyses": [
      {
        "title": "La Quinta Motels Analysis",
        "company": "La Quinta",
        "year": 1983,
        "analysis": "Identified growing motel chain with strong unit economics and expansion potential",
        "outcome": "Stock became a 'ten-bagger' (10x return)"
      }
    ],
    "specialties": [
      "Retail and consumer businesses",
      "Growth at reasonable price (GARP)",
      "Small-cap growth stocks",
      "Turnaround situations"
    ],
    "limitations": [
      "Approach requires significant time for research",
      "May miss technology-driven disruption",
      "Focus on US domestic companies",
      "Style may be less effective in low-growth environments"
    ]
  },
  {
    "key": "phil_fisher",
    "display_name": "Phil Fisher",
    "description": "The Scuttlebutt Investor",
    "order": 7,
    "category": "growth",
    "category_name": "成长投资派",
    "investment_style": "精细成长投资者，深度调研专家",
    "biography": `Philip Fisher (1907-2004) was a pioneer of growth investing and author of "Common Stocks 
      and Uncommon Profits". His "scuttlebutt" method involved extensive research through industry contacts, 
      competitors, and customers. Fisher influenced many investors, including Warren Buffett, with his focus 
      on high-quality growth companies and long-term holding periods.`,
    "historical_performance": {
      "description": "Achieved exceptional returns through concentrated, long-term investments in growth companies",
      "notable_calls": [
        {
          "year": 1960,
          "description": "Early investment in Texas Instruments",
          "outcome": "Held for several decades with massive returns"
        },
        {
          "year": 1955,
          "description": "Motorola investment",
          "outcome": "Held for over 40 years, generating enormous returns"
        }
      ]
    },
    "example_analyses": [
      {
        "title": "Motorola Growth Analysis",
        "company": "Motorola",
        "year": 1955,
        "analysis": "Identified potential in communications technology and management quality",
        "outcome": "Stock became one of his most successful long-term investments"
      }
    ],
    "specialties": [
      "Deep industry research",
      "Management quality assessment",
      "Technology growth companies",
      "Long-term growth potential"
    ],
    "limitations": [
      "Very time-intensive research process",
      "Highly concentrated portfolio risk",
      "May hold declining companies too long",
      "Limited diversification"
    ]
  },
  {
    "key": "rakesh_jhunjhunwala",
    "display_name": "Rakesh Jhunjhunwala",
    "description": "The Big Bull Of India",
    "order": 8,
    "category": "activist",
    "category_name": "激进投资派",
    "investment_style": "印度股神，大胆持仓"
  },
  {
    "key": "stanley_druckenmiller",
    "display_name": "Stanley Druckenmiller",
    "description": "The Macro Investor",
    "order": 9,
    "category": "macro",
    "category_name": "宏观投资派",
    "investment_style": "宏观投资传奇，不对称机会猎手"
  },
  {
    "key": "warren_buffett",
    "display_name": "Warren Buffett",
    "description": "The Oracle of Omaha",
    "order": 10,
    "category": "value",
    "category_name": "价值投资派",
    "investment_style": "奥马哈先知，寻找优秀公司的合理价格",
    "biography": `Warren Buffett, born in 1930, is one of the most successful investors of all time. 
      As the chairman and CEO of Berkshire Hathaway, he has achieved remarkable returns through 
      value investing principles learned from Benjamin Graham and refined with Charlie Munger. 
      His focus on intrinsic value, durable competitive advantages, and long-term holding periods 
      has created tremendous wealth for Berkshire shareholders.`,
    "historical_performance": {
      "description": "Consistently outperformed the S&P 500 over multiple decades",
      "notable_calls": [
        {
          "year": 1988,
          "description": "Major investment in Coca-Cola",
          "outcome": "Generated over $25 billion in value over three decades"
        },
        {
          "year": 2008,
          "description": "Investment in Goldman Sachs during financial crisis",
          "outcome": "Made $3.7 billion profit on $5 billion investment"
        }
      ]
    },
    "example_analyses": [
      {
        "title": "See's Candies Acquisition",
        "company": "See's Candies",
        "year": 1972,
        "analysis": "Strong brand, pricing power, and high returns on capital with minimal reinvestment needs",
        "outcome": "Generated over $2 billion in profits on $25 million investment"
      }
    ],
    "specialties": [
      "Consumer brands with strong moats",
      "Financial institutions",
      "Insurance businesses",
      "Capital-light businesses with pricing power"
    ],
    "limitations": [
      "Generally avoids technology companies",
      "Prefers large, established businesses",
      "May miss early-stage growth opportunities",
      "Limited international exposure"
    ]
  },
  {
    "key": "technical_analyst",
    "display_name": "Technical Analyst",
    "description": "Chart Pattern Specialist",
    "order": 11,
    "category": "analyst",
    "category_name": "专业分析派",
    "investment_style": "图表模式专家，技术指标分析"
  },
  {
    "key": "fundamentals_analyst",
    "display_name": "Fundamentals Analyst",
    "description": "Financial Statement Specialist",
    "order": 12,
    "category": "analyst",
    "category_name": "专业分析派",
    "investment_style": "财务报表专家，企业价值评估"
  },
  {
    "key": "sentiment_analyst",
    "display_name": "Sentiment Analyst",
    "description": "Market Sentiment Specialist",
    "order": 13,
    "category": "analyst",
    "category_name": "专业分析派",
    "investment_style": "市场情绪专家，投资者心理分析"
  },
  {
    "key": "valuation_analyst",
    "display_name": "Valuation Analyst",
    "description": "Company Valuation Specialist",
    "order": 14,
    "category": "analyst",
    "category_name": "专业分析派",
    "investment_style": "公司估值专家，内在价值计算"
  },
  {
    "key": "risk_manager",
    "display_name": "Risk Manager",
    "description": "Risk Management Specialist",
    "order": 15,
    "category": "risk",
    "category_name": "风险管理派",
    "investment_style": "风险管理专家，投资风险评估"
  },
  {
    "key": "portfolio_manager",
    "display_name": "Portfolio Manager",
    "description": "Portfolio Management Specialist",
    "order": 16,
    "category": "risk",
    "category_name": "风险管理派",
    "investment_style": "投资组合专家，资产配置优化"
  },
  
];

// Get agent by key
export function getAgentByKey(key: string): AgentItem | undefined {
  return agents.find(agent => agent.key === key);
}

// Get agents by category
export function getAgentsByCategory(category: string): AgentItem[] {
  return agents.filter(agent => agent.category === category);
}

// Get default agent to use
export const defaultAgent = agents.find(agent => agent.key === "warren_buffett") || null; 
