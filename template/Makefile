.PHONY: start make_migrations migrate

start:
	poetry run python -m server.app

make_migrations:
	poetry run alembic -c server/alembic.ini revision --autogenerate -m $(name)

migrate:
	poetry run alembic -c server/alembic.ini upgrade head