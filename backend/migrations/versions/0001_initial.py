"""initial campus hustle schema"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Use SQLAlchemy metadata so this migration remains aligned with the models.
    from app.models.base import Base
    from app.models import *  # noqa
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)

def downgrade():
    from app.models.base import Base
    from app.models import *  # noqa
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
