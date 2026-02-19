# ============================================
# SA Management - Commandes Docker
# ============================================
.PHONY: help up down build rebuild restart logs logs-backend logs-frontend logs-mysql logs-queue shell-backend shell-mysql migrate seed cache-clear cache-build queue-restart db-backup status

DC = docker compose

help: ## Afficher l'aide
	@echo ""
	@echo "  SA Management - Commandes disponibles"
	@echo "  ======================================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ─────────────────────────────────────────
# DÉMARRAGE / ARRÊT
# ─────────────────────────────────────────
up: ## Démarrer tous les services
	$(DC) up -d
	@echo ""
	@echo "  ✅ Services démarrés"
	@echo "  Frontend  → http://192.168.1.45:3001"
	@echo "  Backend   → http://192.168.1.45:8001"
	@echo "  MySQL     → 192.168.1.45:3306"
	@echo ""

down: ## Arrêter tous les services
	$(DC) down

build: ## Construire les images
	$(DC) build --no-cache

rebuild: ## Reconstruire et redémarrer
	$(DC) down
	$(DC) build --no-cache
	$(DC) up -d

restart: ## Redémarrer tous les services
	$(DC) restart

status: ## État des services
	$(DC) ps

# ─────────────────────────────────────────
# LOGS
# ─────────────────────────────────────────
logs: ## Tous les logs
	$(DC) logs -f

logs-backend: ## Logs backend Laravel
	$(DC) logs -f backend

logs-frontend: ## Logs frontend React
	$(DC) logs -f frontend

logs-mysql: ## Logs MySQL
	$(DC) logs -f mysql

logs-queue: ## Logs queue worker
	$(DC) logs -f queue

# ─────────────────────────────────────────
# SHELL
# ─────────────────────────────────────────
shell-backend: ## Shell dans le container backend
	$(DC) exec backend sh

shell-mysql: ## CLI MySQL
	$(DC) exec mysql mysql -u sa_user -psa_password sa_management

shell-frontend: ## Shell dans le container frontend
	$(DC) exec frontend sh

# ─────────────────────────────────────────
# ARTISAN
# ─────────────────────────────────────────
migrate: ## Lancer les migrations
	$(DC) exec backend php artisan migrate

migrate-fresh: ## Reset BDD + migrations + seeders
	$(DC) exec backend php artisan migrate:fresh --seed

seed: ## Lancer les seeders
	$(DC) exec backend php artisan db:seed

cache-clear: ## Vider tous les caches
	$(DC) exec backend php artisan config:clear
	$(DC) exec backend php artisan cache:clear
	$(DC) exec backend php artisan route:clear
	$(DC) exec backend php artisan view:clear
	@echo "✅ Caches vidés"

cache-build: ## Reconstruire les caches
	$(DC) exec backend php artisan config:cache
	$(DC) exec backend php artisan route:cache
	$(DC) exec backend php artisan view:cache
	@echo "✅ Caches reconstruits"

queue-restart: ## Redémarrer le queue worker
	$(DC) exec backend php artisan queue:restart
	$(DC) restart queue

# ─────────────────────────────────────────
# BASE DE DONNÉES
# ─────────────────────────────────────────
db-backup: ## Sauvegarder la BDD (dans ./backups/)
	@mkdir -p backups
	$(DC) exec mysql mysqldump -u sa_user -psa_password sa_management > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup créé dans backups/"

db-restore: ## Restaurer la BDD: make db-restore FILE=backups/backup.sql
	$(DC) exec -T mysql mysql -u sa_user -psa_password sa_management < $(FILE)
	@echo "✅ BDD restaurée depuis $(FILE)"