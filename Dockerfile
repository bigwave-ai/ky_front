# Node.js의 최신 버전을 기반 이미지로 사용
FROM node:21.7.1

# 컨테이너 내에서 코드를 저장할 작업 디렉토리 설정
WORKDIR /app

# package.json 및 package-lock.json 파일을 작업 디렉토리로 복사
COPY package*.json ./

# 프로젝트 의존성 설치
RUN npm install

# 나머지 프로젝트 파일을 컨테이너로 복사
COPY . .

# Next.js 실행 파일에 실행 권한 부여
RUN chmod +x /app/node_modules/.bin/next

# 4) Prisma Client 생성(확실히 보장)
RUN npx prisma generate

# 환경변수들
ENV DB_URL="postgresql://postgres:Manair5568.@34.47.96.225:5432/postgres?sslmode=require"

ENV NEXT_PUBLIC_API_URL=http://121.181.165.130:8124
ENV NEXT_PUBLIC_SITE_URL=http://121.181.165.130:13030
ENV NEXT_PUBLIC_DATA_API_URL=http://121.181.165.130:8123

ENV NEXT_PUBLIC_PYTHON_URL=http://121.181.165.130:8000

# Next.js 앱 빌드
RUN npm run build

# 앱 실행
CMD ["npm", "start"]