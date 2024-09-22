from flask import Blueprint, jsonify
from datetime import datetime, UTC

main_blueprint = Blueprint('main', __name__)

@main_blueprint.route('/api', methods=['GET'])
def server_up():
    return 'server is up!', 200

@main_blueprint.route('/api/utc-datetime', methods=['GET'])
def get_utc_datetime():
    current_utc_datetime = datetime.now(UTC).isoformat() + 'Z'
    return jsonify({"utc_datetime": current_utc_datetime}), 200