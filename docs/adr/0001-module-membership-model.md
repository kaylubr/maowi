# Module membership model

Ownership stays on `modules.user_id` — one owner per module, the single source of truth — and an invited user who joins becomes a row in a separate `module_members` table, with no roles column. Ownership is a structural fact about the module, while membership is a set that grows and shrinks, so the owner is deliberately never a member row even though the owner also studies the module. Roles can be added later without breaking this schema.

## Considered Options

- **A unified membership table with a role column** (rejected): it would move the single owner out of `modules.user_id` into that table, turning "exactly one owner" from a structural guarantee into an application-level invariant, and it frames members as co-creators when they are competition participants.
