git add .

 git commit -m "v.2.0012" 

 git push -u origin main  


 # 1) levantar DB sola y esperar health
docker-compose up -d db
docker-compose ps

# 2) correr reparación (recomendado dentro del contenedor server)
docker-compose exec pasteleria-server node server/scripts/db_repair.js

# 3) levantar todo limpio
docker-compose up --build -d
docker-compose ps

# 4) health check (desde tu Mac)
curl -i http://localhost:3000/api/health

# 5) smoke tests (dentro del server)
docker-compose exec pasteleria-server node server/scripts/smoke_test.js
