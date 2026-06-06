# Polymarket Dashboard

专为交易员设计的 Polymarket 数据看板，提供实时市场数据、流动性分析、价格变动监控等功能。

## 功能特性

- **事件列表**: 展示所有活跃市场，含实时价格和成交量
- **高流动性筛选**: 快速找到大户参与的市场（流动性 > $100K）
- **高成交量筛选**: 发现最活跃的交易市场
- **价格变动监控**: 24小时涨跌排行，捕捉市场动向
- **订单簿深度分析**: Spread 大小分析，量化交易成本

## 技术栈

### 后端
- Node.js + Express + TypeScript
- Polymarket CLOB API (Gamma API)
- 数据缓存 (30秒)

### 前端
- React 18 + TypeScript
- Tailwind CSS
- Axios
- Lucide React Icons

## 快速开始

### 1. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 2. 配置环境变量

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件（可选）:
```
PORT=3001
CACHE_TTL_SECONDS=30
```

### 3. 启动服务

```bash
# 终端 1: 启动后端
cd backend
npm run dev

# 终端 2: 启动前端
cd frontend
npm run dev
```

### 4. 访问

- 前端: http://localhost:3000
- 后端 API: http://localhost:3001

## API 端点

| 端点 | 描述 |
|------|------|
| `GET /api/markets` | 市场列表（支持筛选） |
| `GET /api/markets/categories` | 分类列表 |
| `GET /api/markets/high-liquidity` | 高流动性市场 |
| `GET /api/markets/high-volume` | 高成交量市场 |
| `GET /api/markets/top-movers` | 涨跌排行 |
| `GET /api/markets/price-changes` | 24h 价格变动 |
| `GET /api/markets/:id/orderbook` | 订单簿数据 |
| `GET /api/markets/:id/spread-analysis` | Spread 分析 |

## 交易员使用指南

### 寻找高流动性市场
1. 点击 "高流动性" 标签
2. 筛选流动性 > $500K 或 $1M 的市场
3. 这些市场适合大额交易，滑点较小

### 监控价格变动
1. 点击 "涨跌排行" 标签
2. 按 24h 价格变动排序
3. 发现短期交易机会

### 分析交易成本
1. 查看 Spread 列
2. Spread < 1%: 交易成本较低
3. Spread > 5%: 交易需谨慎

## 项目结构

```
polymarket-dashboard/
├── backend/
│   ├── src/
│   │   ├── routes/      # API 路由
│   │   ├── services/    # 业务逻辑
│   │   ├── types/       # TypeScript 类型
│   │   └── index.ts     # 入口
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # React 组件
│   │   ├── hooks/       # 自定义 Hooks
│   │   ├── services/    # API 服务
│   │   ├── types/       # TypeScript 类型
│   │   ├── utils/       # 工具函数
│   │   └── App.tsx      # 主应用
│   └── package.json
└── README.md
```

## 数据来源

- [Polymarket CLOB API](https://docs.polymarket.com/)
- [Gamma API](https://gamma-api.polymarket.com/)

## License

MIT
