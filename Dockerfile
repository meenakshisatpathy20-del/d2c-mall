# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_RAZORPAY_KEY_ID=""
ARG VITE_API_BASE="/api"
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID VITE_API_BASE=$VITE_API_BASE
RUN npm run build

# ---------- serve (static SPA) ----------
# The /api functions are designed for Vercel; when self-hosting, run them behind
# the same domain (e.g. with `vercel dev` or a Node adapter) and proxy /api.
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK CMD wget -qO- http://localhost:8080/ >/dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]
