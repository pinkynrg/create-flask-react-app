import os

class Config:
    SQLALCHEMY_DATABASE_URI = 'postgresql://{user}:{password}@{host}/{dbname}'.format(
        user=os.getenv('POSTGRES_USER'),
        password=os.getenv('POSTGRES_PASSWORD'),
        host=os.getenv('POSTGRES_HOST'),
        dbname=os.getenv('POSTGRES_DB')
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = 'your-secret-key'