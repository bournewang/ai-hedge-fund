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
      description: '寻找被低估的优质公司并长期持有',
      icon: '💎',
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      philosophy: [
        "专注于内在价值和安全边际",
        "长期投资视野",
        "强调公司基本面",
        "保守估值方法"
      ],
      metrics: [
        "市盈率",
        "账面价值",
        "自由现金流",
        "安全边际"
      ],
      methods: [
        "基本面分析",
        "资产负债表审查",
        "现金流分析",
        "行业比较"
      ],
      strengths: [
        "较低风险特征",
        "强大下行保护",
        "经过验证的长期业绩",
        "基于基本商业价值"
      ],
      limitations: [
        "可能错过成长机会",
        "需要耐心",
        "在牛市中可能表现不佳",
        "价值陷阱风险"
      ]
    },
    growth: {
      name: '成长投资',
      description: '投资具有高增长潜力的公司和行业',
      icon: '🚀',
      color: 'bg-green-50 border-green-200 text-green-800',
      philosophy: [
        "强调收入和盈利增长",
        "专注于市场领导地位和创新",
        "长期增长潜力",
        "愿意为优质企业支付溢价"
      ],
      metrics: [
        "收入增长率",
        "市场份额",
        "研发投资",
        "总可及市场机会"
      ],
      methods: [
        "增长趋势分析",
        "市场地位评估",
        "创新管道审查",
        "竞争分析"
      ],
      strengths: [
        "高回报潜力",
        "受益于创新",
        "市场领导地位重点",
        "面向未来的方法"
      ],
      limitations: [
        "较高波动性",
        "估值风险",
        "竞争压力",
        "市场情绪依赖"
      ]
    },
    macro: {
      name: '宏观投资',
      description: '基于宏观经济趋势的投资策略',
      icon: '🌍',
      color: 'bg-purple-50 border-purple-200 text-purple-800',
      philosophy: [
        "全球经济趋势分析",
        "关注宏观指标",
        "跨资产机会",
        "自上而下投资方法"
      ],
      metrics: [
        "GDP增长",
        "利率",
        "汇率变动",
        "全球贸易流"
      ],
      methods: [
        "经济周期分析",
        "政策影响评估",
        "全球趋势审查",
        "跨市场分析"
      ],
      strengths: [
        "广阔市场视野",
        "早期趋势识别",
        "多资产机会",
        "政策变化受益"
      ],
      limitations: [
        "时机选择挑战",
        "需要复杂分析",
        "政策不确定性",
        "市场滞后效应"
      ]
    },
    activist: {
      name: '激进投资',
      description: '积极参与公司治理以释放价值',
      icon: '⚡',
      color: 'bg-orange-50 border-orange-200 text-orange-800',
      philosophy: [
        "积极与管理层接触",
        "关注公司治理",
        "通过变革创造价值",
        "集中持仓"
      ],
      metrics: [
        "公司治理",
        "董事会构成",
        "资本配置",
        "运营效率"
      ],
      methods: [
        "战略审查",
        "运营分析",
        "治理评估",
        "利益相关者分析"
      ],
      strengths: [
        "直接价值创造",
        "管理层问责制",
        "战略影响力",
        "催化剂驱动回报"
      ],
      limitations: [
        "高资源需求",
        "集中度风险",
        "管理层阻力",
        "时间密集过程"
      ]
    },
    analyst: {
      name: '专业分析',
      description: '基于专业技术和数据分析',
      icon: '📊',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      philosophy: [
        "深度基本面分析",
        "量化方法",
        "数据驱动决策",
        "系统评估过程"
      ],
      metrics: [
        "财务比率",
        "行业分析",
        "竞争地位",
        "市场趋势"
      ],
      methods: [
        "量化分析",
        "技术分析",
        "情绪分析",
        "模式识别"
      ],
      strengths: [
        "系统化方法",
        "客观分析",
        "全面覆盖",
        "数据驱动洞察"
      ],
      limitations: [
        "模型局限性",
        "数据质量依赖",
        "历史偏差",
        "技术复杂性"
      ]
    },
    risk: {
      name: '风险管理',
      description: '专注于风险控制和资本保护',
      icon: '🛡️',
      color: 'bg-red-50 border-red-200 text-red-800',
      philosophy: [
        "资本保护优先",
        "风险调整回报",
        "下行保护",
        "组合多样化"
      ],
      metrics: [
        "波动率",
        "最大回撤",
        "夏普比率",
        "风险价值"
      ],
      methods: [
        "风险建模",
        "情景分析",
        "压力测试",
        "对冲策略"
      ],
      strengths: [
        "资本保护",
        "一致回报",
        "下行保护",
        "风险意识"
      ],
      limitations: [
        "可能限制上行潜力",
        "复杂策略",
        "成本考虑",
        "时机选择关键"
      ]
    }
  };
  
  export const agents: AgentItem[] = [
    {
      "key": "aswath_damodaran",
      "display_name": "阿斯沃思·达摩达兰",
      "description": "估值院长",
      "order": 0,
      "category": "macro",
      "category_name": "宏观投资",
      "investment_style": "估值专家，平衡故事与数字",
      "biography": `阿斯沃思·达摩达兰是纽约大学斯特恩商学院的金融学教授。被誉为"估值院长"，
        他彻底改革了学者和从业者处理公司估值的方式。他的工作将严格的金融理论与实际应用相结合，
        强调每个数字都有一个故事，每个故事都需要一个数字。`,
      "historical_performance": {
        "description": "以准确估值主要科技公司和市场趋势而闻名",
        "notable_calls": [
          {
            "year": 2017,
            "description": "警告比特币泡沫",
            "outcome": "比特币在2018年从20,000美元暴跌至3,000美元"
          },
          {
            "year": 2020,
            "description": "特斯拉估值分析",
            "outcome": "准确预测了特斯拉的潜在市值范围"
          }
        ]
      },
      "example_analyses": [
        {
          "title": "优步IPO前估值",
          "company": "优步",
          "year": 2019,
          "analysis": "考虑增长潜力、市场规模和竞争优势的综合估值",
          "outcome": "估值与IPO后实际交易范围密切匹配"
        }
      ],
      "specialties": [
        "公司估值框架",
        "成长型公司分析",
        "风险评估模型",
        "新兴市场估值"
      ],
      "limitations": [
        "纯量化关注可能忽略定性因素",
        "学术方法可能过于理论化",
        "对短期交易关注有限",
        "可能低估颠覆性创新"
      ]
    },
    {
      "key": "ben_graham",
      "display_name": "本杰明·格雷厄姆",
      "description": "价值投资之父",
      "order": 1,
      "category": "value",
      "category_name": "价值投资",
      "investment_style": "价值投资之父，安全边际理论",
      "biography": `本杰明·格雷厄姆（1894-1976）是英裔美国经济学家和专业投资者。他开发了价值投资理念，
        并撰写了两本投资基础著作：《证券分析》（1934年）和《聪明的投资者》（1949年）。
        他最著名的学生是沃伦·巴菲特，巴菲特认为格雷厄姆为他成功的投资理念奠定了基础。`,
      "historical_performance": {
        "description": "格雷厄姆-纽曼公司在20年间（1936-1956）平均年回报率达20%",
        "notable_calls": [
          {
            "year": 1946,
            "description": "GEICO投资",
            "outcome": "初期71.2万美元投资到1972年增长至4亿美元"
          },
          {
            "year": 1949,
            "description": "出版《聪明的投资者》",
            "outcome": "成为价值投资的权威教科书"
          }
        ]
      },
      "example_analyses": [
        {
          "title": "北方管道分析",
          "company": "北方管道",
          "year": 1926,
          "analysis": "识别资产负债表上的重大隐藏资产",
          "outcome": "公司向股东分配了多余现金"
        }
      ],
      "specialties": [
        "净营运资本分析",
        "安全边际计算",
        "资产负债表分析",
        "债券股票套利"
      ],
      "limitations": [
        "在现代市场中方法可能过于保守",
        "专注有形资产可能忽略知识产权价值",
        "在服务型经济中应用有限",
        "可能错过成长机会"
      ]
    },
    {
      "key": "bill_ackman",
      "display_name": "比尔·阿克曼",
      "description": "激进投资者",
      "order": 2,
      "category": "activist",
      "category_name": "激进投资",
      "investment_style": "激进投资者，勇于推动变革",
      "biography": `比尔·阿克曼是潘兴广场资本管理公司的创始人兼首席执行官。以其激进投资方法而闻名，
        他在公共公司中持有大量头寸，并推动变革以释放股东价值。他的高调投资和公开活动使他成为
        市场上最受关注的投资者之一。`,
      "historical_performance": {
        "description": "潘兴广场自2004年成立以来已实现16.5%的年净回报率",
        "notable_calls": [
          {
            "year": 2012,
            "description": "康宝莱空头头寸",
            "outcome": "最终在2018年平仓后遭受重大损失"
          },
          {
            "year": 2020,
            "description": "针对COVID市场崩盘的CDS对冲",
            "outcome": "在2020年3月将2700万美元变成26亿美元"
          }
        ]
      },
      "example_analyses": [
        {
          "title": "加拿大太平洋铁路转型",
          "company": "加拿大太平洋",
          "year": 2011,
          "analysis": "识别运营效率低下和管理问题",
          "outcome": "管理层变更后股价上涨超过150%"
        }
      ],
      "specialties": [
        "公司治理改革",
        "运营转型",
        "资本配置改善",
        "战略替代方案"
      ],
      "limitations": [
        "高调方法可能引起阻力",
        "集中投资组合增加风险",
        "变革需要长期时间",
        "公开活动的声誉风险"
      ]
    },
    {
      "key": "cathie_wood",
      "display_name": "凯茜·伍德",
      "description": "成长投资女王",
      "order": 3,
      "category": "growth",
      "category_name": "成长投资",
      "investment_style": "颠覆性创新女王，科技成长专家",
      "biography": `凯茜·伍德是ARK Invest的创始人兼首席执行官，以投资颠覆性创新而闻名。
        她通过专注于在人工智能、机器人、区块链和基因组学等领域引领技术突破的公司，
        彻底改革了主题投资。她大胆的预测和基于信念的投资风格为她赢得了大量追随者。`,
      "historical_performance": {
        "description": "ARK创新ETF（ARKK）在2020年回报率达152%",
        "notable_calls": [
          {
            "year": 2018,
            "description": "特斯拉拆股前4000美元目标价",
            "outcome": "特斯拉在2021年达到相当于4000美元的水平"
          },
          {
            "year": 2020,
            "description": "比特币采用预测",
            "outcome": "2021年机构采用显著增加"
          }
        ]
      },
      "example_analyses": [
        {
          "title": "特斯拉投资论题",
          "company": "特斯拉",
          "year": 2019,
          "analysis": "识别自动驾驶、电池技术和AI能力的潜力",
          "outcome": "股价在随后几年上涨超过1000%"
        }
      ],
      "specialties": [
        "颠覆性创新识别",
        "长期增长预测",
        "技术融合分析",
        "主题投资"
      ],
      "limitations": [
        "持股高波动性",
        "集中投资组合风险",
        "易受利率变化影响",
        "可能高估增长潜力"
      ]
    },
    {
      "key": "charlie_munger",
      "display_name": "查理·芒格",
      "description": "理性思考者",
      "order": 4,
      "category": "value",
      "category_name": "价值投资",
      "investment_style": "理性思考者，优秀企业的公平价格",
      "biography": `查理·芒格，生于1924年，是沃伦·巴菲特的长期商业伙伴和伯克希尔·哈撒韦的副董事长。
        以其跨学科投资方法和对心理模型的重视而闻名，芒格帮助塑造了伯克希尔以公平价格购买优秀公司
        而非以优秀价格购买公平公司的策略。`,
      "historical_performance": {
        "description": "在加入伯克希尔之前，在蓝筹印花公司实现19.8%的年回报率",
        "notable_calls": [
          {
            "year": 1977,
            "description": "GEICO投资",
            "outcome": "成为伯克希尔最成功的投资之一"
          },
          {
            "year": 2008,
            "description": "比亚迪投资",
            "outcome": "到2021年将2.32亿美元变成77亿美元"
          }
        ]
      },
      "example_analyses": [
        {
          "title": "好市多投资",
          "company": "好市多",
          "year": 2000,
          "analysis": "识别出卓越的商业模式，强大的客户忠诚度和高效运营",
          "outcome": "投资以来股票回报超过1000%"
        }
      ],
      "specialties": [
        "心理模型应用",
        "商业模式分析",
        "竞争优势评估",
        "长期价值创造"
      ],
      "limitations": [
        "极高质量标准限制投资机会",
        "极其耐心的方法可能错过短期收益",
        "对技术的保守态度",
        "偏好简单易懂的业务"
      ]
    },
    {
      "key": "michael_burry",
      "display_name": "迈克尔·巴里",
      "description": "逆向投资专家",
      "order": 5,
      "category": "value",
      "category_name": "价值投资",
      "investment_style": "逆向投资专家，深度价值挖掘",
      "biography": `迈克尔·巴里是Scion Asset Management的创始人，以成功预测2008年次贷危机而闻名。
        他通过深入研究和逆向思维，发现了住房市场泡沫，并通过信用违约互换获得了巨额利润。
        他的投资方法专注于被市场严重低估的深度价值股票。`,
      "historical_performance": {
        "description": "在Scion资产管理公司期间实现489.34%的净回报率",
        "notable_calls": [
          {
            "year": 2005,
            "description": "次贷危机预测",
            "outcome": "通过CDS获得7亿美元利润"
          },
          {
            "year": 2019,
            "description": "GameStop投资",
            "outcome": "在2021年meme股热潮中获得巨额回报"
          }
        ]
      },
      "example_analyses": [
        {
          "title": "次贷危机分析",
          "company": "住房抵押贷款市场",
          "year": 2005,
          "analysis": "深入分析抵押贷款证券，发现系统性风险",
          "outcome": "通过做空获得数亿美元利润"
        }
      ],
      "specialties": [
        "逆向投资",
        "深度研究",
        "系统性风险识别",
        "价值发现"
      ],
      "limitations": [
        "投资时机可能过早",
        "高度集中的投资组合",
        "可能忽视市场情绪",
        "需要极强的风险承受能力"
      ]
    },
    {
      "key": "peter_lynch",
      "display_name": "彼得·林奇",
      "description": "成长投资大师",
      "order": 6,
      "category": "growth",
      "category_name": "成长投资",
      "investment_style": "成长投资大师，投资你了解的",
      "biography": `彼得·林奇在1977年至1990年间管理富达麦哲伦基金，将其资产从2000万美元增长到140亿美元。
        他以"投资你了解的"理念著称，强调个人投资者的优势，并开发了价格/收益增长比(PEG)等估值工具。
        他的投资风格结合了价值和成长投资的元素。`,
      "historical_performance": {
        "description": "麦哲伦基金在13年间年均回报率29.2%",
        "notable_calls": [
          {
            "year": 1982,
            "description": "沃尔玛投资",
            "outcome": "5年内获得超过1000%的回报"
          },
          {
            "year": 1985,
            "description": "福特汽车投资",
            "outcome": "在汽车行业复苏中获得巨额利润"
          }
        ]
      },
      "example_analyses": [
        {
          "title": "沃尔玛成长分析",
          "company": "沃尔玛",
          "year": 1980,
          "analysis": "识别零售革命和规模经济优势",
          "outcome": "成为基金最成功的投资之一"
        }
      ],
      "specialties": [
        "成长股识别",
        "零售行业分析",
        "PEG比率应用",
        "消费趋势研究"
      ],
      "limitations": [
        "需要频繁监控投资组合",
        "可能过度交易",
        "成长股的高波动性",
        "对行业专业知识的依赖"
      ]
    },
    {
      "key": "phil_fisher",
      "display_name": "菲利普·费舍",
      "description": "成长投资之父",
      "order": 7,
      "category": "growth",
      "category_name": "成长投资",
      "investment_style": "成长投资之父，长期持有优质公司",
      "biography": `菲利普·费舍被誉为成长投资之父，他开发了寻找优质成长型公司的系统方法。
        他的15点清单和"闲谈法"研究方法对现代投资产生了深远影响。巴菲特曾说他85%是格雷厄姆，
        15%是费舍，体现了费舍方法的重要性。`,
      "historical_performance": {
        "description": "费舍咨询公司在50年间实现了卓越的长期回报",
        "notable_calls": [
          {
            "year": 1955,
            "description": "摩托罗拉投资",
            "outcome": "持有20年获得超过20倍回报"
          },
          {
            "year": 1960,
            "description": "德州仪器投资",
            "outcome": "在半导体革命中获得巨额收益"
          }
        ]
      },
      "example_analyses": [
        {
          "title": "摩托罗拉成长分析",
          "company": "摩托罗拉",
          "year": 1955,
          "analysis": "识别电子行业的长期增长潜力和公司创新能力",
          "outcome": "成为历史上最成功的成长投资之一"
        }
      ],
      "specialties": [
        "成长型公司识别",
        "长期趋势分析",
        "管理层评估",
        "研发投资分析"
      ],
      "limitations": [
        "需要深入的行业研究",
        "对错误的高成本",
        "忽视估值可能付出过高价格",
        "需要长期投资视角"
      ]
    },
    {
      "key": "rakesh_jhunjhunwala",
      "display_name": "拉凯什·詹胡瓦拉",
      "description": "印度股神",
      "order": 8,
      "category": "activist",
      "category_name": "激进投资",
      "investment_style": "印度股神，长期价值投资",
      "biography": `拉凯什·詹胡瓦拉被誉为"印度的沃伦·巴菲特"，他从5000卢比起家，建立了价值超过45亿美元的投资帝国。
        他以对印度经济的深刻理解和长期投资视角而闻名，特别擅长识别受益于印度经济增长的公司。`,
      "historical_performance": {
        "description": "从1986年开始投资，40年间实现了惊人的复合增长率",
        "notable_calls": [
          {
            "year": 2002,
            "description": "泰坦工业投资",
            "outcome": "持有20年获得超过100倍回报"
          },
          {
            "year": 2003,
            "description": "卢平制药投资",
            "outcome": "在制药行业繁荣中获得巨额收益"
          }
        ]
      },
      "example_analyses": [
        {
          "title": "泰坦工业投资",
          "company": "泰坦工业",
          "year": 2002,
          "analysis": "识别印度中产阶级增长对珠宝需求的推动",
          "outcome": "成为其最成功的长期投资"
        }
      ],
      "specialties": [
        "新兴市场投资",
        "消费趋势分析",
        "长期价值创造",
        "周期性行业投资"
      ],
      "limitations": [
        "专注单一市场风险",
        "对印度经济的依赖",
        "集中投资组合",
        "可能忽视国际机会"
      ]
    },
    {
      "key": "stanley_druckenmiller",
      "display_name": "斯坦利·德鲁肯米勒",
      "description": "宏观投资大师",
      "order": 9,
      "category": "macro",
      "category_name": "宏观投资",
      "investment_style": "宏观投资大师，顶级趋势跟随者",
      "biography": `斯坦利·德鲁肯米勒是世界上最成功的宏观投资者之一，曾与乔治·索罗斯合作管理量子基金。
        他以其杰出的宏观经济洞察力和灵活的投资策略而闻名，能够在各种市场条件下获得出色的回报。`,
      "historical_performance": {
        "description": "30年投资生涯中平均年回报率30%，从未有亏损年份",
        "notable_calls": [
          {
            "year": 1992,
            "description": "做空英镑",
            "outcome": "在一天内获得10亿美元利润"
          },
          {
            "year": 2000,
            "description": "科技股泡沫预测",
            "outcome": "及时退出避免重大损失"
          }
        ]
      },
      "example_analyses": [
        {
          "title": "英镑黑色星期三",
          "company": "英镑汇率",
          "year": 1992,
          "analysis": "识别英国维持欧洲汇率机制的不可持续性",
          "outcome": "历史上最著名的宏观交易之一"
        }
      ],
      "specialties": [
        "宏观经济分析",
        "货币政策解读",
        "趋势识别",
        "风险管理"
      ],
      "limitations": [
        "需要对宏观经济深度理解",
        "高杠杆策略风险",
        "对政策变化的敏感性",
        "需要快速决策能力"
      ]
    },
    {
      "key": "warren_buffett",
      "display_name": "沃伦·巴菲特",
      "description": "奥马哈先知",
      "order": 10,
      "category": "value",
      "category_name": "价值投资",
      "investment_style": "奥马哈先知，长期价值投资",
      "biography": `沃伦·巴菲特是历史上最成功的投资者之一，被誉为"奥马哈先知"。作为伯克希尔·哈撒韦的董事长兼CEO，
        他通过长期持有优质公司的股票，将一家濒临破产的纺织公司转变为市值数千亿美元的投资巨头。
        他的投资理念强调寻找具有持久竞争优势的企业。`,
      "historical_performance": {
        "description": "伯克希尔股价从1965年到2021年年均增长20.1%",
        "notable_calls": [
          {
            "year": 1988,
            "description": "可口可乐投资",
            "outcome": "13亿美元投资现值超过250亿美元"
          },
          {
            "year": 2016,
            "description": "苹果投资",
            "outcome": "成为伯克希尔最大持股，价值超过1600亿美元"
          }
        ]
      },
      "example_analyses": [
        {
          "title": "可口可乐投资分析",
          "company": "可口可乐",
          "year": 1988,
          "analysis": "识别品牌护城河和全球扩张潜力",
          "outcome": "成为伯克希尔历史上最成功的投资"
        }
      ],
      "specialties": [
        "护城河分析",
        "自由现金流评估",
        "管理层评价",
        "长期价值创造"
      ],
      "limitations": [
        "对科技股的保守态度",
        "资金规模限制投资选择",
        "对传统行业的偏好",
        "可能错过快速增长机会"
      ]
    },
    {
      "key": "technical_analyst",
      "display_name": "技术分析师",
      "description": "技术分析专家",
      "order": 11,
      "category": "analyst",
      "category_name": "专业分析",
      "investment_style": "技术分析专家，图表模式识别",
      "biography": `技术分析师专注于通过研究价格走势、交易量和市场指标来预测未来价格变动。
        他们相信市场价格反映了所有可获得的信息，通过识别图表模式和技术指标来做出投资决策。`,
      "historical_performance": {
        "description": "技术分析在短期交易和时机选择方面表现出色",
        "notable_calls": [
          {
            "year": 2020,
            "description": "COVID市场底部识别",
            "outcome": "通过技术指标成功抄底"
          }
        ]
      },
      "example_analyses": [
        {
          "title": "支撑阻力分析",
          "company": "标普500指数",
          "year": 2020,
          "analysis": "识别关键支撑位和反弹信号",
          "outcome": "成功预测市场反弹"
        }
      ],
      "specialties": [
        "图表模式识别",
        "技术指标分析",
        "时机选择",
        "风险控制"
      ],
      "limitations": [
        "无法预测基本面变化",
        "在趋势不明确时表现不佳",
        "可能产生虚假信号",
        "过度依赖历史数据"
      ]
    },
    {
      "key": "fundamentals_analyst",
      "display_name": "基本面分析师",
      "description": "基本面分析专家",
      "order": 12,
      "category": "analyst",
      "category_name": "专业分析",
      "investment_style": "基本面分析专家，财务数据驱动",
      "biography": `基本面分析师通过深入研究公司的财务报表、行业地位、管理层质量和宏观经济环境
        来评估投资价值。他们相信股票的内在价值最终会反映在市场价格中。`,
      "historical_performance": {
        "description": "基本面分析在长期投资中表现卓越",
        "notable_calls": [
          {
            "year": 2009,
            "description": "银行股复苏预测",
            "outcome": "在金融危机后成功识别低估银行股"
          }
        ]
      },
      "example_analyses": [
        {
          "title": "财务健康度分析",
          "company": "科技股",
          "year": 2021,
          "analysis": "通过现金流和债务比率识别优质公司",
          "outcome": "在利率上升环境中表现优异"
        }
      ],
      "specialties": [
        "财务报表分析",
        "行业比较研究",
        "估值模型",
        "盈利预测"
      ],
      "limitations": [
        "分析时间较长",
        "可能忽视市场情绪",
        "对突发事件反应较慢",
        "需要大量数据支持"
      ]
    },
    {
      "key": "sentiment_analyst",
      "display_name": "情绪分析师",
      "description": "市场情绪专家",
      "order": 13,
      "category": "analyst",
      "category_name": "专业分析",
      "investment_style": "市场情绪专家，行为金融学应用",
      "biography": `情绪分析师专注于研究投资者心理和市场情绪对价格的影响。
        他们运用行为金融学原理，通过分析新闻情绪、社交媒体趋势和投资者情绪指标来预测市场变动。`,
      "historical_performance": {
        "description": "在市场转折点和极端情绪时期表现出色",
        "notable_calls": [
          {
            "year": 2021,
            "description": "meme股热潮预测",
            "outcome": "成功识别散户情绪驱动的股价异动"
          }
        ]
      },
      "example_analyses": [
        {
          "title": "社交媒体情绪分析",
          "company": "GameStop",
          "year": 2021,
          "analysis": "通过Reddit和Twitter情绪指标预测价格波动",
          "outcome": "成功预测meme股现象"
        }
      ],
      "specialties": [
        "情绪指标分析",
        "社交媒体监控",
        "行为偏差识别",
        "逆向投资时机"
      ],
      "limitations": [
        "情绪变化的不可预测性",
        "可能被虚假信息误导",
        "短期有效性较高",
        "需要实时数据支持"
      ]
    },
    {
      "key": "valuation_analyst",
      "display_name": "估值分析师",
      "description": "估值建模专家",
      "order": 14,
      "category": "analyst",
      "category_name": "专业分析",
      "investment_style": "估值建模专家，数量化投资",
      "biography": `估值分析师专门构建复杂的财务模型来确定股票的内在价值。
        他们使用DCF模型、比较估值法和其他定量技术来识别被高估或低估的证券。`,
      "historical_performance": {
        "description": "在价值回归和长期投资中表现稳定",
        "notable_calls": [
          {
            "year": 2020,
            "description": "科技股估值泡沫警告",
            "outcome": "2022年科技股大幅回调验证了预测"
          }
        ]
      },
      "example_analyses": [
        {
          "title": "DCF估值模型",
          "company": "亚马逊",
          "year": 2019,
          "analysis": "构建复杂现金流模型评估云业务价值",
          "outcome": "成功识别AWS业务的巨大价值"
        }
      ],
      "specialties": [
        "DCF建模",
        "比较估值",
        "敏感性分析",
        "风险调整收益"
      ],
      "limitations": [
        "模型假设的不确定性",
        "对输入参数敏感",
        "难以量化无形资产",
        "可能忽视市场动态"
      ]
    },
    {
      "key": "risk_manager",
      "display_name": "风险管理师",
      "description": "风险控制专家",
      "order": 15,
      "category": "risk",
      "category_name": "风险管理",
      "investment_style": "风险控制专家，组合保护策略",
      "biography": `风险管理师专注于识别、量化和控制投资组合中的各种风险。
        他们使用先进的风险度量工具和对冲策略来保护投资组合免受不利市场变动的影响。`,
      "historical_performance": {
        "description": "在市场动荡期间表现出色，有效控制下行风险",
        "notable_calls": [
          {
            "year": 2008,
            "description": "金融危机风险预警",
            "outcome": "通过对冲策略显著降低损失"
          }
        ]
      },
      "example_analyses": [
        {
          "title": "VaR风险分析",
          "company": "投资组合",
          "year": 2020,
          "analysis": "计算COVID冲击下的最大可能损失",
          "outcome": "成功实施保护性策略"
        }
      ],
      "specialties": [
        "风险度量",
        "对冲策略",
        "压力测试",
        "相关性分析"
      ],
      "limitations": [
        "可能限制上行潜力",
        "对冲成本较高",
        "极端事件难以预测",
        "模型风险存在"
      ]
    },
    {
      "key": "portfolio_manager",
      "display_name": "投资组合经理",
      "description": "资产配置专家",
      "order": 16,
      "category": "risk",
      "category_name": "风险管理",
      "investment_style": "资产配置专家，多元化投资",
      "biography": `投资组合经理负责构建和管理多元化的投资组合，平衡风险和收益。
        他们运用现代投资组合理论和资产配置策略，为不同风险偏好的投资者优化投资组合。`,
      "historical_performance": {
        "description": "通过多元化和再平衡策略实现稳健的长期回报",
        "notable_calls": [
          {
            "year": 2019,
            "description": "防御性配置",
            "outcome": "在2020年市场波动中表现优异"
          }
        ]
      },
      "example_analyses": [
        {
          "title": "资产配置优化",
          "company": "混合投资组合",
          "year": 2020,
          "analysis": "在低利率环境下调整股债比例",
          "outcome": "实现了风险调整后的优异回报"
        }
      ],
      "specialties": [
        "资产配置",
        "投资组合优化",
        "再平衡策略",
        "风险预算"
      ],
      "limitations": [
        "多元化可能稀释收益",
        "需要持续监控和调整",
        "交易成本较高",
        "可能错过集中投资机会"
      ]
    }
  ];