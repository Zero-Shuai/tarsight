# 构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json（只复制这一个文件以利用 Docker 缓存）
COPY package.json ./

# 安装依赖（使用 npm install 而不是 npm ci，因为可能没有 package-lock.json）
RUN npm install

# 复制源代码
COPY . .

# 接受构建时的环境变量参数
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# 设置构建时的环境变量（Next.js 需要在构建时访问这些变量）
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

# 构建应用
RUN npm run build

# 生产阶段
FROM node:20-alpine AS runner

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 修改文件所有者
RUN chown -R nextjs:nodejs /app

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "server.js"]
