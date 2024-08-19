.PHONY: start_server make_migrations migrate start_client start

start_server:
	PYTHONPATH=server poetry --directory server run python -m app

make_migrations:
	docker compose -f docker-compose.development.yml up -d
	PYTHONPATH=server poetry --directory server run alembic -c server/alembic.ini revision --autogenerate -m $(name)
	docker compose -f docker-compose.development.yml down

migrate:
	PYTHONPATH=server poetry --directory server run alembic -c server/alembic.ini upgrade head

start_client:
	cd client && npm run dev && cd..

start_db:
	docker compose -f docker-compose.development.yml up

start: 
	npx concurrently --names 'frontend, backend, db' -c 'bgBlue.bold,bgMagenta.bold,bgGreen.bold' "make start_client" "make start_server" "make start_db"