"""replace files with module creations

Revision ID: c4d7e9f1a2b3
Revises: 9753c13b8139
Create Date: 2026-09-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4d7e9f1a2b3'
down_revision: Union[str, Sequence[str], None] = '9753c13b8139'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("DELETE FROM modules WHERE status != 'ready'")

    op.drop_index(op.f('ix_files_user_id'), table_name='files')
    op.drop_index(op.f('ix_files_module_id'), table_name='files')
    op.drop_table('files')

    op.drop_column('modules', 'error_message')
    op.drop_column('modules', 'status')

    op.create_table(
        'module_creations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=16), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('module_id', sa.Integer(), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['module_id'], ['modules.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_module_creations_user_id'),
        'module_creations',
        ['user_id'],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f('ix_module_creations_user_id'), table_name='module_creations'
    )
    op.drop_table('module_creations')

    op.add_column(
        'modules',
        sa.Column(
            'status',
            sa.String(length=16),
            nullable=False,
            server_default='draft',
        ),
    )
    op.add_column('modules', sa.Column('error_message', sa.Text(), nullable=True))

    op.create_table(
        'files',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('module_id', sa.Integer(), nullable=True),
        sa.Column('filename', sa.String(length=512), nullable=False),
        sa.Column('file_type', sa.String(length=16), nullable=False),
        sa.Column('parsed_text', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=16), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_files_module_id'), 'files', ['module_id'], unique=False)
    op.create_index(op.f('ix_files_user_id'), 'files', ['user_id'], unique=False)
