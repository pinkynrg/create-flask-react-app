.PHONY: start make_migrations migrate

start:
	poetry run python -m server.app

make_migrations:
	poetry run alembic revision --autogenerate -m $(name)

migrate:
	poetry run alembic upgrade head