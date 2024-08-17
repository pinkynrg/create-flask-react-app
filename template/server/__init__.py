from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app(config_filename=None):
    app = Flask(__name__)

    if config_filename:
        app.config.from_pyfile(config_filename)
    else:
        app.config.from_object('server.config.Config')

    db.init_app(app)

    # Import and register blueprints/routes here
    from server.routes import main_blueprint
    app.register_blueprint(main_blueprint)

    return app