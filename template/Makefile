.PHONY: start make_migrations migrate

install:
	poetry --directory server install

start:
	PYTHONPATH=server poetry --directory server run python -m app

make_migrations:
	PYTHONPATH=server poetry --directory server run alembic -c server/alembic.ini revision --autogenerate -m $(name)

migrate:
	PYTHONPATH=server poetry --directory server run alembic -c server/alembic.ini upgrade head