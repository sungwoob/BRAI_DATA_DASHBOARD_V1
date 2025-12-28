# BRAI_DATA_DASHBOARD_V1

간단한 Node.js 대시보드로 `dataset` 폴더 아래의 genotype/phenotype description JSON 파일을 자동으로 스캔하고, 리스트 뷰 형태로 시각화합니다.

## 실행 방법

```bash
# 도커 환경 포트 포워딩(예: 호스트 59023 → 컨테이너 59023)과 함께 실행
PORT=59023 node server.js
```

서버는 기본적으로 `59023` 포트에서 리스닝하며, 필요 시 `PORT` 환경 변수를 지정하여 다른 포트를 사용할 수 있습니다. 도커 컨테이너에서 실행할 경우 `-p 59023:59023`처럼 포워딩하여 브라우저에서 `http://localhost:59023`으로 접속하면 됩니다.
