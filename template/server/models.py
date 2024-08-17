# Example model class with various field types
# This class is just an example and should be replaced with your actual model.

# class Item(db.Model):
#     id = db.Column(db.Integer, primary_key=True)  # Auto-incrementing primary key (integer)
#     name = db.Column(db.String(100), nullable=False)  # String field with max length 100, not nullable
#     expiration_date = db.Column(db.Date, nullable=False)  # Date field, not nullable
#     opened_date = db.Column(db.Date)  # Date field, can be nullable
#     expiration_days_after_open = db.Column(db.Integer, default=7)  # Integer field with default value
#     user_id = db.Column(db.String(100), nullable=False)  # Foreign key or user identifier, not nullable
#     price = db.Column(db.Float)  # Float field to store price or similar values
#     created_at = db.Column(db.DateTime, default=db.func.current_timestamp())  # Timestamp field with default current time
#     is_active = db.Column(db.Boolean, default=True)  # Boolean field to store active/inactive status
#     description = db.Column(db.Text)  # Text field for long descriptions
#     data = db.Column(db.JSON)  # JSON field to store JSON-encoded data

#     def __repr__(self):
#         return f'<Item {self.name}>'

# Notes:
# - db.Integer: Represents an integer type field.
# - db.String: Represents a string type field with a maximum length.
# - db.Date: Represents a date type field.
# - db.DateTime: Represents a date and time type field.
# - db.Boolean: Represents a boolean type field (True/False).
# - db.Text: Represents a long text field (unlimited length).
# - db.Float: Represents a floating-point number type field.
# - db.JSON: Represents a JSON-encoded data type field.
# - primary_key=True: Marks the field as the primary key for the table.
# - nullable=False: Ensures the field cannot be NULL (must have a value).
# - default=value: Sets a default value for the field.
# - db.func.current_timestamp(): Sets the current timestamp as the default value.