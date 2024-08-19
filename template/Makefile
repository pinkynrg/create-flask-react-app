.PHONY: start_server make_migrations migrate start_client start

start_server:
	PYTHONPATH=server poetry --directory server run python -m app

make_migrations:
	PYTHONPATH=server poetry --directory server run alembic -c server/alembic.ini revision --autogenerate -m $(name)

migrate:
	PYTHONPATH=server poetry --directory server run alembic -c server/alembic.ini upgrade head

start_client:
	cd client && npm run dev && cd..

start: 
	npx concurrently --names 'frontend, backend' -c 'bgBlue.bold,bgMagenta.bold' "make start_client" "make start_server"