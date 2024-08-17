from flask import Blueprint

main_blueprint = Blueprint('main', __name__)

@main_blueprint.route('/', methods=['GET'])
def server_up():
    return 'server is up!', 200