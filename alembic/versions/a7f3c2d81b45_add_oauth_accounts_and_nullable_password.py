"""add oauth accounts and nullable password hash

Revision ID: a7f3c2d81b45
Revises: c4d7e9f1a2b3
Create Date: 2026-09-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7f3c2d81b45'
down_revision: Union[str, Sequence[str], None] = 'c4d7e9f1a2b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        'users',
        'password_hash',
        existing_type=sa.String(length=255),
        nullable=True,
    )
    op.create_table(
        'oauth_accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('provider', sa.String(length=32), nullable=False),
        sa.Column('provider_account_id', sa.String(length=255), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'provider',
            'provider_account_id',
            name='uq_oauth_accounts_provider_account',
        ),
    )
    op.create_index(
        op.f('ix_oauth_accounts_user_id'),
        'oauth_accounts',
        ['user_id'],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_oauth_accounts_user_id'), table_name='oauth_accounts')
    op.drop_table('oauth_accounts')
    op.alter_column(
        'users',
        'password_hash',
        existing_type=sa.String(length=255),
        nullable=False,
    )
